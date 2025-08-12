-- Add foreign key constraint for user_id in track_comments table
ALTER TABLE track_comments
    ADD CONSTRAINT fk_track_comments_user
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

-- Add index to improve foreign key lookup performance
CREATE INDEX IF NOT EXISTS idx_track_comments_user_id ON track_comments(user_id);
