"use strict";

const PUBLIC_MUTATION_API_PATHS = new Set(["/apoio-aluno"]);

function registerApiProxy(router, { api, getTokenFromRequest, requireAdminAuth }) {
  router.get(
    "/api/atividades/instagram-media",
    requireAdminAuth,
    async (req, res) => {
      try {
        const response = await api.get("/api/atividades/instagram-media", {
          headers: buildProxyHeaders(req, getTokenFromRequest),
        });
        res.status(response.status).json(response.data);
      } catch (err) {
        const status = err.response?.status || 502;
        res.status(status).json(err.response?.data || { message: err.message });
      }
    },
  );

  router.use("/api", (req, res, next) => {
    if (!isMutationMethod(req.method)) return next();
    if (PUBLIC_MUTATION_API_PATHS.has(req.path)) return next();
    return requireAdminAuth(req, res, next);
  });

  router.use("/api", async (req, res) => {
    const isPackageRequest = req.path.startsWith("/packages/");

    try {
      let data;
      let headers = buildProxyHeaders(req, getTokenFromRequest);

      if (isMultipartRequest(req)) {
        if (req.headers["content-length"]) {
          headers["Content-Length"] = req.headers["content-length"];
        }
        data = req;
      } else {
        data = req.body;
        headers = {
          ...headers,
          "Content-Type": "application/json",
        };
      }

      const response = await api({
        method: req.method,
        url: `/api${req.path}`,
        data,
        headers,
        responseType: isPackageRequest ? "arraybuffer" : "json",
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      if (isPackageRequest) {
        sendPackageResponse(res, response);
        return;
      }

      res.status(response.status).json(response.data);
    } catch (err) {
      const status = err.response?.status || 502;
      if (isPackageRequest && Buffer.isBuffer(err.response?.data)) {
        const contentType = String(err.response?.headers?.["content-type"] || "");
        if (contentType.includes("application/json")) {
          try {
            res.status(status).json(JSON.parse(err.response.data.toString("utf8")));
            return;
          } catch {
            // fallback below
          }
        }
      }
      res.status(status).json(err.response?.data || { message: err.message });
    }
  });

  router.get(["/media/*path", "/download/*path"], async (req, res) => {
    try {
      const response = await api.get(req.path, { responseType: "stream" });
      res.setHeader("Content-Type", response.headers["content-type"]);
      response.data.pipe(res);
    } catch (err) {
      console.error("[proxy] media error:", err.message);
      res.status(502).send("Media unavailable");
    }
  });
}

function isMutationMethod(method) {
  return ["POST", "PUT", "PATCH", "DELETE"].includes(
    String(method || "").toUpperCase(),
  );
}

function buildProxyHeaders(req, getTokenFromRequest) {
  const headers = {};
  const contentType = req.headers["content-type"];
  const authToken = getTokenFromRequest(req);

  if (contentType) headers["Content-Type"] = contentType;
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  return headers;
}

function isMultipartRequest(req) {
  return /^multipart\/form-data\b/i.test(String(req.headers["content-type"] || ""));
}

function sendPackageResponse(res, response) {
  if (response.headers["content-type"]) {
    res.setHeader("Content-Type", response.headers["content-type"]);
  }
  if (response.headers["content-disposition"]) {
    res.setHeader("Content-Disposition", response.headers["content-disposition"]);
  }
  res.status(response.status).send(Buffer.from(response.data));
}

module.exports = {
  registerApiProxy,
};
