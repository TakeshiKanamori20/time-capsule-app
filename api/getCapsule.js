import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  let id;
  if (req.method === "GET") {
    id = req.query.id;
  } else if (req.method === "POST") {
    id = req.body.id;
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!id) return res.status(400).json({ error: 'Missing capsule ID' });

  const { data, error } = await supabase
    .from('capsules')
    .select('encrypted_msg')
    .eq('id', id)
    .single();

  if (error || !data) return res.status(404).json({ error: 'カプセルが見つかりません' });
  return res.status(200).json({ encrypted_msg: data.encrypted_msg });
}
