const express = require("express");
const router = express.Router();
const createUpload = require("../middleware/upload");
const upload = createUpload("atividades", "imagem");
const atividadeController = require("../controllers/atividadeController");
const { requireAdmin } = require("../middleware/auth");

// Feed público (sem autenticação)
router.get("/atividades-feed", atividadeController.getAtividadesFeed);

// Admin / curadoria: Instagram (rotas específicas antes de /:_id)
router.get(
  "/atividades/instagram-media",
  requireAdmin,
  atividadeController.getInstagramMediaForAdmin,
);
router.post(
  "/atividades/import-instagram",
  requireAdmin,
  atividadeController.importInstagramAtividades,
);

// Nova atividade
router.post(
  "/atividades",
  upload.single("imagem"),
  atividadeController.createAtividade,
);

// Listar publicações
router.get("/atividades", atividadeController.getAllAtividades);

// Consultar uma atividade
router.get("/atividades/:_id", atividadeController.getAtividadeById);

// Alterar uma atividade
router.put(
  "/atividades/:_id",
  upload.single("imagem"),
  atividadeController.updateAtividade,
);

// Apagar uma atividade
router.delete("/atividades/:_id", atividadeController.deleteAtividade);

module.exports = router;
