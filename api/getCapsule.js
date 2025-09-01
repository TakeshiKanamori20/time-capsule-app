import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  let serialId;
  if (req.method === "GET") {
    serialId = req.query.serialId;
  } else if (req.method === "POST") {
    serialId = req.body.serialId;
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!serialId) return res.status(400).json({ error: 'Missing capsule ID' });

  const { data, error } = await supabase
    .from('capsules')
    .select('encrypted_msg')
    .eq('serial_id', serialId) // serial_idで検索
    .single();

  if (error || !data) return res.status(404).json({ error: 'カプセルが見つかりません' });
  return res.status(200).json({ encrypted_msg: data.encrypted_msg });
}
