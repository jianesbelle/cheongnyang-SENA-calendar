const GAS_URL = "https://script.google.com/macros/s/AKfycbwsBls7PiMPAwqNHufGBOqS6GbyxGJaYqetA88Y0CAxPh1cHOjK4oP_I_eEPjOyAxQt/exec";
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
