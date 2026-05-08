-- Add is_archived column to categories to support soft deletes
ALTER TABLE categories ADD COLUMN is_archived BOOLEAN DEFAULT false;

-- Add is_archived column to subcategories
ALTER TABLE subcategories ADD COLUMN is_archived BOOLEAN DEFAULT false;
