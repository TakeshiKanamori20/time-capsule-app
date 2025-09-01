// Vercel Serverless Function: /api/sendEmail
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const { email, encrypted, unlockAt, txUrl, capsuleId } = req.body;
  if (!email || !encrypted || !unlockAt || !txUrl || !capsuleId) {
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  // Resend API
  const subject = `Time Capsule: ${new Date(unlockAt * 1000).toLocaleDateString()}に開封予定`;
  const body = `あなたの手紙の控えです\n\nカプセルID: ${capsuleId}（復元時に必須です。必ず保管してください）\n暗号化メッセージ: ${encrypted}\n\n解錠予定: ${new Date(unlockAt * 1000).toLocaleString()}\nTx: ${txUrl}`;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "takeshi.kanamori@tkocean.net", // ←送り元アドレスを修正
        to: email,
        subject,
        text: body
      })
    });
    if (!resp.ok) throw new Error("Resend API error");
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
