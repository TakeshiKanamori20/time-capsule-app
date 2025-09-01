import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // 1. unlockTime到達カプセル取得
  const { data, error } = await supabase
    .from('capsules')
    .select('*')
    .eq('sent', false)
    .lte('unlock_time', new Date().toISOString());

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(200).json({ message: 'No capsules to process' });

  // 2. メール送信＆sent更新
  for (const capsule of data) {
    try {
      await axios.post(process.env.SEND_EMAIL_API_URL, {
        email: capsule.email,
        encrypted: capsule.encrypted_msg,
        unlockAt: Math.floor(new Date(capsule.unlock_time).getTime() / 1000),
        txUrl: capsule.tx_url || "N/A", // txUrlが無い場合はダミー値
        serialId: capsule.serial_id
      });

      await supabase
        .from('capsules')
        .update({ sent: true })
        .eq('id', capsule.id);
    } catch (e) {
      console.error(`Failed to send for capsule ${capsule.id}:`, e.message);
      // 送信失敗時はsentをTRUEにしない
    }
  }

  return res.status(200).json({ message: 'Remind process finished' });
}
