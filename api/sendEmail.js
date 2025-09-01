// Vercel Serverless Function: /api/sendEmail
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  console.log('Request body:', req.body);
  const { email, encrypted, unlockAt, txUrl, serialId } = req.body;
  if (!email || !encrypted || !unlockAt || !serialId) { // txUrlは必須から外す
    res.status(400).json({ error: "Missing fields" });
    return;
  }
  const subject = `Time Capsule: ${new Date(unlockAt * 1000).toLocaleDateString()}に開封予定`;
  const body = `あなたの手紙の控えです\n\nカプセルID: ${serialId}\n暗号化メッセージ: ${encrypted}\n\n解錠予定: ${new Date(unlockAt * 1000).toLocaleString()}\nTx: ${txUrl || "N/A"}`;
  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "takeshi.kanamori@tkocean.net",
        to: email,
        subject,
        text: body
      })
    });
    if (!resp.ok) {
      const errorText = await resp.text();
      throw new Error("Resend API error: " + errorText);
    }
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
