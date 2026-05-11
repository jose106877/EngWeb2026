const express = require("express");
const path = require("path");
const fs = require("fs");
const cookieParser = require("cookie-parser");
const createIndexRouter = require("./routes/indexRouter");
const createUsersRouter = require("./routes/usersRouter");
const {
  attachAuthContext,
  clearAuthCookie,
  getTokenFromRequest,
  DEFAULT_REDIRECT_PATH,
  isAuthenticated,
  issueAuthCookie,
  requireAdminAuth,
  sanitizeRedirectPath,
} = require("./interfaceLogic/auth");

const PORT = process.env.PORT || 7789;
const API_URL = process.env.API_URL || "http://localhost:7777";
const AUTH_URL = process.env.AUTH_URL || "http://localhost:19000";
const app = express();

const DOCUMENTS_ROOT_CANDIDATES = [
  path.join(__dirname, "..", "media", "documentos"),
];

function resolveDocumentsRoot() {
  return (
    DOCUMENTS_ROOT_CANDIDATES.find((candidatePath) =>
      fs.existsSync(candidatePath),
    ) || DOCUMENTS_ROOT_CANDIDATES[0]
  );
}

const documentsRoot = resolveDocumentsRoot();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(attachAuthContext);

app.use(
  "/static",
  express.static(path.join(__dirname, "static"), {
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  }),
);
app.use(
  "/documentos",
  express.static(documentsRoot, {
    maxAge: process.env.NODE_ENV === "production" ? "1h" : 0,
  }),
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(
  "/users",
  createUsersRouter({
    authBaseUrl: AUTH_URL,
    clearAuthCookie,
    DEFAULT_REDIRECT_PATH,
    isAuthenticated,
    issueAuthCookie,
    sanitizeRedirectPath,
  }),
);

app.use(
  createIndexRouter({
    apiBaseUrl: API_URL,
    documentsRoot,
    getTokenFromRequest,
    requireAdminAuth,
  }),
);

app.listen(PORT, () => {
  console.log(`AEEUM → http://localhost:${PORT}`);
  console.log(`API target → ${API_URL}`);
  console.log(`Auth target → ${AUTH_URL}`);
});
