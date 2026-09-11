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

function normalizeNotes(raw) {
  const out = {};
  Object.keys(raw || {}).forEach((studentId) => {
    const value = raw[studentId];
    if (Array.isArray(value)) {
      out[studentId] = value;
    } else if (value && typeof value === "object") {
      // Migrate the old single-note-per-student shape into a list.
      out[studentId] = [{
        id: "legacy-" + studentId,
        text: value.text || "",
        createdAt: value.updatedAt || new Date().toISOString(),
        createdBy: value.updatedBy || "unknown",
      }];
    }
  });
  return out;
}

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const notes = normalizeNotes(await readNotes());
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
      const text = String(body.text || "").trim();
      if (!studentId || !text) {
        res.status(400).json({ error: "studentId and text are required" });
        return;
      }
      const notes = normalizeNotes(await readNotes());
      const list = Array.isArray(notes[studentId]) ? notes[studentId] : [];
      const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        createdAt: new Date().toISOString(),
        createdBy: body.createdBy || "unknown",
      };
      list.unshift(entry);
      notes[studentId] = list;
      await put("notes.json", JSON.stringify(notes), {
        access: "private",
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: "application/json",
        storeId: process.env.scd_data_STORE_ID,
      });
      res.status(200).json({ ok: true, note: entry });
    } catch (err) {
      res.status(500).json({ error: (err && err.message) || "Failed to save note" });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed" });
};
