const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");
const { getPackageConfig, getPackageConfigFromPath } = require("./packageRegistry");

const PACKAGE_MEDIA_TYPE = "application/vnd.aeeum.package+zip";

function resolveMediaRoot() 
{
  const candidates = 
  [
    path.join(__dirname, "..", "media"),
    path.join(__dirname, "..", "..", "media"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
}

function escapeXml(value) 
{
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescapeXml(value) 
{
  return String(value ?? "")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function normalizeDocument(doc) 
{
  if(!doc) 
    return {};
  if(typeof doc.toObject === "function") 
    return doc.toObject({ depopulate: true });

  return { ...doc };
}

function serializeValue(value) 
{
  if(value === undefined || value === null) 
    return "";
  if(value instanceof Date) 
    return value.toISOString();
  if(Array.isArray(value) || typeof value === "object") 
    return JSON.stringify(value);

  return String(value);
}

function extractSchemaFields(config) 
{
  return Object.entries(config.model.schema.paths)
    .filter(([field]) => field !== "__v")
    .map(([field]) => field);
}

function buildXml(config, payload) 
{
  const docs = Array.isArray(payload) ? payload.map(normalizeDocument) : [normalizeDocument(payload)];
  const fields = extractSchemaFields(config);

  if(docs.length === 1) 
  {
    const body = fields
      .map((field) => `  <${field}>${escapeXml(serializeValue(docs[0][field]))}</${field}>`)
      .join("\n");

    return `<${config.tag}>\n${body}\n</${config.tag}>\n`;
  }

  const items = docs
    .map((doc) => 
    {
      const body = fields
        .map((field) => `    <${field}>${escapeXml(serializeValue(doc[field]))}</${field}>`)
        .join("\n");
      return `  <registo>\n${body}\n  </registo>`;
    })
    .join("\n");
  return `<${config.tag}>\n${items}\n</${config.tag}>\n`;
}

function parseXmlFields(xml) 
{
  const rootMatch = String(xml || "").match(/<([A-Za-z0-9_-]+)[^>]*>([\s\S]*)<\/\1>\s*$/);
  if(!rootMatch) 
    throw new Error("XML inválido no pacote.");

  const rootTag = rootMatch[1];
  const body = rootMatch[2];
  const result = {};
  const fieldRegex = /<([A-Za-z0-9_-]+)[^>]*>([\s\S]*?)<\/\1>/g;
  let match;

  while((match = fieldRegex.exec(body))) 
  {
    const key = match[1];
    if(key === "registo") continue;
    const value = unescapeXml(match[2].trim());
    if((value.startsWith("[") && value.endsWith("]")) || (value.startsWith("{") && value.endsWith("}"))) 
      {
        try 
        {
          result[key] = JSON.parse(value);
          continue;
        }catch{
          // mantém string
      }
    }
    result[key] = value;
  }

  return { rootTag, data: result };
}

function safeZipPath(value) 
{
  return String(value || "").replace(/\\/g, "/").replace(/^\/+/, "");
}


async function addReferencedFile(zip, manifest, publicPath) 
{
  const raw = String(publicPath || "").trim();
  if (!raw || /^(https?:)?\/\//i.test(raw)) return;

  const mediaRoot = resolveMediaRoot();
  const relative = raw
    .replace(/^\/media\//, "")
    .replace(/^\/download\//, "");
  const absolute = path.resolve(mediaRoot, relative);
  if(!absolute.startsWith(`${path.resolve(mediaRoot)}${path.sep}`) || !fs.existsSync(absolute)) 
    return;

  const zipPath = safeZipPath(path.posix.join("dados", relative.split(path.sep).join("/")));
  zip.file(zipPath, fs.readFileSync(absolute));
  manifest.add(zipPath);
}

async function createPackageBuffer({ type = "DIP", config, payload }) 
{
  const zip = new JSZip();
  const manifest = new Set(["manifest.txt", "package-info.txt"]);
  const xmlPath = `dados/${config.slug}/${config.tag}.xml`;

  zip.file(xmlPath, buildXml(config, payload));
  manifest.add(xmlPath);

  const docs = Array.isArray(payload) ? payload : [payload];
  for(const doc of docs) 
    {
      const plain = normalizeDocument(doc);
      for(const field of Object.keys(config.media || {})) 
      {
        await addReferencedFile(zip, manifest, plain[field]);
      }
  }

  zip.file("manifest.txt", Array.from(manifest).sort().join("\n") + "\n");
  zip.file("package-info.txt", `tipo=${type}\ndados=${config.tag}\n`);

  return zip.generateAsync
  ({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}

function wantsPackage(req) 
{
  const accept = String(req.headers.accept || "");
  if(accept.includes("application/json")) 
    return false;

  return 
  (
    req.query?.package === "dip" ||
    req.query?.pacote === "dip" ||
    accept.includes(PACKAGE_MEDIA_TYPE) ||
    accept.includes("application/zip") ||
    req.method === "GET"
  );
}

function isZipRequest(req) 
{
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  return contentType.includes("application/zip") || contentType.includes(PACKAGE_MEDIA_TYPE);
}

async function readSipBuffer(buffer) 
{
  const zip = await JSZip.loadAsync(buffer);
  const manifestFile = zip.file("manifest.txt");
  if(!manifestFile) 
    throw new Error("SIP inválido: manifest.txt em falta.");

  const xmlEntry = Object.values(zip.files).find
  (
    (entry) => !entry.dir && /^dados\/.+\.xml$/i.test(entry.name),
  );
  if(!xmlEntry) 
    throw new Error("SIP inválido: XML em dados/ em falta.");

  const xml = await xmlEntry.async("string");
  const parsed = parseXmlFields(xml);
  const config = getPackageConfig(parsed.rootTag);
  if(!config) 
    throw new Error(`Tipo de dados desconhecido no SIP: ${parsed.rootTag}.`);

  const data = { ...parsed.data };
  const mediaRoot = resolveMediaRoot();
  for(const [field, mediaConfig] of Object.entries(config.media || {})) 
  {
    const relative = safeZipPath(data[field]);
    if(!relative || !relative.startsWith("dados/")) 
      continue;
    const file = zip.file(relative);
    if(!file) 
      continue;

    const ext = path.extname(relative);
    const filename = `${Date.now()}-${path.basename(relative).replace(/[^A-Za-z0-9_.-]/g, "") || `ficheiro${ext}`}`;
    const targetDir = path.join(mediaRoot, mediaConfig.folder);
    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(path.join(targetDir, filename), await file.async("nodebuffer"));
    data[field] = `${mediaConfig.publicPrefix}/${filename}`;
  }

  return { config, data };
}

function attachPackageResponseMiddleware(req, res, next) 
{
  const originalJson = res.json.bind(res);

  res.json = function jsonWithDip(payload) 
  {
    const config = getPackageConfigFromPath(req.path);
    const shouldReturnPackage =
      (req.method === "GET" && wantsPackage(req)) ||
      (["POST", "PUT", "PATCH"].includes(req.method) &&
        (req.isAeeumZipPackage || wantsPackage(req)));

    if(!config || !shouldReturnPackage)
      return originalJson(payload);
    
    createPackageBuffer
    ({
      type: req.method === "GET" ? "DIP" : "AIP",
      config,
      payload,
    })
      .then((buffer) => 
      {
        res.setHeader("Content-Type", PACKAGE_MEDIA_TYPE);
        res.setHeader
        (
          "Content-Disposition",
          `attachment; filename="${config.slug}-${req.method === "GET" ? "dip" : "aip"}.zip"`,
        );
        res.send(buffer);
      })
      .catch((error) => 
      {
        console.error("[package] DIP error:", error.message);
        originalJson({ message: error.message });
      });
    return res;
  };

  next();
}

async function parseZipSipRequest(req, res, next) 
{
  if (!["POST", "PUT", "PATCH"].includes(req.method) || !isZipRequest(req)) 
    return next();

  try 
  {
    const { data } = await readSipBuffer(req.body);
    req.isAeeumZipPackage = true;
    req.body = data;
    return next();

  }catch (error){
    return res.status(400).json({ message: error.message });
  }
}

module.exports = 
{
  PACKAGE_MEDIA_TYPE,
  attachPackageResponseMiddleware,
  createPackageBuffer,
  parseZipSipRequest,
  readSipBuffer,
  wantsPackage,
};
