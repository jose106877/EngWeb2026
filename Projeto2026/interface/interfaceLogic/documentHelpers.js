"use strict";

const fsPromises = require("fs/promises");
const path = require("path");

function normalizeMediaPath(value, fallbackPrefix = "") {
  const content = String(value || "").trim();
  if (!content) return null;
  if (
    /^(https?:)?\/\//i.test(content) ||
    content.startsWith("/media/") ||
    content.startsWith("/download/")
  ) {
    return content;
  }
  if (!fallbackPrefix) return content;
  return `${fallbackPrefix.replace(/\/$/, "")}/${content.replace(/^\//, "")}`;
}

function normalizeForMatch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function inferPrivacyFromDocumentPath(relativePath) {
  const normalized = normalizeForMatch(relativePath).replace(/\\/g, "/");

  if (normalized.includes("/estatutos/") || normalized.includes("estatuto")) {
    return "estatutos";
  }
  if (
    normalized.includes("/plano orcamental/") ||
    normalized.includes("/plano de atividades/") ||
    normalized.includes("plano orcamental") ||
    normalized.includes("plano de atividades")
  ) {
    return "planeamento";
  }
  if (normalized.includes("/direcao/") || normalized.includes("direcao")) {
    return "direcao";
  }
  if (
    normalized.includes("/mag/") ||
    normalized.includes("mesa da assembleia geral") ||
    normalized.includes("assembleias gerais") ||
    normalized.includes("/assembleia")
  ) {
    return "ag";
  }
  if (normalized.includes("/cfj/") || normalized.includes("fiscal")) {
    return "fiscal";
  }

  return "outros";
}

async function collectFilesRecursively(rootDir, currentDir = rootDir) {
  const entries = await fsPromises.readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFilesRecursively(rootDir, absolutePath)));
      continue;
    }

    if (!entry.isFile()) continue;
    files.push(path.relative(rootDir, absolutePath));
  }

  return files;
}

async function loadLocalRegulationsFallback(documentsRoot) {
  const allowedExtensions = new Set([
    ".pdf",
    ".doc",
    ".docx",
    ".odt",
    ".xls",
    ".xlsx",
    ".csv",
    ".ppt",
    ".pptx",
  ]);

  try {
    const files = await collectFilesRecursively(documentsRoot);

    return files
      .filter((relativePath) =>
        allowedExtensions.has(path.extname(relativePath).toLowerCase()),
      )
      .map((relativePath, index) => {
        const normalizedRelativePath = relativePath.split(path.sep).join("/");
        const filename = path.basename(relativePath);
        const nameWithoutExtension = filename.replace(/\.[^.]+$/, "").trim();
        const yearMatch = nameWithoutExtension.match(/(?:19|20)\d{2}/);

        return {
          id: `local-reg-${index + 1}`,
          nome: nameWithoutExtension || filename,
          ano: yearMatch ? yearMatch[0] : "",
          departamento: inferPrivacyFromDocumentPath(normalizedRelativePath),
          privacidade: inferPrivacyFromDocumentPath(normalizedRelativePath),
          link: `/documentos/${encodeURI(normalizedRelativePath)}`,
          ficheiro: `/documentos/${encodeURI(normalizedRelativePath)}`,
        };
      });
  } catch (err) {
    console.error("[documents] local fallback error:", err.message);
    return [];
  }
}

module.exports = {
  loadLocalRegulationsFallback,
  normalizeMediaPath,
};
