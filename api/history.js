const { list, get } = require("@vercel/blob");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const pathname = req.query && req.query.pathname;

    if (pathname) {
      if (!/^history\/\d+\.json$/.test(pathname)) {
        res.status(400).json({ error: "Invalid pathname" });
        return;
      }
      const result = await get(pathname, {
        access: "private",
        storeId: process.env.scd_data_STORE_ID,
      });
      if (!result || result.statusCode !== 200) {
        res.status(404).json({ error: "Report not found" });
        return;
      }
      const data = await new Response(result.stream).json();
      res.status(200).json(data);
      return;
    }

    const { blobs } = await list({
      prefix: "history/",
      access: "private",
      storeId: process.env.scd_data_STORE_ID,
    });
    const entries = blobs
      .map((b) => {
        const match = b.pathname.match(/^history\/(\d+)\.json$/);
        if (!match) return null;
        return { pathname: b.pathname, uploadedAt: new Date(Number(match[1])).toISOString() };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    res.status(200).json({ entries });
  } catch (err) {
    res.status(500).json({ error: (err && err.message) || "Failed to load history" });
  }
};
