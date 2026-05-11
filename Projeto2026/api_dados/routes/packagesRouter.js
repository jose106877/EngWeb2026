const express = require("express");
const multer = require("multer");
const { requireAdmin } = require("../middleware/auth");
const packageController = require("../controllers/packageController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const packageOnlyAdmin = [requireAdmin];

router.get(
  "/packages/export/:slug",
  packageOnlyAdmin,
  packageController.exportPackage,
);

router.get(
  "/packages/export/:slug/:_id",
  packageOnlyAdmin,
  packageController.exportPackage,
);

router.post(
  "/packages/import",
  packageOnlyAdmin,
  upload.single("sip"),
  packageController.importPackage,
);

router.post(
  "/packages/import/:slug",
  packageOnlyAdmin,
  upload.single("sip"),
  packageController.importPackage,
);

module.exports = router;
