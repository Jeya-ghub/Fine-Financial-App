-- 1. Create master tables
CREATE TABLE IF NOT EXISTS public.master_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type transaction_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.master_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Alter existing tables
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS master_category_id UUID REFERENCES public.master_categories(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- Remove global null workspace categories (Decision 3: No workspace_id = NULL)
DELETE FROM public.categories WHERE workspace_id IS NULL;
DELETE FROM public.subcategories WHERE workspace_id IS NULL;

-- Add unique constraint index
CREATE UNIQUE INDEX IF NOT EXISTS categories_workspace_name_idx ON public.categories (workspace_id, lower(name)) WHERE is_archived = false;

ALTER TABLE public.subcategories
ADD COLUMN IF NOT EXISTS master_subcategory_id UUID REFERENCES public.master_subcategories(id),
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1 NOT NULL;

-- 3. Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'RESTORE')),
    old_data JSONB,
    new_data JSONB,
    version INTEGER NOT NULL,
    changed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. Enable RLS on new tables
ALTER TABLE public.master_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public read access to master_categories" ON public.master_categories;
CREATE POLICY "Public read access to master_categories" ON public.master_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read access to master_subcategories" ON public.master_subcategories;
CREATE POLICY "Public read access to master_subcategories" ON public.master_subcategories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Workspace members can view audit_logs" ON public.audit_logs;
CREATE POLICY "Workspace members can view audit_logs" ON public.audit_logs FOR SELECT
USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace members can insert audit_logs" ON public.audit_logs;
CREATE POLICY "Workspace members can insert audit_logs" ON public.audit_logs FOR INSERT
WITH CHECK (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- 5. Seed Master Data (Only if empty to prevent duplicates)
DO $$
DECLARE
    cat_salary_id UUID := gen_random_uuid();
    cat_investments_id UUID := gen_random_uuid();
    cat_other_income_id UUID := gen_random_uuid();
    cat_housing_id UUID := gen_random_uuid();
    cat_food_id UUID := gen_random_uuid();
    cat_trans_id UUID := gen_random_uuid();
    cat_util_id UUID := gen_random_uuid();
    cat_ent_id UUID := gen_random_uuid();
    cat_shop_id UUID := gen_random_uuid();
    cat_health_id UUID := gen_random_uuid();
    master_count INT;
BEGIN
    SELECT count(*) INTO master_count FROM public.master_categories;
    IF master_count = 0 THEN
        INSERT INTO public.master_categories (id, name, type) VALUES
        (cat_salary_id, 'Salary', 'income'),
        (cat_investments_id, 'Investments', 'income'),
        (cat_other_income_id, 'Other Income', 'income'),
        (cat_housing_id, 'Housing', 'expense'),
        (cat_food_id, 'Food', 'expense'),
        (cat_trans_id, 'Transportation', 'expense'),
        (cat_util_id, 'Utilities', 'expense'),
        (cat_ent_id, 'Entertainment', 'expense'),
        (cat_shop_id, 'Shopping', 'expense'),
        (cat_health_id, 'Health', 'expense');

        INSERT INTO public.master_subcategories (category_id, name) VALUES
        (cat_housing_id, 'Rent/Mortgage'),
        (cat_food_id, 'Groceries'),
        (cat_trans_id, 'Fuel');
    END IF;
END $$;

-- 6. Trigger: Auto-Clone on Workspace Creation
CREATE OR REPLACE FUNCTION clone_master_categories_to_workspace()
RETURNS TRIGGER AS $$
DECLARE
    master_cat RECORD;
    master_sub RECORD;
    new_cat_id UUID;
BEGIN
    -- For each master category
    FOR master_cat IN SELECT * FROM public.master_categories LOOP
        new_cat_id := gen_random_uuid();
        
        -- Insert clone
        INSERT INTO public.categories (id, workspace_id, master_category_id, name, type, is_default, version)
        VALUES (new_cat_id, NEW.id, master_cat.id, master_cat.name, master_cat.type, true, 1);
        
        -- For each subcategory under this master category
        FOR master_sub IN SELECT * FROM public.master_subcategories WHERE category_id = master_cat.id LOOP
            INSERT INTO public.subcategories (workspace_id, category_id, master_subcategory_id, name, is_default, version)
            VALUES (NEW.id, new_cat_id, master_sub.id, master_sub.name, true, 1);
        END LOOP;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_workspace_created_clone_categories ON public.workspaces;
CREATE TRIGGER on_workspace_created_clone_categories
AFTER INSERT ON public.workspaces
FOR EACH ROW EXECUTE FUNCTION clone_master_categories_to_workspace();

-- 7. Trigger: Audit Logs for Categories and Subcategories
CREATE OR REPLACE FUNCTION log_category_audit()
RETURNS TRIGGER AS $$
DECLARE
    acting_user_id UUID;
BEGIN
    -- Try to get the current user ID, if not available (e.g. system trigger), it will be NULL
    BEGIN
        acting_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        acting_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (workspace_id, table_name, record_id, action, new_data, version, changed_by)
        VALUES (NEW.workspace_id, TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW)::jsonb, NEW.version, acting_user_id);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.is_archived = false AND NEW.is_archived = true THEN
            INSERT INTO public.audit_logs (workspace_id, table_name, record_id, action, old_data, new_data, version, changed_by)
            VALUES (NEW.workspace_id, TG_TABLE_NAME, NEW.id, 'DELETE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.version, acting_user_id);
        ELSIF OLD.is_archived = true AND NEW.is_archived = false THEN
            INSERT INTO public.audit_logs (workspace_id, table_name, record_id, action, old_data, new_data, version, changed_by)
            VALUES (NEW.workspace_id, TG_TABLE_NAME, NEW.id, 'RESTORE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.version, acting_user_id);
        ELSE
            INSERT INTO public.audit_logs (workspace_id, table_name, record_id, action, old_data, new_data, version, changed_by)
            VALUES (NEW.workspace_id, TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.version, acting_user_id);
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (workspace_id, table_name, record_id, action, old_data, version, changed_by)
        VALUES (OLD.workspace_id, TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD)::jsonb, OLD.version, acting_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_categories_changes ON public.categories;
CREATE TRIGGER audit_categories_changes
AFTER INSERT OR UPDATE OR DELETE ON public.categories
FOR EACH ROW EXECUTE FUNCTION log_category_audit();

DROP TRIGGER IF EXISTS audit_subcategories_changes ON public.subcategories;
CREATE TRIGGER audit_subcategories_changes
AFTER INSERT OR UPDATE OR DELETE ON public.subcategories
FOR EACH ROW EXECUTE FUNCTION log_category_audit();

-- 8. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_transactions_workspace_id ON public.transactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON public.audit_logs(record_id);

-- 9. Realtime setup
-- Wait, using DO block for realtime publication isn't strictly necessary if it already exists,
-- but we should ensure it.
DO $$
BEGIN
  -- We just silently catch if it fails because it's already there or not supported in this env.
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE categories;
  EXCEPTION WHEN OTHERS THEN NULL; END;
  
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE subcategories;
  EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;
