"use strict";

const express = require("express");
const axios = require("axios");
const { registerAdminPages } = require("../interfaceLogic/adminPages");
const { registerApiProxy } = require("../interfaceLogic/apiProxy");
const { registerHomePage } = require("../interfaceLogic/homePage");
const {
  registerInstagramImageProxy,
} = require("../interfaceLogic/instagramImage");

function createIndexRouter({
  apiBaseUrl,
  documentsRoot,
  getTokenFromRequest,
  requireAdminAuth,
}) {
  const router = express.Router();
  const api = axios.create({ baseURL: apiBaseUrl });

  registerInstagramImageProxy(router);
  registerApiProxy(router, { api, getTokenFromRequest, requireAdminAuth });
  registerHomePage(router, { api, documentsRoot });
  registerAdminPages(router, { api, getTokenFromRequest });

  return router;
}

module.exports = createIndexRouter;
