require('dotenv').config();
const { supabase } = require('./supabase');

async function cleanupPlaceholderTeams() {
  try {
    console.log('Deleting placeholder teams...');
    
    // Delete Valiants Boys Basketball team
    const { data: boysTeam, error: boysError } = await supabase
      .from('teams')
      .delete()
      .eq('name', 'Valiants Boys Basketball');
    
    if (boysError) throw boysError;
    console.log('✅ Deleted "Valiants Boys Basketball"');
    
    // Delete Valiants Girls Basketball team
    const { data: girlsTeam, error: girlsError } = await supabase
      .from('teams')
      .delete()
      .eq('name', 'Valiants Girls Basketball');
    
    if (girlsError) throw girlsError;
    console.log('✅ Deleted "Valiants Girls Basketball"');
    
    console.log('\n✅ Cleanup complete! Placeholder teams removed.');
  } catch (err) {
    console.error('❌ Error cleaning up teams:', err.message);
    process.exit(1);
  }
}

cleanupPlaceholderTeams();
