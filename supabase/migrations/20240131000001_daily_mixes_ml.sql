-- Daily Mixes ML Schema

-- 1. Audio Features Table (Extended)
CREATE TABLE IF NOT EXISTS audio_features (
    song_id UUID PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
    tempo FLOAT NOT NULL,
    tempo_confidence FLOAT DEFAULT 0.0,
    key INTEGER, -- 0-11 (C, C#, D, D#, E, F, F#, G, G#, A, A#, B)
    key_confidence FLOAT DEFAULT 0.0,
    mode INTEGER, -- 0 = minor, 1 = major
    time_signature INTEGER DEFAULT 4,
    loudness FLOAT,
    energy FLOAT,
    danceability FLOAT,
    valence FLOAT,
    acousticness FLOAT,
    instrumentalness FLOAT,
    speechiness FLOAT,
    liveness FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Daily Mix Configurations
CREATE TABLE daily_mix_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    mix_type TEXT NOT NULL, -- 'mood', 'tempo', 'genre', 'discovery', 'throwback', 'key_harmony'
    config JSONB NOT NULL, -- Stores mix-specific configuration
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. User Daily Mixes
CREATE TABLE user_daily_mixes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mix_config_id UUID REFERENCES daily_mix_configs(id),
    generated_date DATE NOT NULL,
    tracks UUID[] NOT NULL,
    mix_metadata JSONB, -- Stores mix statistics and characteristics
    play_count INTEGER DEFAULT 0,
    skip_rate FLOAT DEFAULT 0.0,
    completion_rate FLOAT DEFAULT 0.0,
    user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, mix_config_id, generated_date)
);

-- 4. Mix Generation History
CREATE TABLE mix_generation_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mix_id UUID REFERENCES user_daily_mixes(id),
    algorithm_version TEXT,
    generation_time_ms INTEGER,
    feature_weights JSONB,
    seed_tracks UUID[],
    excluded_tracks UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. User Music Preferences (Extended)
CREATE TABLE user_music_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_tempos FLOAT[], -- Array of preferred tempo ranges
    tempo_variance FLOAT DEFAULT 20.0, -- How much tempo can vary
    preferred_keys INTEGER[], -- Array of preferred musical keys
    key_compatibility_mode TEXT DEFAULT 'circle_of_fifths', -- 'strict', 'circle_of_fifths', 'relative', 'parallel'
    energy_range FLOAT[] DEFAULT '{0.3, 0.8}',
    valence_range FLOAT[] DEFAULT '{0.3, 0.8}',
    genre_weights JSONB, -- {"pop": 0.3, "rock": 0.2, ...}
    time_of_day_preferences JSONB, -- {"morning": {"energy": 0.7}, "evening": {"energy": 0.3}}
    discovery_rate FLOAT DEFAULT 0.2, -- Percentage of new/unfamiliar tracks
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tempo Clustering Table
CREATE TABLE tempo_clusters (
    id SERIAL PRIMARY KEY,
    cluster_name TEXT NOT NULL,
    min_tempo FLOAT NOT NULL,
    max_tempo FLOAT NOT NULL,
    description TEXT
);

-- Insert default tempo clusters
INSERT INTO tempo_clusters (cluster_name, min_tempo, max_tempo, description) VALUES
('Slow', 60, 90, 'Slow tempo songs, ballads'),
('Moderate', 90, 120, 'Moderate tempo, easy listening'),
('Upbeat', 120, 140, 'Upbeat, energetic songs'),
('Fast', 140, 180, 'Fast tempo, high energy'),
('Very Fast', 180, 220, 'Very fast, intense songs');

-- 7. Key Compatibility Matrix
CREATE TABLE key_compatibility (
    key_from INTEGER NOT NULL CHECK (key_from >= 0 AND key_from <= 11),
    key_to INTEGER NOT NULL CHECK (key_to >= 0 AND key_to <= 11),
    compatibility_score FLOAT NOT NULL CHECK (compatibility_score >= 0 AND compatibility_score <= 1),
    relationship TEXT, -- 'same', 'relative', 'parallel', 'dominant', 'subdominant', 'tritone'
    PRIMARY KEY (key_from, key_to)
);

