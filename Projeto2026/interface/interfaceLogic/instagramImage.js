"use strict";

const { Readable } = require("stream");

function registerInstagramImageProxy(router) {
  router.get("/instagram-image", async (req, res) => {
    try {
      const raw = String(req.query.url || "").trim();
      if (!raw) return res.status(400).send("Missing image url");

      const target = new URL(raw);
      if (
        target.protocol !== "https:" ||
        !isAllowedInstagramImageHost(target.hostname)
      ) {
        return res.status(400).send("Unsupported image host");
      }

      const response = await fetch(target.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Referer: "https://www.instagram.com/",
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        return res.status(response.status).send("Image unavailable");
      }

      const contentType = response.headers.get("content-type");
      if (contentType) res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      Readable.fromWeb(response.body).pipe(res);
    } catch (err) {
      const status = err.response?.status || 502;
      res.status(status).send("Image unavailable");
    }
  });
}

function isAllowedInstagramImageHost(hostname) {
  const host = String(hostname || "").toLowerCase();
  return (
    host === "instagram.com" ||
    host.endsWith(".instagram.com") ||
    host === "fbcdn.net" ||
    host.endsWith(".fbcdn.net")
  );
}

module.exports = {
  registerInstagramImageProxy,
};
