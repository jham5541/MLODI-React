-- Final Migration for Ticket Purchase System with QR Codes
-- This migration ensures tickets are properly created with QR codes
-- and can be viewed immediately after purchase

-- =====================================================
-- STEP 1: Update table structure
-- =====================================================

-- Ensure all required columns exist
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS tickets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS artist_name TEXT;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- Update payment method constraint to allow all payment types
ALTER TABLE ticket_purchases DROP CONSTRAINT IF EXISTS ticket_purchases_payment_method_check;
ALTER TABLE ticket_purchases ADD CONSTRAINT ticket_purchases_payment_method_check 
CHECK (payment_method IN ('apple_pay', 'web3_wallet', 'card'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_user_id ON ticket_purchases(user_id);

-- =====================================================
-- STEP 2: Enable Row Level Security
-- =====================================================

ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Users can create their own ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Users can update their own ticket purchases" ON ticket_purchases;

-- Create RLS policies
CREATE POLICY "Users can view their own ticket purchases"
    ON ticket_purchases FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ticket purchases"
    ON ticket_purchases FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ticket purchases"
    ON ticket_purchases FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- STEP 3: Create helper functions
-- =====================================================

-- QR code generation function
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TICKET-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- View to easily query tickets
CREATE OR REPLACE VIEW v_user_tickets AS
SELECT 
    tp.id as purchase_id,
    tp.user_id,
    tp.event_id,
    tp.event_name,
    tp.artist_name,
    tp.venue,
    tp.event_date,
    tp.payment_method,
    tp.purchase_date,
    jsonb_array_element(tp.tickets, idx - 1) as ticket,
    idx as ticket_number
FROM ticket_purchases tp,
     generate_series(1, jsonb_array_length(tp.tickets)) as idx
WHERE tp.tickets IS NOT NULL;

-- Grant permissions
GRANT SELECT ON v_user_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qr_code() TO authenticated;

-- =====================================================
-- STEP 4: Example queries
-- =====================================================

-- Get all tickets for the current user
/*
SELECT 
    purchase_id,
    event_name,
    venue,
    event_date,
    ticket->>'id' as ticket_id,
    ticket->>'qrCode' as qr_code,
    ticket->>'status' as status,
    ticket->>'seatInfo' as seat_info
FROM v_user_tickets
WHERE user_id = auth.uid()
AND ticket->>'status' = 'valid'
ORDER BY event_date;
*/

-- Get tickets for a specific event
/*
SELECT 
    ticket->>'id' as ticket_id,
    ticket->>'qrCode' as qr_code,
    ticket->>'seatInfo' as seat_info
FROM v_user_tickets
WHERE user_id = auth.uid()
AND event_id = '1'
AND ticket->>'status' = 'valid';
*/

-- =====================================================
-- STEP 5: Test the system
-- =====================================================

-- Create a test purchase (replace user_id with actual ID)
/*
INSERT INTO ticket_purchases (
    user_id,
    event_id,
    event_name,
    artist_name,
    venue,
    event_date,
    quantity,
    total_price,
    payment_method,
    tickets
) VALUES (
    auth.uid(),
    'test-001',
    'Summer Concert 2025',
    'The Artist',
    'Madison Square Garden',
    '2025-09-15 20:00:00'::timestamp with time zone,
    2,
    179.98,
    'card',
    '[
        {
            "id": "TICKET-test1-001",
            "qrCode": "' || generate_qr_code() || '",
            "status": "valid",
            "seatInfo": "General Admission"
        },
        {
            "id": "TICKET-test2-002",
            "qrCode": "' || generate_qr_code() || '",
            "status": "valid",
            "seatInfo": "General Admission"
        }
    ]'::jsonb
);
*/

-- =====================================================
-- STEP 6: Troubleshooting
-- =====================================================

-- Check if user has any purchases
/*
SELECT count(*) FROM ticket_purchases WHERE user_id = auth.uid();
*/

-- View recent purchases with ticket count
/*
SELECT 
    id,
    event_name,
    venue,
    quantity,
    jsonb_array_length(tickets) as actual_tickets,
    payment_method,
    created_at
FROM ticket_purchases
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;
*/

-- Check ticket structure
/*
SELECT 
    id,
    jsonb_pretty(tickets) as tickets_json
FROM ticket_purchases
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;
*/
