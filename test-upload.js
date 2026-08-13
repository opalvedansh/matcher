require('dotenv').config({ path: 'backend/.env' });
const { createClient } = require('@supabase/supabase-js');

async function test() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await supabase
    .storage
    .from('public')
    .createSignedUploadUrl('test/path.jpg');

  console.log('Error:', error);
  console.log('Data:', data);
}

test();
