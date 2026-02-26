const GAS_URL = "https://script.google.com/macros/s/AKfycbx1o42knOmWJcgwQluC7hUs0ZweQ122FpjSdMCUQqw2BPYH-6IXCPxAkECt0MAlF00_/exec";
export default async function handler(req, res) {
  try {
    const response = await fetch(GAS_URL);
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "불러오기 실패" });
  }
}
