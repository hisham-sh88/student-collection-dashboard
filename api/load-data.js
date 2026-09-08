const { head } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const info = await head("latest-data.json");
    const upstream = await fetch(info.url, { cache: "no-store" });
    if (!upstream.ok) throw new Error("Blob fetch failed with status " + upstream.status);
    const data = await upstream.json();
    res.status(200).json(data);
  } catch (err) {
    const message = (err && err.message) || "Failed to load data";
    if (/not.?found/i.test(message) || (err && err.status === 404)) {
      res.status(404).json({ error: "No data uploaded yet" });
      return;
    }
    res.status(500).json({ error: message });
  }
};
