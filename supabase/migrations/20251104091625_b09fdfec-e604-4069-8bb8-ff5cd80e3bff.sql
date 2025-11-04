-- Add foreign key constraint from orders to nfc_cards
ALTER TABLE orders
ADD CONSTRAINT orders_nfc_card_id_fkey
FOREIGN KEY (nfc_card_id)
REFERENCES nfc_cards(id)
ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_nfc_card_id ON orders(nfc_card_id);