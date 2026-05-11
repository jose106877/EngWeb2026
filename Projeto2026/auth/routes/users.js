"use strict";

const express = require("express");
const usersController = require("../controllers/usersController");
const { requireAdmin } = require("../auth/auth");

const router = express.Router();

router.post("/login", usersController.login);
router.get("/logout", usersController.logout);
router.get("/verify-admin", requireAdmin, usersController.verifyAdmin);

router.use(requireAdmin);

router.get("/", usersController.list);
router.post("/", usersController.create);
router.get("/:_id", usersController.findById);
router.put("/:_id", usersController.update);
router.delete("/:_id", usersController.remove);

module.exports = router;