-- Insert key compatibility data (Circle of Fifths relationships)
-- This is a simplified version - you can expand this
INSERT INTO key_compatibility (key_from, key_to, compatibility_score, relationship) VALUES
-- Same key
(0, 0, 1.0, 'same'), (1, 1, 1.0, 'same'), (2, 2, 1.0, 'same'), (3, 3, 1.0, 'same'),
(4, 4, 1.0, 'same'), (5, 5, 1.0, 'same'), (6, 6, 1.0, 'same'), (7, 7, 1.0, 'same'),
(8, 8, 1.0, 'same'), (9, 9, 1.0, 'same'), (10, 10, 1.0, 'same'), (11, 11, 1.0, 'same'),
-- Dominant (5th)
(0, 7, 0.9, 'dominant'), (1, 8, 0.9, 'dominant'), (2, 9, 0.9, 'dominant'), (3, 10, 0.9, 'dominant'),
(4, 11, 0.9, 'dominant'), (5, 0, 0.9, 'dominant'), (6, 1, 0.9, 'dominant'), (7, 2, 0.9, 'dominant'),
(8, 3, 0.9, 'dominant'), (9, 4, 0.9, 'dominant'), (10, 5, 0.9, 'dominant'), (11, 6, 0.9, 'dominant'),
-- Subdominant (4th)
(0, 5, 0.9, 'subdominant'), (1, 6, 0.9, 'subdominant'), (2, 7, 0.9, 'subdominant'), (3, 8, 0.9, 'subdominant'),
(4, 9, 0.9, 'subdominant'), (5, 10, 0.9, 'subdominant'), (6, 11, 0.9, 'subdominant'), (7, 0, 0.9, 'subdominant'),
(8, 1, 0.9, 'subdominant'), (9, 2, 0.9, 'subdominant'), (10, 3, 0.9, 'subdominant'), (11, 4, 0.9, 'subdominant'),
-- Relative minor/major (minor 3rd down from major)
(0, 9, 0.85, 'relative'), (1, 10, 0.85, 'relative'), (2, 11, 0.85, 'relative'), (3, 0, 0.85, 'relative'),
(4, 1, 0.85, 'relative'), (5, 2, 0.85, 'relative'), (6, 3, 0.85, 'relative'), (7, 4, 0.85, 'relative'),
(8, 5, 0.85, 'relative'), (9, 6, 0.85, 'relative'), (10, 7, 0.85, 'relative'), (11, 8, 0.85, 'relative');

-- Functions for Daily Mix Generation

