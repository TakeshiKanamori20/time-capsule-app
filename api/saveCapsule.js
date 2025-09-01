const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


module.exports = async (req, res) => {
  try {

    const { email, unlock_time, encrypted_msg } = req.body;

    if (!email || !unlock_time || !encrypted_msg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { error } = await supabase
      .from('capsules')
      .insert({
        id: req.body.id,
        email: req.body.email,
        unlock_time: req.body.unlock_time,
        encrypted_msg: req.body.encrypted_msg,
        tx_url: req.body.txUrl || "N/A" // txUrlが無い場合はダミー値
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Capsule saved' });
  } catch (err) {
    console.error('Function error:', err);
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
};
