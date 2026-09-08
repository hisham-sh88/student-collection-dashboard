const { put } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const payload = JSON.stringify({
      students: body.students || [],
      payments: body.payments || [],
      notifications: body.notifications || [],
      uploadedAt: body.uploadedAt || new Date().toISOString(),
      uploadedBy: body.uploadedBy || "unknown",
    });
    await put("latest-data.json", payload, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      storeId: process.env.scd_data_STORE_ID,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || "Failed to save data" });
  }
};
