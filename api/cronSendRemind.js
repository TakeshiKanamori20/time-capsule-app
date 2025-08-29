const { createClient } = require('@supabase/supabase-js');
const axios = require('axios'); // sendEmail API呼び出し用

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // 1. unlockTime到達カプセル取得
  const { data, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('sent', false)
    .lte('unlock_time', new Date().toISOString());

  if (error) return res.status(500).json({ error: error.message });

  // 2. メール送信＆sent更新
  for (const capsule of data) {
    try {
      await axios.post(process.env.SEND_EMAIL_API_URL, {
        email: capsule.email,
        encrypted_msg: capsule.encrypted_msg,
        unlock_time: capsule.unlock_time,
        id: capsule.id,
      });
      await supabase
        .from('capsules')
        .update({ sent: true })
        .eq('id', capsule.id);
    } catch (e) {
      // エラー時はログのみ
      console.error(`Failed to send for capsule ${capsule.id}:`, e.message);
    }
  }

  return res.status(200).json({ message: 'Remind process finished' });
};
