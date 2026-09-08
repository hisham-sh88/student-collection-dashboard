const { get } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const result = await get("latest-data.json", {
      access: "private",
      storeId: process.env.scd_data_STORE_ID,
    });
    if (!result || result.statusCode !== 200) {
      res.status(404).json({ error: "No data uploaded yet" });
      return;
    }
    const data = await new Response(result.stream).json();
    res.status(200).json(data);
  } catch (err) {
    const message = (err && err.message) || "Failed to load data";
    if (/not.?found|does not exist/i.test(message) || (err && err.status === 404)) {
      res.status(404).json({ error: "No data uploaded yet" });
      return;
    }
    res.status(500).json({ error: message });
  }
};
