-- Create enum for member roles
CREATE TYPE workspace_role AS ENUM ('owner', 'member');

-- Create enum for transaction types
CREATE TYPE transaction_type AS ENUM ('income', 'expense');

-- Function to automatically update 'updated_at' columns
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER handle_updated_at_workspaces
    BEFORE UPDATE ON workspaces
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. Workspace Members (maps auth.users to workspaces)
CREATE TABLE workspace_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role workspace_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- 3. Categories
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE, -- NULL means it's a global/default category
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    icon TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(12, 2) NOT NULL,
    type transaction_type NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    version_no INTEGER NOT NULL DEFAULT 1, -- For optimistic locking
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TRIGGER handle_updated_at_transactions
    BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Workspaces: Users can view workspaces they are members of
CREATE POLICY "Users can view workspaces they are members of" ON workspaces
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = workspaces.id AND user_id = auth.uid()
        )
    );

-- Workspaces: Only owners can update their workspaces
CREATE POLICY "Owners can update workspaces" ON workspaces
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = workspaces.id AND user_id = auth.uid() AND role = 'owner'
        )
    );

-- Workspace Members: Users can view members of their workspaces
CREATE POLICY "Users can view members of their workspaces" ON workspace_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members wm 
            WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid()
        )
    );

-- Categories: Users can view global categories OR categories for their workspaces
CREATE POLICY "Users can view global and workspace categories" ON categories
    FOR SELECT USING (
        workspace_id IS NULL OR 
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = categories.workspace_id AND user_id = auth.uid()
        )
    );

-- Transactions: Users can view transactions in their workspaces
CREATE POLICY "Users can view transactions in their workspaces" ON transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = transactions.workspace_id AND user_id = auth.uid()
        )
    );

-- Transactions: Users can insert transactions into their workspaces
CREATE POLICY "Users can insert transactions" ON transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = transactions.workspace_id AND user_id = auth.uid()
        )
    );

-- Transactions: Users can update transactions in their workspaces
CREATE POLICY "Users can update transactions" ON transactions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = transactions.workspace_id AND user_id = auth.uid()
        )
    );

-- Transactions: Users can delete transactions in their workspaces
CREATE POLICY "Users can delete transactions" ON transactions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM workspace_members 
            WHERE workspace_id = transactions.workspace_id AND user_id = auth.uid()
        )
    );
