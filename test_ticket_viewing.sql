-- Test script to debug ticket viewing functionality

-- First, let's check if there are any existing ticket purchases
SELECT 
    id,
    user_id,
    event_id,
    event_name,
    venue,
    quantity,
    tickets,
    created_at
FROM ticket_purchases
ORDER BY created_at DESC
LIMIT 10;

-- If you need to insert test data for a specific user and event
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- You can get your user ID by running: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

/*
-- Example insert for testing (uncomment and modify as needed):
INSERT INTO ticket_purchases (
    user_id,
    event_id,
    event_name,
    artist_name,
    venue,
    event_date,
    quantity,
    total_price,
    purchase_date,
    payment_method,
    tickets
) VALUES (
    'YOUR_USER_ID', -- Replace with your user ID
    '1', -- Event ID from TourDates component
    'Artist Live Concert',
    'Artist Name',
    'Madison Square Garden',
    '2025-09-15',
    2,
    179.98,
    NOW(),
    'apple_pay',
    '[
        {
            "id": "TICKET-TEST-001",
            "qrCode": "QR-TEST-001-1234567890",
            "status": "valid",
            "seatInfo": "General Admission - Section A"
        },
        {
            "id": "TICKET-TEST-002",
            "qrCode": "QR-TEST-002-0987654321",
            "status": "valid",
            "seatInfo": "General Admission - Section B"
        }
    ]'::jsonb
);
*/

-- Check the structure of the tickets JSONB field
SELECT 
    id,
    event_id,
    jsonb_pretty(tickets) as ticket_data,
    jsonb_array_length(tickets) as ticket_count
FROM ticket_purchases
WHERE tickets IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- Extract individual ticket information
SELECT 
    tp.id as purchase_id,
    tp.event_id,
    tp.venue,
    ticket->>'id' as ticket_id,
    ticket->>'qrCode' as qr_code,
    ticket->>'status' as status,
    ticket->>'seatInfo' as seat_info
FROM ticket_purchases tp,
     jsonb_array_elements(tp.tickets) as ticket
WHERE tp.tickets IS NOT NULL
ORDER BY tp.created_at DESC
LIMIT 10;
