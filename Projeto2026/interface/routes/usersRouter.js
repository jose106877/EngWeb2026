const express = require("express");
const axios = require("axios");

function createUsersRouter({
  authBaseUrl,
  clearAuthCookie,
  DEFAULT_REDIRECT_PATH,
  isAuthenticated,
  issueAuthCookie,
  sanitizeRedirectPath,
}) {
  const router = express.Router();
  const authApi = axios.create({ baseURL: authBaseUrl });

  router.get("/login", (req, res) => {
    const redirectTo = sanitizeRedirectPath(
      req.query.redirect || DEFAULT_REDIRECT_PATH,
    );

    if (isAuthenticated(req)) {
      res.redirect(redirectTo);
      return;
    }

    res.render("login", {
      redirectTo,
      error: null,
      formData: {},
    });
  });

  router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const redirectTo = sanitizeRedirectPath(
      req.body.redirect || DEFAULT_REDIRECT_PATH,
    );

    try {
      const response = await authApi.post("/users/login", {
        username,
        password,
      });

      const authenticatedUser = response.data?.user || response.data || {};
      const token = response.data?.token || authenticatedUser.token;

      if (authenticatedUser.role !== "admin") {
        res.status(403).render("login", {
          redirectTo,
          error: "Sem permissões de administração.",
          formData: { username },
        });
        return;
      }

      issueAuthCookie(res, {
        sub: authenticatedUser.id || authenticatedUser.username || "admin",
        username: authenticatedUser.username || username,
        nome: authenticatedUser.nome || process.env.ADMIN_DISPLAY_NAME,
        role: authenticatedUser.role === "admin" ? "admin" : "consumidor",
        token,
      });

      res.redirect(redirectTo);
    } catch (err) {
      const status = err.response?.status;

      if (status === 400 || status === 401) {
        res.status(401).render("login", {
          redirectTo,
          error: "Credenciais inválidas.",
          formData: { username },
        });
        return;
      }

      console.error("[auth] API error:", err.message);
      res.status(502).render("login", {
        redirectTo,
        error: "Serviço de autenticação indisponível.",
        formData: { username },
      });
    }
  });

  router.get("/logout", (req, res) => {
    clearAuthCookie(res);
    res.redirect("/users/login");
  });

  return router;
}

module.exports = createUsersRouter;
