-- Migration to fix ticket purchase functionality
-- This ensures tickets are properly stored and can be retrieved after purchase

-- First, check if the ticket_purchases table exists and has the correct structure
-- If it doesn't have a tickets JSONB column, add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'tickets'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN tickets JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Ensure all required columns exist in ticket_purchases
DO $$ 
BEGIN
    -- Add event_name if missing
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'event_name'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN event_name TEXT;
    END IF;

    -- Add artist_name if missing
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'artist_name'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN artist_name TEXT;
    END IF;

    -- Add venue if missing
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'venue'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN venue TEXT;
    END IF;

    -- Add event_date if missing
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'event_date'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN event_date TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add total_price if missing (rename from total_amount if needed)
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'total_price'
    ) AND EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE ticket_purchases 
        RENAME COLUMN total_amount TO total_price;
    ELSIF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'total_price'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN total_price NUMERIC(10,2);
    END IF;

    -- Add purchase_date if missing
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'purchase_date'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Add transaction_hash if missing (for storing payment reference)
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'ticket_purchases' 
        AND column_name = 'transaction_hash'
    ) THEN
        ALTER TABLE ticket_purchases 
        ADD COLUMN transaction_hash TEXT;
    END IF;
END $$;

-- Create an index on event_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_event_id 
ON ticket_purchases(event_id);

-- Create an index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_ticket_purchases_user_id 
ON ticket_purchases(user_id);

-- Enable RLS if not already enabled
ALTER TABLE ticket_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Users can view their own ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Users can create their own ticket purchases" ON ticket_purchases;
DROP POLICY IF EXISTS "Users can update their own ticket purchases" ON ticket_purchases;

-- Create RLS policies
CREATE POLICY "Users can view their own ticket purchases"
    ON ticket_purchases
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ticket purchases"
    ON ticket_purchases
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ticket purchases"
    ON ticket_purchases
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Sample function to generate a QR code (for demonstration)
-- In production, use a proper QR code generation library
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TICKET-' || substr(md5(random()::text), 1, 8) || '-' || extract(epoch from now())::bigint;
END;
$$ LANGUAGE plpgsql;

-- Function to purchase tickets with automatic ticket generation
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
    -- Generate tickets with QR codes
    v_tickets := '[]'::jsonb;
    FOR i IN 1..p_quantity LOOP
        v_ticket := jsonb_build_object(
            'id', 'TICKET-' || substr(md5(random()::text), 1, 8) || '-' || i,
            'qrCode', generate_qr_code(),
            'status', 'valid',
            'seatInfo', 'General Admission'
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ticket_purchases TO authenticated;
GRANT EXECUTE ON FUNCTION generate_qr_code() TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_tickets_with_qr TO authenticated;

-- Add some test data (optional - comment out in production)
-- This creates a sample ticket purchase for testing
/*
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get a random user ID from auth.users (or use a specific one)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Create a sample purchase
        PERFORM purchase_tickets_with_qr(
            v_user_id,
            'test-event-001',
            'Summer Concert 2025',
            'The Artist',
            'Madison Square Garden',
            '2025-09-15 20:00:00'::timestamp with time zone,
            2,
            89.99,
            'card'
        );
        RAISE NOTICE 'Test ticket purchase created successfully';
    END IF;
END $$;
*/

-- Verify the structure
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'ticket_purchases'
ORDER BY ordinal_position;
