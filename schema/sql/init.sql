-- Athanor PostgreSQL initialization script
-- Requires: Apache AGE extension, pgvector extension

-- ============================================================
-- Extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS age;
CREATE EXTENSION IF NOT EXISTS vector;

-- Load AGE into the search path
LOAD 'age';
SET search_path = ag_catalog, "$user", public;

-- ============================================================
-- Graph: athanor
-- ============================================================

SELECT create_graph('athanor');

-- ============================================================
-- Table: chunk_embeddings
-- Stores vector embeddings for semantic similarity search
-- ============================================================

CREATE TABLE IF NOT EXISTS chunk_embeddings (
    id              SERIAL PRIMARY KEY,
    chunk_id        TEXT NOT NULL UNIQUE,
    portrait_id     TEXT NOT NULL,
    cluster         TEXT NOT NULL,
    chunk_type      TEXT NOT NULL,
    uniqueness      TEXT NOT NULL CHECK (uniqueness IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    confidence      REAL NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    content         TEXT NOT NULL,
    embedding       vector(1536),
    context_tags    TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_vector
    ON chunk_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- Index for common query patterns
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_portrait
    ON chunk_embeddings (portrait_id);

CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_cluster
    ON chunk_embeddings (cluster);

CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_type
    ON chunk_embeddings (chunk_type);

CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_uniqueness
    ON chunk_embeddings (uniqueness);

-- GIN index for context tag array search
CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_tags
    ON chunk_embeddings
    USING GIN (context_tags);

-- ============================================================
-- Helper Functions
-- ============================================================

-- Find semantically similar chunks by embedding vector
CREATE OR REPLACE FUNCTION find_similar_chunks(
    query_embedding vector(1536),
    match_portrait_id TEXT DEFAULT NULL,
    match_threshold REAL DEFAULT 0.7,
    match_count INT DEFAULT 10
)
RETURNS TABLE (
    chunk_id TEXT,
    cluster TEXT,
    chunk_type TEXT,
    uniqueness TEXT,
    confidence REAL,
    content TEXT,
    context_tags TEXT[],
    similarity REAL
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.chunk_id,
        ce.cluster,
        ce.chunk_type,
        ce.uniqueness,
        ce.confidence,
        ce.content,
        ce.context_tags,
        1 - (ce.embedding <=> query_embedding) AS similarity
    FROM chunk_embeddings ce
    WHERE
        (match_portrait_id IS NULL OR ce.portrait_id = match_portrait_id)
        AND 1 - (ce.embedding <=> query_embedding) >= match_threshold
    ORDER BY ce.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Get all chunks for a portrait, ordered by uniqueness and confidence
CREATE OR REPLACE FUNCTION get_portrait_chunks(
    p_portrait_id TEXT,
    p_cluster TEXT DEFAULT NULL,
    p_chunk_type TEXT DEFAULT NULL,
    p_min_confidence REAL DEFAULT 0.0
)
RETURNS TABLE (
    chunk_id TEXT,
    cluster TEXT,
    chunk_type TEXT,
    uniqueness TEXT,
    confidence REAL,
    content TEXT,
    context_tags TEXT[]
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.chunk_id,
        ce.cluster,
        ce.chunk_type,
        ce.uniqueness,
        ce.confidence,
        ce.content,
        ce.context_tags
    FROM chunk_embeddings ce
    WHERE
        ce.portrait_id = p_portrait_id
        AND (p_cluster IS NULL OR ce.cluster = p_cluster)
        AND (p_chunk_type IS NULL OR ce.chunk_type = p_chunk_type)
        AND ce.confidence >= p_min_confidence
    ORDER BY
        CASE ce.uniqueness
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
        END,
        ce.confidence DESC;
END;
$$;

-- Find chunks matching any of the given context tags
CREATE OR REPLACE FUNCTION find_chunks_by_tags(
    p_portrait_id TEXT,
    p_tags TEXT[]
)
RETURNS TABLE (
    chunk_id TEXT,
    cluster TEXT,
    chunk_type TEXT,
    uniqueness TEXT,
    confidence REAL,
    content TEXT,
    context_tags TEXT[],
    matching_tags TEXT[]
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.chunk_id,
        ce.cluster,
        ce.chunk_type,
        ce.uniqueness,
        ce.confidence,
        ce.content,
        ce.context_tags,
        ARRAY(SELECT unnest(ce.context_tags) INTERSECT SELECT unnest(p_tags)) AS matching_tags
    FROM chunk_embeddings ce
    WHERE
        ce.portrait_id = p_portrait_id
        AND ce.context_tags && p_tags
    ORDER BY
        array_length(ARRAY(SELECT unnest(ce.context_tags) INTERSECT SELECT unnest(p_tags)), 1) DESC NULLS LAST,
        CASE ce.uniqueness
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
        END,
        ce.confidence DESC;
END;
$$;

-- Get cluster coverage statistics for a portrait
CREATE OR REPLACE FUNCTION get_cluster_coverage(
    p_portrait_id TEXT
)
RETURNS TABLE (
    cluster TEXT,
    chunk_count BIGINT,
    avg_confidence REAL,
    critical_count BIGINT,
    high_count BIGINT,
    medium_count BIGINT
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        ce.cluster,
        COUNT(*)::BIGINT AS chunk_count,
        AVG(ce.confidence)::REAL AS avg_confidence,
        COUNT(*) FILTER (WHERE ce.uniqueness = 'CRITICAL')::BIGINT AS critical_count,
        COUNT(*) FILTER (WHERE ce.uniqueness = 'HIGH')::BIGINT AS high_count,
        COUNT(*) FILTER (WHERE ce.uniqueness = 'MEDIUM')::BIGINT AS medium_count
    FROM chunk_embeddings ce
    WHERE ce.portrait_id = p_portrait_id
    GROUP BY ce.cluster
    ORDER BY chunk_count DESC;
END;
$$;

-- Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_chunk_embeddings_updated
    BEFORE UPDATE ON chunk_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
