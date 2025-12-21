/**
 * Remove old Valley Catholic teams (keeping VC teams)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  try {
    console.log('🗑️  Deleting old Valley Catholic teams...\n');

    // Delete the old teams with full name
    const { error: deleteError } = await supabase
      .from('teams')
      .delete()
      .in('name', ['Valley Catholic Boys Basketball', 'Valley Catholic Girls Basketball']);

    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }

    console.log('✅ Old teams deleted successfully!\n');
    console.log('✅ Only VC Boys Basketball and VC Girls Basketball remain.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup Error:', error.message);
    process.exit(1);
  }
}

cleanup();
