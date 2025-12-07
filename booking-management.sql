ALTER TABLE bookings ADD COLUMN IF NOT EXISTS destination_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS return_date TIMESTAMP; 
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_id UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_deadline TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS facilities JSONB DEFAULT '{"accommodation": false, "transport": false, "flight": false}';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS booking_passengers JSONB DEFAULT '[]';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_booking_destination') THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_booking_destination 
        FOREIGN KEY (destination_id) 
        REFERENCES destinations(id) 
        ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_booking_payment') THEN
        ALTER TABLE bookings 
        ADD CONSTRAINT fk_booking_payment 
        FOREIGN KEY (payment_id) 
        REFERENCES payments(id) 
        ON DELETE SET NULL;
    END IF;
END $$;
