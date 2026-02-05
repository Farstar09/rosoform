-- ROSOIDEAE Temporal Flow Analysis
-- Track discussion momentum using time-series decomposition

-- Function: Decompose discussion activity into trend, seasonal, and random components
CREATE OR REPLACE FUNCTION decompose_discussion_flow(
    p_thread_id VARCHAR,
    p_window_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    time_bucket BIGINT,
    activity_count INTEGER,
    trend_component NUMERIC,
    seasonal_component NUMERIC,
    random_residual NUMERIC,
    momentum_indicator NUMERIC
) AS $$
DECLARE
    v_bucket_size INTEGER := 3600000; -- 1 hour in milliseconds
    v_start_time BIGINT;
    v_end_time BIGINT;
BEGIN
    -- Define analysis window
    v_end_time := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    v_start_time := v_end_time - (p_window_days * 86400000);
    
    RETURN QUERY
    WITH hourly_buckets AS (
        SELECT 
            FLOOR(expressed_moment / v_bucket_size) * v_bucket_size as bucket,
            COUNT(*)::INTEGER as thought_count
        FROM roso_thought_nodes
        WHERE conversation_link = p_thread_id
            AND expressed_moment BETWEEN v_start_time AND v_end_time
        GROUP BY FLOOR(expressed_moment / v_bucket_size)
    ),
    moving_average AS (
        SELECT 
            bucket,
            thought_count,
            AVG(thought_count) OVER (
                ORDER BY bucket 
                ROWS BETWEEN 6 PRECEDING AND 6 FOLLOWING
            ) as trend
        FROM hourly_buckets
    ),
    detrended AS (
        SELECT 
            bucket,
            thought_count,
            trend,
            thought_count - trend as detrended_value
        FROM moving_average
    ),
    seasonal_pattern AS (
        SELECT 
            bucket,
            thought_count,
            trend,
            detrended_value,
            AVG(detrended_value) OVER (
                PARTITION BY (bucket / v_bucket_size) % 24
            ) as seasonal
        FROM detrended
    )
    SELECT 
        bucket as time_bucket,
        thought_count as activity_count,
        ROUND(trend, 3) as trend_component,
        ROUND(seasonal, 3) as seasonal_component,
        ROUND(detrended_value - seasonal, 3) as random_residual,
        ROUND(
            CASE 
                WHEN trend > 0 THEN (thought_count::NUMERIC / trend) 
                ELSE 0 
            END,
            3
        ) as momentum_indicator
    FROM seasonal_pattern
    ORDER BY bucket;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate discussion entropy (measure of chaos/organization)
CREATE OR REPLACE FUNCTION calculate_discussion_entropy(p_thread_id VARCHAR)
RETURNS NUMERIC AS $$
DECLARE
    v_total_thoughts INTEGER;
    v_entropy NUMERIC := 0;
    v_author_count INTEGER;
    v_prob NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_thoughts
    FROM roso_thought_nodes
    WHERE conversation_link = p_thread_id;
    
    IF v_total_thoughts = 0 THEN
        RETURN 0;
    END IF;
    
    -- Calculate Shannon entropy based on author distribution
    FOR v_author_count, v_prob IN 
        SELECT 
            COUNT(*)::INTEGER,
            COUNT(*)::NUMERIC / v_total_thoughts
        FROM roso_thought_nodes
        WHERE conversation_link = p_thread_id
        GROUP BY speaker_vault_id
    LOOP
        v_entropy := v_entropy - (v_prob * LOG(2, v_prob));
    END LOOP;
    
    RETURN ROUND(v_entropy, 4);
END;
$$ LANGUAGE plpgsql;

