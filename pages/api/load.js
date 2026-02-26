const GAS_URL = "https://script.google.com/macros/s/AKfycbwsBls7PiMPAwqNHufGBOqS6GbyxGJaYqetA88Y0CAxPh1cHOjK4oP_I_eEPjOyAxQt/exec";
export default async function handler(req, res) {
  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "불러오기 실패" });
  }
}
