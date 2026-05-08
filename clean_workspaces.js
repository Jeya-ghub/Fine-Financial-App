const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: workspaces, error } = await supabase.from('workspaces').select('*');
  console.log('Workspaces:', workspaces, error);

  // If there are duplicates with the same name for the same user, let's delete the newer one
  if (workspaces) {
    const seen = new Set();
    for (const w of workspaces) {
      const key = w.name + w.created_by;
      if (seen.has(key)) {
        console.log('Deleting duplicate:', w.id, w.name);
        await supabase.from('transactions').delete().eq('workspace_id', w.id);
        await supabase.from('categories').delete().eq('workspace_id', w.id);
        await supabase.from('workspace_invites').delete().eq('workspace_id', w.id);
        await supabase.from('workspace_members').delete().eq('workspace_id', w.id);
        await supabase.from('workspaces').delete().eq('id', w.id);
      } else {
        seen.add(key);
      }
    }
  }
}

check();