-- Function: Detect discussion bifurcation points (where conversation splits)
CREATE OR REPLACE FUNCTION detect_bifurcation_points(p_thread_id VARCHAR)
RETURNS TABLE (
    bifurcation_node_id VARCHAR,
    bifurcation_time BIGINT,
    branch_count INTEGER,
    divergence_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH node_children AS (
        SELECT 
            ancestor_node_id,
            COUNT(DISTINCT node_id) as child_count,
            AVG(resonance_score) as avg_child_resonance,
            STDDEV(resonance_score) as resonance_variance
        FROM roso_thought_nodes
        WHERE conversation_link = p_thread_id
            AND ancestor_node_id IS NOT NULL
        GROUP BY ancestor_node_id
        HAVING COUNT(DISTINCT node_id) >= 2
    ),
    parent_details AS (
        SELECT 
            tn.node_id,
            tn.expressed_moment,
            nc.child_count,
            nc.avg_child_resonance,
            nc.resonance_variance,
            tn.resonance_score as parent_resonance
        FROM roso_thought_nodes tn
        INNER JOIN node_children nc ON tn.node_id = nc.ancestor_node_id
    )
    SELECT 
        node_id as bifurcation_node_id,
        expressed_moment as bifurcation_time,
        child_count as branch_count,
        ROUND(
            (child_count::NUMERIC - 1) * 
            (resonance_variance / NULLIF(avg_child_resonance, 0)) * 
            (1 + ABS(parent_resonance - avg_child_resonance) / 10),
            3
        ) as divergence_score
    FROM parent_details
    WHERE child_count >= 3
    ORDER BY divergence_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Table: Discussion flow snapshots for time-series analysis
CREATE TABLE IF NOT EXISTS roso_flow_snapshots (
    snapshot_id VARCHAR(100) PRIMARY KEY,
    thread_reference VARCHAR(100) REFERENCES roso_conversation_threads(thread_id),
    snapshot_moment BIGINT NOT NULL,
    active_participants INTEGER DEFAULT 0,
    thought_velocity NUMERIC DEFAULT 0.0,
    resonance_momentum NUMERIC DEFAULT 0.0,
    entropy_measure NUMERIC DEFAULT 0.0,
    branching_factor NUMERIC DEFAULT 0.0,
    flow_signature JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flow_snapshots_thread ON roso_flow_snapshots(thread_reference);
CREATE INDEX idx_flow_snapshots_moment ON roso_flow_snapshots(snapshot_moment DESC);

-- Function: Capture flow snapshot
CREATE OR REPLACE FUNCTION capture_flow_snapshot(p_thread_id VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_snapshot_id VARCHAR;
    v_current_moment BIGINT;
    v_participants INTEGER;
    v_velocity NUMERIC;
    v_momentum NUMERIC;
    v_entropy NUMERIC;
    v_branching NUMERIC;
BEGIN
    v_snapshot_id := 'snap_' || EXTRACT(EPOCH FROM NOW())::BIGINT || '_' || FLOOR(RANDOM() * 1000000);
    v_current_moment := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    
    -- Count active participants (last 24 hours)
    SELECT COUNT(DISTINCT speaker_vault_id) INTO v_participants
    FROM roso_thought_nodes
    WHERE conversation_link = p_thread_id
        AND expressed_moment > v_current_moment - 86400000;
    
    -- Calculate velocity (thoughts per hour in last 6 hours)
    SELECT 
        COALESCE(COUNT(*)::NUMERIC / 6.0, 0) INTO v_velocity
    FROM roso_thought_nodes
    WHERE conversation_link = p_thread_id
        AND expressed_moment > v_current_moment - 21600000;
    
    -- Calculate resonance momentum (rate of change)
    WITH recent_resonance AS (
        SELECT 
            AVG(CASE WHEN expressed_moment > v_current_moment - 3600000 THEN resonance_score END) as recent_avg,
            AVG(CASE WHEN expressed_moment BETWEEN v_current_moment - 7200000 AND v_current_moment - 3600000 THEN resonance_score END) as previous_avg
        FROM roso_thought_nodes
        WHERE conversation_link = p_thread_id
    )
    SELECT COALESCE(recent_avg - previous_avg, 0) INTO v_momentum
    FROM recent_resonance;
    
    -- Get entropy
    v_entropy := calculate_discussion_entropy(p_thread_id);
    
    -- Calculate average branching factor
    SELECT 
        COALESCE(AVG(child_count), 1) INTO v_branching
    FROM (
        SELECT COUNT(*) as child_count
        FROM roso_thought_nodes
        WHERE conversation_link = p_thread_id
            AND ancestor_node_id IS NOT NULL
        GROUP BY ancestor_node_id
    ) branch_counts;
    
    INSERT INTO roso_flow_snapshots (
        snapshot_id,
        thread_reference,
        snapshot_moment,
        active_participants,
        thought_velocity,
        resonance_momentum,
        entropy_measure,
        branching_factor,
        flow_signature
    ) VALUES (
        v_snapshot_id,
        p_thread_id,
        v_current_moment,
        v_participants,
        v_velocity,
        v_momentum,
        v_entropy,
        v_branching,
        jsonb_build_object(
            'velocity', v_velocity,
            'momentum', v_momentum,
            'entropy', v_entropy,
            'branching', v_branching
        )
    );
    
    RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql;

-- View: Flow health indicators
CREATE OR REPLACE VIEW v_flow_health AS
SELECT 
    thread_reference,
    snapshot_moment,
    active_participants,
    thought_velocity,
    resonance_momentum,
    entropy_measure,
    branching_factor,
    CASE 
        WHEN thought_velocity > 5 AND resonance_momentum > 0 THEN 'accelerating'
        WHEN thought_velocity > 2 AND resonance_momentum >= 0 THEN 'healthy'
        WHEN thought_velocity > 0.5 THEN 'declining'
        ELSE 'dormant'
    END as flow_status,
    ROUND(
        (thought_velocity * 0.3 + 
         GREATEST(0, resonance_momentum * 10) * 0.3 + 
         (1 / GREATEST(1, entropy_measure)) * 0.2 +
         LEAST(3, branching_factor) * 0.2),
        2
    ) as vitality_score
FROM roso_flow_snapshots
ORDER BY snapshot_moment DESC;
