-- Migration to add client_notes table
-- This table stores notes for clients identified by their phone number

-- Create client_notes table
CREATE TABLE IF NOT EXISTS client_notes (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_client_notes_phone_number ON client_notes(phone_number);

-- Create unique constraint to ensure one note record per phone number
ALTER TABLE client_notes ADD CONSTRAINT unique_phone_number UNIQUE (phone_number);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_client_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_client_notes_updated_at
  BEFORE UPDATE ON client_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_client_notes_updated_at();

-- Add some sample data (optional - remove if not needed)
-- INSERT INTO client_notes (phone_number, notes) VALUES 
-- ('0123456789', 'Client très sympathique, préfère les événements en extérieur'),
-- ('0987654321', 'Demande toujours des devis détaillés, attention aux délais');

