const GAS_URL = "https://script.google.com/macros/s/AKfycbwTQePcg4Omr8SO7r17nLQ7rMwAQw7sTJXFVSu-6vEPrd4s5vCn5cyB2PipBAlTSteW/exec";
export default async function handler(req, res) {
  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "불러오기 실패" });
  }
}