-- Function to get BPM-compatible tracks
CREATE OR REPLACE FUNCTION get_bpm_compatible_tracks(
    target_bpm FLOAT,
    variance FLOAT DEFAULT 10.0,
    exclude_tracks UUID[] DEFAULT '{}',
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(song_id UUID, tempo FLOAT, tempo_diff FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af.song_id,
        af.tempo,
        ABS(af.tempo - target_bpm) as tempo_diff
    FROM audio_features af
    WHERE 
        af.tempo BETWEEN (target_bpm - variance) AND (target_bpm + variance)
        AND NOT (af.song_id = ANY(exclude_tracks))
    ORDER BY tempo_diff
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get key-compatible tracks
CREATE OR REPLACE FUNCTION get_key_compatible_tracks(
    target_key INTEGER,
    mode INTEGER,
    exclude_tracks UUID[] DEFAULT '{}',
    compatibility_threshold FLOAT DEFAULT 0.7,
    limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(song_id UUID, key INTEGER, compatibility_score FLOAT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        af.song_id,
        af.key,
        COALESCE(kc.compatibility_score, 0.5) as compatibility_score
    FROM audio_features af
    LEFT JOIN key_compatibility kc ON (kc.key_from = target_key AND kc.key_to = af.key)
    WHERE 
        NOT (af.song_id = ANY(exclude_tracks))
        AND (kc.compatibility_score >= compatibility_threshold OR af.key = target_key)
    ORDER BY compatibility_score DESC, af.energy DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to generate tempo-based mix
CREATE OR REPLACE FUNCTION generate_tempo_flow_mix(
    p_user_id UUID,
    p_start_tempo FLOAT DEFAULT NULL,
    p_tempo_progression TEXT DEFAULT 'gradual', -- 'gradual', 'wave', 'steady'
    p_mix_length INTEGER DEFAULT 30
)
RETURNS UUID[] AS $$
DECLARE
    v_tracks UUID[];
    v_current_tempo FLOAT;
    v_tempo_step FLOAT;
    v_excluded UUID[] := '{}';
    v_next_track RECORD;
    i INTEGER;
BEGIN
    -- Initialize starting tempo
    IF p_start_tempo IS NULL THEN
        -- Get user's average tempo preference
        SELECT AVG(af.tempo) INTO v_current_tempo
        FROM play_history ph
        JOIN audio_features af ON af.song_id = ph.song_id
        WHERE ph.user_id = p_user_id
        AND ph.played_at > NOW() - INTERVAL '30 days'
        LIMIT 100;
        
        v_current_tempo := COALESCE(v_current_tempo, 120.0);
    ELSE
        v_current_tempo := p_start_tempo;
    END IF;
    
    -- Calculate tempo progression
    IF p_tempo_progression = 'gradual' THEN
        v_tempo_step := 2.0; -- Increase by 2 BPM per track
    ELSIF p_tempo_progression = 'wave' THEN
        v_tempo_step := 0.0; -- Will use sine wave pattern
    ELSE
        v_tempo_step := 0.0; -- Steady tempo
    END IF;
    
    -- Generate mix
    FOR i IN 1..p_mix_length LOOP
        -- Adjust tempo based on progression type
        IF p_tempo_progression = 'wave' THEN
            v_current_tempo := v_current_tempo + (10 * SIN(i * 0.3));
        ELSIF p_tempo_progression = 'gradual' THEN
            v_current_tempo := v_current_tempo + v_tempo_step;
        END IF;
        
        -- Get next compatible track
        SELECT song_id INTO v_next_track
        FROM get_bpm_compatible_tracks(v_current_tempo, 8.0, v_excluded, 10)
        JOIN songs s ON s.id = song_id
        ORDER BY tempo_diff, s.play_count DESC
        LIMIT 1;
        
        IF v_next_track.song_id IS NOT NULL THEN
            v_tracks := array_append(v_tracks, v_next_track.song_id);
            v_excluded := array_append(v_excluded, v_next_track.song_id);
            
            -- Update current tempo to actual tempo of selected track
            SELECT tempo INTO v_current_tempo
            FROM audio_features
            WHERE song_id = v_next_track.song_id;
        END IF;
    END LOOP;
    
    RETURN v_tracks;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze user's listening patterns
CREATE OR REPLACE FUNCTION analyze_user_listening_patterns(p_user_id UUID)
RETURNS TABLE(
    time_of_day TEXT,
    avg_energy FLOAT,
    avg_valence FLOAT,
    avg_tempo FLOAT,
    top_genres TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH hourly_patterns AS (
        SELECT 
            CASE 
                WHEN EXTRACT(hour FROM ph.played_at) BETWEEN 5 AND 11 THEN 'morning'
                WHEN EXTRACT(hour FROM ph.played_at) BETWEEN 12 AND 17 THEN 'afternoon'
                WHEN EXTRACT(hour FROM ph.played_at) BETWEEN 18 AND 22 THEN 'evening'
                ELSE 'night'
            END as time_period,
            af.energy,
            af.valence,
            af.tempo,
            s.genre
        FROM play_history ph
        JOIN songs s ON s.id = ph.song_id
        JOIN audio_features af ON af.song_id = ph.song_id
        WHERE ph.user_id = p_user_id
        AND ph.played_at > NOW() - INTERVAL '90 days'
    )
    SELECT 
        time_period,
        AVG(energy)::FLOAT,
        AVG(valence)::FLOAT,
        AVG(tempo)::FLOAT,
        ARRAY_AGG(DISTINCT genre) FILTER (WHERE genre IS NOT NULL)
    FROM hourly_patterns
    GROUP BY time_period;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX idx_audio_features_tempo ON audio_features(tempo);
CREATE INDEX idx_audio_features_key ON audio_features(key);
CREATE INDEX idx_audio_features_energy ON audio_features(energy);
CREATE INDEX idx_user_daily_mixes_user_date ON user_daily_mixes(user_id, generated_date);
CREATE INDEX idx_play_history_user_time ON play_history(user_id, played_at DESC);
