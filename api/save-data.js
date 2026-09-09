const { put, get } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
    const uploadedAt = body.uploadedAt || new Date().toISOString();
    const payload = JSON.stringify({
      students: body.students || [],
      payments: body.payments || [],
      notifications: body.notifications || [],
      uploadedAt,
      uploadedBy: body.uploadedBy || "unknown",
    });

    try {
      const existing = await get("latest-data.json", {
        access: "private",
        storeId: process.env.scd_data_STORE_ID,
      });
      if (existing && existing.statusCode === 200) {
        const existingText = await new Response(existing.stream).text();
        await put("previous-data.json", existingText, {
          access: "private",
          addRandomSuffix: false,
          allowOverwrite: true,
          contentType: "application/json",
          storeId: process.env.scd_data_STORE_ID,
        });
      }
    } catch (snapshotErr) {
      // No existing upload to snapshot yet (first-ever upload) — proceed regardless.
    }

    try {
      const historyPathname = `history/${new Date(uploadedAt).getTime()}.json`;
      await put(historyPathname, payload, {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        storeId: process.env.scd_data_STORE_ID,
      });
    } catch (historyErr) {
      // Archiving is best-effort — never block the live save on it.
    }

    await put("latest-data.json", payload, {
      access: "private",
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
