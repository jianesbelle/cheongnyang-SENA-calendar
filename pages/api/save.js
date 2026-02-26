const GAS_URL = "https://script.google.com/macros/s/AKfycbx1o42knOmWJcgwQluC7hUs0ZweQ122FpjSdMCUQqw2BPYH-6IXCPxAkECt0MAlF00_/exec";

export const config = { api: { bodyParser: { sizeLimit: "4mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "저장 실패" });
  }
}
