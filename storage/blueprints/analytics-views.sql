-- ROSOIDEAE Advanced Analytics Views
-- Custom analytical queries for manager insights

-- View: Thread Resonance Leaderboard
CREATE OR REPLACE VIEW v_thread_resonance_leaders AS
SELECT 
    t.thread_id,
    t.thread_headline,
    t.taxonomy_link,
    COUNT(DISTINCT tn.node_id) as thought_count,
    AVG(tn.resonance_score) as average_resonance,
    MAX(tn.resonance_score) as peak_resonance,
    SUM(tn.resonance_score) as total_resonance,
    COUNT(DISTINCT tn.speaker_vault_id) as unique_contributors,
    EXTRACT(EPOCH FROM (MAX(tn.expressed_moment) - MIN(tn.expressed_moment))) / 3600 as duration_hours,
    COUNT(DISTINCT tn.node_id) / NULLIF(EXTRACT(EPOCH FROM (MAX(tn.expressed_moment) - MIN(tn.expressed_moment))) / 3600, 0) as thoughts_per_hour
FROM roso_conversation_threads t
LEFT JOIN roso_thought_nodes tn ON t.thread_id = tn.conversation_link
GROUP BY t.thread_id, t.thread_headline, t.taxonomy_link
HAVING COUNT(tn.node_id) > 0
ORDER BY total_resonance DESC;

-- View: Author Influence Metrics
CREATE OR REPLACE VIEW v_author_influence AS
SELECT 
    ir.vault_id,
    ir.identity_marker,
    ir.display_moniker,
    COUNT(DISTINCT t.thread_id) as threads_initiated,
    COUNT(DISTINCT tn.node_id) as thoughts_expressed,
    AVG(tn.resonance_score) as average_thought_resonance,
    COUNT(DISTINCT tn2.node_id) as replies_received,
    COUNT(DISTINCT tn2.speaker_vault_id) as unique_repliers,
    -- Custom influence score combining multiple factors
    (COUNT(DISTINCT t.thread_id) * 10.0 + 
     COUNT(DISTINCT tn.node_id) * 2.0 + 
     AVG(tn.resonance_score) * 0.5 +
     COUNT(DISTINCT tn2.speaker_vault_id) * 5.0) as influence_quotient
FROM roso_identity_registry ir
LEFT JOIN roso_conversation_threads t ON ir.vault_id = t.initiator_vault_id
LEFT JOIN roso_thought_nodes tn ON ir.vault_id = tn.speaker_vault_id
LEFT JOIN roso_thought_nodes tn2 ON tn.node_id = tn2.ancestor_node_id
GROUP BY ir.vault_id, ir.identity_marker, ir.display_moniker
ORDER BY influence_quotient DESC;

-- View: Taxonomy Activity Breakdown
CREATE OR REPLACE VIEW v_taxonomy_pulse AS
SELECT 
    tax.taxonomy_id,
    tax.taxonomy_label,
    COUNT(DISTINCT t.thread_id) as active_threads,
    COUNT(DISTINCT tn.node_id) as total_thoughts,
    COUNT(DISTINCT tn.speaker_vault_id) as unique_voices,
    AVG(tn.resonance_score) as category_resonance,
    -- Activity in last 24 hours
    COUNT(DISTINCT CASE 
        WHEN tn.expressed_moment > (EXTRACT(EPOCH FROM NOW()) * 1000) - 86400000 
        THEN tn.node_id 
    END) as thoughts_last_24h,
    -- Trending score (recent activity weighted by resonance)
    SUM(CASE 
        WHEN tn.expressed_moment > (EXTRACT(EPOCH FROM NOW()) * 1000) - 86400000 
        THEN tn.resonance_score * 2 
        ELSE tn.resonance_score 
    END) as trending_score
FROM roso_discussion_taxonomy tax
LEFT JOIN roso_conversation_threads t ON tax.taxonomy_id = t.taxonomy_link
LEFT JOIN roso_thought_nodes tn ON t.thread_id = tn.conversation_link
GROUP BY tax.taxonomy_id, tax.taxonomy_label
ORDER BY trending_score DESC;

-- View: Conversation Depth Analysis
CREATE OR REPLACE VIEW v_conversation_depth AS
WITH RECURSIVE thread_depth AS (
    -- Base case: root thoughts (no ancestor)
    SELECT 
        node_id,
        conversation_link as thread_id,
        0 as depth_level,
        ARRAY[node_id] as path
    FROM roso_thought_nodes
    WHERE ancestor_node_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child thoughts
    SELECT 
        tn.node_id,
        tn.conversation_link,
        td.depth_level + 1,
        td.path || tn.node_id
    FROM roso_thought_nodes tn
    INNER JOIN thread_depth td ON tn.ancestor_node_id = td.node_id
    WHERE NOT tn.node_id = ANY(td.path) -- Prevent cycles
)
SELECT 
    t.thread_id,
    t.thread_headline,
    MAX(td.depth_level) as max_depth,
    AVG(td.depth_level) as avg_depth,
    COUNT(DISTINCT td.node_id) as total_nodes,
    -- Branching factor (average children per node)
    COUNT(DISTINCT td.node_id)::FLOAT / NULLIF(COUNT(DISTINCT CASE WHEN td.depth_level > 0 THEN td.node_id END), 0) as branching_factor
