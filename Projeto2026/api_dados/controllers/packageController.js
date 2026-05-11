const {
  createPackageBuffer,
  PACKAGE_MEDIA_TYPE,
  readSipBuffer,
} = require("../transport/bagitPackages");
const { getPackageConfig } = require("../transport/packageRegistry");

async function exportPackage(req, res) {
  try {
    const config = getPackageConfig(req.params.slug);
    if (!config) {
      return res
        .status(404)
        .json({ message: "Tipo de dados desconhecido." });
    }

    const payload = req.params._id
      ? await config.model.findById(req.params._id)
      : config.singleton
        ? await config.model.findOne()
        : await config.model.find();

    if (!payload) {
      return res.status(404).json({ message: "Registo não encontrado." });
    }

    const buffer = await createPackageBuffer({ type: "SIP", config, payload });
    res.setHeader("Content-Type", PACKAGE_MEDIA_TYPE);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${config.slug}-sip.zip"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function importPackage(req, res) {
  try {
    const sourceBuffer = req.file?.buffer || req.body;
    if (!sourceBuffer?.length) {
      return res.status(400).json({ message: "Ficheiro SIP em falta." });
    }

    const { config, data } = await readSipBuffer(sourceBuffer);
    const expected = req.params.slug ? getPackageConfig(req.params.slug) : null;
    if (expected && expected.slug !== config.slug) {
      return res.status(400).json({
        message: "O tipo do SIP não corresponde à secção escolhida.",
      });
    }

    if (data.id && !data._id) {
      data._id = data.id;
      delete data.id;
    }

    const existing = data._id ? await config.model.findById(data._id) : null;
    const updateData = { ...data };
    delete updateData._id;

    const saved = config.singleton
      ? await config.model.findOneAndUpdate(
          {},
          data,
          { new: true, upsert: true, runValidators: true },
        )
      : existing
        ? await config.model.findByIdAndUpdate(
            existing._id,
            updateData,
            { new: true, runValidators: true },
          )
        : await new config.model(data).save();

    const buffer = await createPackageBuffer({
      type: "AIP",
      config,
      payload: saved,
    });
    res.status(existing ? 200 : 201);
    res.setHeader("Content-Type", PACKAGE_MEDIA_TYPE);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${config.slug}-aip.zip"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

module.exports = {
  exportPackage,
  importPackage,
};
