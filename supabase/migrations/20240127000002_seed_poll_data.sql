-- Seed poll data for the voting system
-- This migration creates sample polls and options for testing

-- Insert sample polls
INSERT INTO polls (id, title, description, category, poll_type, is_active, is_featured, end_date, total_votes, allow_anonymous) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'What''s your favorite music genre this month?', 'Help us understand the trending genres in our community', 'genre', 'single_choice', true, true, NOW() + INTERVAL '30 days', 0, true),
('550e8400-e29b-41d4-a716-446655440002', 'Best collaboration of 2024?', 'Vote for the most impactful musical collaboration this year', 'music', 'single_choice', true, false, NOW() + INTERVAL '14 days', 0, true),
('550e8400-e29b-41d4-a716-446655440003', 'Rate your music discovery experience', 'How satisfied are you with finding new music on M3lodi?', 'general', 'rating', true, false, NOW() + INTERVAL '7 days', 0, true),
('550e8400-e29b-41d4-a716-446655440004', 'Which artist should we feature next?', 'Vote for the artist you''d like to see highlighted on our platform', 'artist', 'single_choice', true, true, NOW() + INTERVAL '21 days', 0, true);

-- Insert poll options for "What's your favorite music genre this month?"
INSERT INTO poll_options (id, poll_id, text, description, position, vote_count) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Electronic', 'EDM, House, Techno, and electronic beats', 0, 234),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Hip Hop', 'Rap, trap, and hip hop culture', 1, 189),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Synthwave', 'Retro-futuristic synth music', 2, 156),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Ambient', 'Atmospheric and chillout music', 3, 98);

-- Insert poll options for "Best collaboration of 2024?"
INSERT INTO poll_options (id, poll_id, text, description, position, vote_count) VALUES
('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'The Weeknd x Swedish House Mafia', 'Electronic meets R&B', 0, 45),
('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Taylor Swift x Bon Iver', 'Indie folk collaboration', 1, 67),
('660e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440002', 'Kendrick Lamar x SZA', 'Hip hop powerhouse duo', 2, 123),
('660e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'Daft Punk x The Strokes', 'Electronic rock fusion', 3, 89);

-- Insert poll options for "Rate your music discovery experience"
INSERT INTO poll_options (id, poll_id, text, description, position, vote_count) VALUES
('660e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440003', '⭐', 'Very Poor', 0, 12),
('660e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', '⭐⭐', 'Poor', 1, 28),
('660e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', '⭐⭐⭐', 'Average', 2, 156),
('660e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440003', '⭐⭐⭐⭐', 'Good', 3, 289),
('660e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440003', '⭐⭐⭐⭐⭐', 'Excellent', 4, 178);

-- Insert poll options for "Which artist should we feature next?"
INSERT INTO poll_options (id, poll_id, text, description, position, vote_count) VALUES
('660e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440004', 'AURORA', 'Norwegian ethereal pop artist', 0, 234),
('660e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440004', 'FKA twigs', 'Experimental R&B and electronic', 1, 198),
('660e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440004', 'Phoebe Bridgers', 'Indie rock and folk', 2, 267),
('660e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440004', 'Porter Robinson', 'Electronic and melodic dubstep', 3, 156);

-- Update polls with correct total votes
UPDATE polls SET total_votes = 677 WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE polls SET total_votes = 324 WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE polls SET total_votes = 663 WHERE id = '550e8400-e29b-41d4-a716-446655440003';
UPDATE polls SET total_votes = 855 WHERE id = '550e8400-e29b-41d4-a716-446655440004';

-- Create some sample poll analytics
INSERT INTO poll_analytics (poll_id, date, total_votes, unique_voters, anonymous_votes, registered_votes) VALUES
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE, 677, 612, 423, 254),
('550e8400-e29b-41d4-a716-446655440002', CURRENT_DATE, 324, 298, 189, 135),
('550e8400-e29b-41d4-a716-446655440003', CURRENT_DATE, 663, 589, 412, 251),
('550e8400-e29b-41d4-a716-446655440004', CURRENT_DATE, 855, 798, 567, 288);

-- Insert analytics for previous days (trending data)
INSERT INTO poll_analytics (poll_id, date, total_votes, unique_voters, anonymous_votes, registered_votes) VALUES
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '1 day', 523, 478, 334, 189),
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '2 days', 398, 367, 245, 153),
('550e8400-e29b-41d4-a716-446655440001', CURRENT_DATE - INTERVAL '3 days', 287, 256, 178, 109);
