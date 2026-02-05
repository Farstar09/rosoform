-- ROSOIDEAE Data Persistence Blueprint
-- Custom schema with analytical capabilities

-- Identity registry with privilege hierarchy
CREATE TABLE roso_identity_registry (
    vault_id VARCHAR(100) PRIMARY KEY,
    identity_marker VARCHAR(80) UNIQUE NOT NULL,
    secret_scramble VARCHAR(150) NOT NULL,
    display_moniker VARCHAR(120),
    biography_text TEXT,
    visual_avatar_link VARCHAR(400),
    privilege_array TEXT[],
    registered_moment BIGINT NOT NULL,
    last_seen_moment BIGINT,
    vault_status VARCHAR(20) DEFAULT 'active',
    CHECK (array_length(privilege_array, 1) > 0)
);

-- Discussion taxonomy
CREATE TABLE roso_discussion_taxonomy (
    taxonomy_id VARCHAR(100) PRIMARY KEY,
    taxonomy_label VARCHAR(120) UNIQUE NOT NULL,
    taxonomy_synopsis TEXT,
    visual_hue VARCHAR(10) DEFAULT '#5D2E6B',
    display_sequence INTEGER DEFAULT 100,
    visibility_flag BOOLEAN DEFAULT true,
    inception_moment BIGINT NOT NULL
);

-- Conversation threads
CREATE TABLE roso_conversation_threads (
    thread_id VARCHAR(100) PRIMARY KEY,
    thread_headline VARCHAR(250) NOT NULL,
    taxonomy_link VARCHAR(100) REFERENCES roso_discussion_taxonomy(taxonomy_id),
    initiator_vault_id VARCHAR(100) REFERENCES roso_identity_registry(vault_id),
    is_sticky BOOLEAN DEFAULT false,
    is_sealed BOOLEAN DEFAULT false,
    observation_tally INTEGER DEFAULT 0,
    resonance_metric DECIMAL(10,2) DEFAULT 0.0,
    spawned_at_moment BIGINT NOT NULL,
    pulse_moment BIGINT NOT NULL,
    CHECK (char_length(thread_headline) >= 5)
);

-- Thought nodes (messages)
CREATE TABLE roso_thought_nodes (
    node_id VARCHAR(100) PRIMARY KEY,
    conversation_link VARCHAR(100) REFERENCES roso_conversation_threads(thread_id) ON DELETE CASCADE,
    speaker_vault_id VARCHAR(100) REFERENCES roso_identity_registry(vault_id),
    ancestor_node_id VARCHAR(100) REFERENCES roso_thought_nodes(node_id) ON DELETE CASCADE,
    thought_markdown TEXT NOT NULL,
    modification_tally INTEGER DEFAULT 0,
    resonance_score DECIMAL(10,2) DEFAULT 0.0,
    expressed_moment BIGINT NOT NULL,
    revised_moment BIGINT,
    CHECK (char_length(thought_markdown) >= 1 AND char_length(thought_markdown) <= 50000)
);

-- Cryptographic sessions
CREATE TABLE roso_crypto_sessions (
    session_key VARCHAR(100) PRIMARY KEY,
    vault_reference VARCHAR(100) REFERENCES roso_identity_registry(vault_id) ON DELETE CASCADE,
    token_signature VARCHAR(150) NOT NULL,
    origin_address INET,
    client_fingerprint TEXT,
    minted_moment BIGINT NOT NULL,
    expiry_moment BIGINT NOT NULL,
    revocation_flag BOOLEAN DEFAULT false,
    CHECK (expiry_moment > minted_moment)
);

-- Analytical pulse tracking
CREATE TABLE roso_pulse_analytics (
    pulse_id VARCHAR(100) PRIMARY KEY,
    pulse_category VARCHAR(60) NOT NULL,
    vault_reference VARCHAR(100) REFERENCES roso_identity_registry(vault_id),
    thread_reference VARCHAR(100) REFERENCES roso_conversation_threads(thread_id),
    node_reference VARCHAR(100) REFERENCES roso_thought_nodes(node_id),
    pulse_metadata JSONB,
    captured_moment BIGINT NOT NULL
);

-- Performance indices
CREATE INDEX idx_threads_taxonomy ON roso_conversation_threads(taxonomy_link);
CREATE INDEX idx_threads_pulse ON roso_conversation_threads(pulse_moment DESC);
CREATE INDEX idx_threads_resonance ON roso_conversation_threads(resonance_metric DESC);
CREATE INDEX idx_nodes_conversation ON roso_thought_nodes(conversation_link);
CREATE INDEX idx_nodes_speaker ON roso_thought_nodes(speaker_vault_id);
CREATE INDEX idx_nodes_ancestor ON roso_thought_nodes(ancestor_node_id);
CREATE INDEX idx_nodes_expressed ON roso_thought_nodes(expressed_moment DESC);
CREATE INDEX idx_sessions_vault ON roso_crypto_sessions(vault_reference);
CREATE INDEX idx_sessions_expiry ON roso_crypto_sessions(expiry_moment);
CREATE INDEX idx_analytics_category ON roso_pulse_analytics(pulse_category);
CREATE INDEX idx_analytics_captured ON roso_pulse_analytics(captured_moment DESC);

-- Resonance calculation function
CREATE OR REPLACE FUNCTION compute_thought_resonance(thought_text TEXT)
RETURNS DECIMAL AS $$
DECLARE
    word_density INTEGER;
    unique_chars INTEGER;
    sentence_count INTEGER;
    resonance_value DECIMAL;
BEGIN
    word_density := array_length(regexp_split_to_array(thought_text, '\s+'), 1);
    unique_chars := length(regexp_replace(lower(thought_text), '(.)', '\1', 'g'));
    sentence_count := array_length(regexp_split_to_array(thought_text, '[.!?]+'), 1);
    
    resonance_value := (word_density * 0.4) + (unique_chars * 0.3) + (sentence_count * 10);
    
    RETURN resonance_value;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update thread pulse
CREATE OR REPLACE FUNCTION refresh_thread_pulse()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE roso_conversation_threads
    SET pulse_moment = extract(epoch from now())::BIGINT * 1000
    WHERE thread_id = NEW.conversation_link;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_thread_pulse_refresh
AFTER INSERT OR UPDATE ON roso_thought_nodes
FOR EACH ROW
EXECUTE FUNCTION refresh_thread_pulse();

-- Trigger to compute resonance on insert
CREATE OR REPLACE FUNCTION assign_resonance_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.resonance_score := compute_thought_resonance(NEW.thought_markdown);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_assign_resonance
BEFORE INSERT OR UPDATE OF thought_markdown ON roso_thought_nodes
FOR EACH ROW
EXECUTE FUNCTION assign_resonance_score();
