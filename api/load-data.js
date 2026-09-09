const { get } = require("@vercel/blob");

async function readJsonBlob(pathname) {
  try {
    const result = await get(pathname, {
      access: "private",
      storeId: process.env.scd_data_STORE_ID,
    });
    if (!result || result.statusCode !== 200) return null;
    return await new Response(result.stream).json();
  } catch (err) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const data = await readJsonBlob("latest-data.json");
    if (!data) {
      res.status(404).json({ error: "No data uploaded yet" });
      return;
    }
    const previous = await readJsonBlob("previous-data.json");
    res.status(200).json({ ...data, previous });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || "Failed to load data" });
  }
};
