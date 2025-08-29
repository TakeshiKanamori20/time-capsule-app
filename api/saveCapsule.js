const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  const { id, email, unlock_time, encrypted_msg } = req.body;

  if (!id || !email || !unlock_time || !encrypted_msg) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const { error } = await supabase
    .from('capsules')
    .insert([
      {
        id,
        email,
        unlock_time,
        encrypted_msg,
        sent: false,
        created_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ message: 'Capsule saved' });
};
