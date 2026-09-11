const { put, get } = require("@vercel/blob");

async function readNotes() {
  try {
    const result = await get("notes.json", {
      access: "private",
      storeId: process.env.scd_data_STORE_ID,
    });
    if (!result || result.statusCode !== 200) return {};
    return await new Response(result.stream).json();
  } catch (err) {
    return {};
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const notes = await readNotes();
      res.status(200).json({ notes });
    } catch (err) {
      res.status(500).json({ error: (err && err.message) || "Failed to load notes" });
    }
    return;
  }

  if (req.method === "POST") {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : JSON.parse(req.body || "{}");
      const studentId = String(body.studentId || "").trim();
      if (!studentId) {
        res.status(400).json({ error: "studentId is required" });
        return;
      }
      const notes = await readNotes();
      const text = String(body.text || "").trim();
      if (text) {
        notes[studentId] = {
          text,
          updatedAt: new Date().toISOString(),
          updatedBy: body.updatedBy || "unknown",
        };
      } else {
        delete notes[studentId];
      }
      await put("notes.json", JSON.stringify(notes), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        storeId: process.env.scd_data_STORE_ID,
      });
      res.status(200).json({ ok: true, note: notes[studentId] || null });
    } catch (err) {
      res.status(500).json({ error: (err && err.message) || "Failed to save note" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