FROM roso_conversation_threads t
LEFT JOIN thread_depth td ON t.thread_id = td.thread_id
GROUP BY t.thread_id, t.thread_headline
ORDER BY max_depth DESC;

-- View: Temporal Activity Patterns
CREATE OR REPLACE VIEW v_temporal_patterns AS
SELECT 
    EXTRACT(HOUR FROM TO_TIMESTAMP(expressed_moment / 1000)) as hour_of_day,
    EXTRACT(DOW FROM TO_TIMESTAMP(expressed_moment / 1000)) as day_of_week,
    COUNT(*) as thought_count,
    AVG(resonance_score) as avg_resonance,
    COUNT(DISTINCT speaker_vault_id) as unique_authors,
    COUNT(DISTINCT conversation_link) as active_threads
FROM roso_thought_nodes
GROUP BY hour_of_day, day_of_week
ORDER BY day_of_week, hour_of_day;

-- Function: Calculate Thread Velocity Over Time Window
CREATE OR REPLACE FUNCTION calculate_thread_velocity(
    p_thread_id VARCHAR,
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    time_window VARCHAR,
    thought_count BIGINT,
    velocity_per_hour NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH time_buckets AS (
        SELECT 
            FLOOR(EXTRACT(EPOCH FROM TO_TIMESTAMP(expressed_moment / 1000)) / 3600) as hour_bucket
        FROM roso_thought_nodes
        WHERE conversation_link = p_thread_id
            AND expressed_moment > (EXTRACT(EPOCH FROM NOW()) * 1000) - (p_hours_back * 3600000)
    )
    SELECT 
        TO_CHAR(TO_TIMESTAMP(hour_bucket * 3600), 'YYYY-MM-DD HH24:00') as time_window,
        COUNT(*) as thought_count,
        COUNT(*)::NUMERIC as velocity_per_hour
    FROM time_buckets
    GROUP BY hour_bucket
    ORDER BY hour_bucket DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Detect Emerging Topics Using Resonance Spikes
CREATE OR REPLACE FUNCTION detect_emerging_topics(
    p_spike_threshold NUMERIC DEFAULT 1.5,
    p_hours_window INTEGER DEFAULT 6
)
RETURNS TABLE (
    thread_id VARCHAR,
    thread_headline VARCHAR,
    recent_resonance NUMERIC,
    baseline_resonance NUMERIC,
    spike_ratio NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_activity AS (
        SELECT 
            tn.conversation_link,
            AVG(tn.resonance_score) as recent_avg
        FROM roso_thought_nodes tn
        WHERE tn.expressed_moment > (EXTRACT(EPOCH FROM NOW()) * 1000) - (p_hours_window * 3600000)
        GROUP BY tn.conversation_link
    ),
    baseline_activity AS (
        SELECT 
            tn.conversation_link,
            AVG(tn.resonance_score) as baseline_avg
        FROM roso_thought_nodes tn
        WHERE tn.expressed_moment <= (EXTRACT(EPOCH FROM NOW()) * 1000) - (p_hours_window * 3600000)
        GROUP BY tn.conversation_link
    )
    SELECT 
        t.thread_id,
        t.thread_headline,
        ra.recent_avg as recent_resonance,
        ba.baseline_avg as baseline_resonance,
        (ra.recent_avg / NULLIF(ba.baseline_avg, 0)) as spike_ratio
    FROM roso_conversation_threads t
    INNER JOIN recent_activity ra ON t.thread_id = ra.conversation_link
    INNER JOIN baseline_activity ba ON t.thread_id = ba.conversation_link
    WHERE (ra.recent_avg / NULLIF(ba.baseline_avg, 0)) > p_spike_threshold
    ORDER BY spike_ratio DESC;
END;
$$ LANGUAGE plpgsql;

-- Materialized View: Daily Engagement Summary (for performance)
CREATE MATERIALIZED VIEW mv_daily_engagement AS
SELECT 
    DATE(TO_TIMESTAMP(expressed_moment / 1000)) as activity_date,
    COUNT(DISTINCT speaker_vault_id) as daily_active_users,
    COUNT(DISTINCT conversation_link) as active_threads,
    COUNT(*) as total_thoughts,
    AVG(resonance_score) as average_resonance,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resonance_score) as median_resonance,
    MAX(resonance_score) as peak_resonance
FROM roso_thought_nodes
GROUP BY activity_date
ORDER BY activity_date DESC;

-- Create index for materialized view refresh
CREATE UNIQUE INDEX idx_mv_daily_engagement_date ON mv_daily_engagement(activity_date);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_engagement_metrics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_engagement;
END;
$$ LANGUAGE plpgsql;
