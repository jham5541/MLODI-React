-- Complete SQL Solution for Ticket Purchase System with QR Code Generation
-- This file contains all the SQL needed to set up a working ticket purchase system

-- =====================================================
-- PART 1: TABLE STRUCTURE
-- =====================================================

-- Ensure ticket_purchases table has all required columns
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS tickets JSONB DEFAULT '[]'::jsonb;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS event_name TEXT;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS artist_name TEXT;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS venue TEXT;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2);
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE ticket_purchases ADD COLUMN IF NOT EXISTS transaction_hash TEXT;

-- Fix the payment_method constraint to allow all payment types
ALTER TABLE ticket_purchases DROP CONSTRAINT IF EXISTS ticket_purchases_payment_method_check;
ALTER TABLE ticket_purchases ADD CONSTRAINT ticket_purchases_payment_method_check 
CHECK (payment_method IN ('apple_pay', 'web3_wallet', 'card'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id ON ticket_purchases(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_user_id ON ticket_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_purchase_date ON ticket_purchases(purchase_date);

-- =====================================================
-- PART 2: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view their own ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Users can create their own ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Users can update their own ticket purchases" ON ticket_purchases;

-- Users can only see their own purchases
CREATE POLICY "Users can view their own ticket purchases"
    ON ticket_purchases
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only create purchases for themselves
CREATE POLICY "Users can create their own ticket purchases"
    ON ticket_purchases
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own purchases
CREATE POLICY "Users can update their own ticket purchases"
    ON ticket_purchases
    FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- PART 3: QR CODE GENERATION FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
    -- Generate a unique QR code string
    -- Format: TICKET-[8 char hash]-[timestamp]
    RETURN 'TICKET-' || substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '-' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: TICKET PURCHASE FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION purchase_tickets_with_qr(
    p_user_id UUID,
    p_event_id TEXT,
    p_event_name TEXT,
    p_artist_name TEXT,
    p_venue TEXT,
    p_event_date TIMESTAMP WITH TIME ZONE,
    p_quantity INTEGER,
    p_unit_price NUMERIC,
    p_payment_method TEXT
)
RETURNS UUID AS $$
DECLARE
    v_purchase_id UUID;
    v_tickets JSONB;
    v_ticket JSONB;
    i INTEGER;
BEGIN
    -- Validate input
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be greater than 0';
    END IF;
    
    IF p_unit_price < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
    END IF;

    -- Generate tickets with unique QR codes
    v_tickets := '[]'::jsonb;
    FOR i IN 1..p_quantity LOOP
        v_ticket := jsonb_build_object(
            'id', 'TICKET-' || substr(md5(random()::text || i::text), 1, 8) || '-' || i,
            'qrCode', generate_qr_code(),
            'status', 'valid',
            'seatInfo', 'General Admission',
            'createdAt', now()
        );
        v_tickets := v_tickets || v_ticket;
    END LOOP;

    -- Insert the purchase record with tickets
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
        p_user_id,
        p_event_id,
        p_event_name,
        p_artist_name,
        p_venue,
        p_event_date,
        p_quantity,
        p_quantity * p_unit_price,
        NOW(),
        p_payment_method,
        v_tickets
    ) RETURNING id INTO v_purchase_id;

    RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: HELPER FUNCTIONS
-- =====================================================

-- Function to get tickets for a specific purchase
CREATE OR REPLACE FUNCTION get_purchase_tickets(p_purchase_id UUID)
RETURNS TABLE (
    ticket_id TEXT,
    qr_code TEXT,
    status TEXT,
    seat_info TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (ticket->>'id')::TEXT as ticket_id,
        (ticket->>'qrCode')::TEXT as qr_code,
        (ticket->>'status')::TEXT as status,
        (ticket->>'seatInfo')::TEXT as seat_info
    FROM ticket_purchases, 
         jsonb_array_elements(tickets) as ticket
    WHERE id = p_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate a ticket by QR code
CREATE OR REPLACE FUNCTION validate_ticket(p_qr_code TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    event_name TEXT,
    venue TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    seat_info TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (ticket->>'status' = 'valid')::BOOLEAN as is_valid,
        tp.event_name,
        tp.venue,
        tp.event_date,
        (ticket->>'seatInfo')::TEXT as seat_info
    FROM ticket_purchases tp,
         jsonb_array_elements(tp.tickets) as ticket
    WHERE ticket->>'qrCode' = p_qr_code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark a ticket as used
CREATE OR REPLACE FUNCTION use_ticket(p_qr_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_purchase_id UUID;
    v_tickets JSONB;
    v_updated_tickets JSONB = '[]'::jsonb;
    v_ticket JSONB;
    v_found BOOLEAN = false;
BEGIN
    -- Find the purchase containing this ticket
    SELECT id, tickets INTO v_purchase_id, v_tickets
    FROM ticket_purchases tp
    WHERE EXISTS (
        SELECT 1 FROM jsonb_array_elements(tp.tickets) as ticket
        WHERE ticket->>'qrCode' = p_qr_code
    );
    
    IF v_purchase_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Update the ticket status
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(v_tickets)
    LOOP
        IF v_ticket->>'qrCode' = p_qr_code THEN
            v_ticket := v_ticket || jsonb_build_object('status', 'used', 'usedAt', now());
            v_found := true;
        END IF;
        v_updated_tickets := v_updated_tickets || v_ticket;
    END LOOP;
    
    IF v_found THEN
        UPDATE ticket_purchases 
        SET tickets = v_updated_tickets
        WHERE id = v_purchase_id;
    END IF;
    
    RETURN v_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 6: VIEWS FOR EASIER QUERYING
-- =====================================================

-- View to see all tickets with purchase info
CREATE OR REPLACE VIEW v_tickets AS
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
    (ticket->>'id')::TEXT as ticket_id,
    (ticket->>'qrCode')::TEXT as qr_code,
    (ticket->>'status')::TEXT as status,
    (ticket->>'seatInfo')::TEXT as seat_info,
    (ticket->>'usedAt')::TIMESTAMP WITH TIME ZONE as used_at
FROM ticket_purchases tp,
     jsonb_array_elements(tp.tickets) as ticket;

-- Grant permissions on the view
GRANT SELECT ON v_tickets TO authenticated;

-- =====================================================
-- PART 7: PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ticket_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qr_code() TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_tickets_with_qr TO authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_tickets TO authenticated;
GRANT EXECUTE ON FUNCTION validate_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION use_ticket TO authenticated;

-- =====================================================
-- PART 8: SAMPLE QUERIES
-- =====================================================

-- Example: Purchase tickets
/*
SELECT purchase_tickets_with_qr(
    '390802df-a82d-4f34-9cd5-bf7484bf0df7'::uuid, -- user_id
    'event-001',                                   -- event_id
    'Summer Concert 2025',                         -- event_name
    'The Artist',                                  -- artist_name
    'Madison Square Garden',                       -- venue
    '2025-09-15 20:00:00'::timestamp with time zone, -- event_date
    2,                                             -- quantity
    89.99,                                         -- unit_price
    'card'                                         -- payment_method
);
*/

-- Example: Get all tickets for a user
/*
SELECT * FROM v_tickets 
WHERE user_id = auth.uid() 
AND status = 'valid'
ORDER BY event_date;
*/

-- Example: Validate a ticket at the venue
/*
SELECT * FROM validate_ticket('TICKET-abc12345-1234567890');
*/

-- Example: Mark a ticket as used when scanned at venue
/*
SELECT use_ticket('TICKET-abc12345-1234567890');
*/

-- =====================================================
-- PART 9: CLEANUP (if needed)
-- =====================================================

-- To remove everything and start fresh (BE CAREFUL!)
/*
DROP VIEW IF EXISTS v_tickets CASCADE;
DROP FUNCTION IF EXISTS use_ticket CASCADE;
DROP FUNCTION IF EXISTS validate_ticket CASCADE;
DROP FUNCTION IF EXISTS get_purchase_tickets CASCADE;
DROP FUNCTION IF EXISTS purchase_tickets_with_qr CASCADE;
DROP FUNCTION IF EXISTS generate_qr_code CASCADE;
DROP TABLE IF EXISTS ticket_purchases CASCADE;
*/
