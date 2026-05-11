let cachedTransporter = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const nodemailer = require("nodemailer");

  if (process.env.SMTP_URL) {
    cachedTransporter = nodemailer.createTransport(process.env.SMTP_URL);
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || "false") === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host)
    throw new Error(
      "O email de apoio ao aluno não está configurado no servidor.",
    );

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user || pass ? { user, pass } : undefined,
  });

  return cachedTransporter;
}

function buildSupportMail({ nome, email, assunto, mensagem }) {
  const to = process.env.SUPPORT_EMAIL_TO;
  const configuredFrom =
    process.env.SUPPORT_EMAIL_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER;

  if (!to)
    throw new Error("Defina SUPPORT_EMAIL_TO no .env para receber os pedidos.");

  if (!configuredFrom)
    throw new Error("Defina SUPPORT_EMAIL_FROM ou SMTP_USER no .env.");

  const safeNome = String(nome || "").trim();
  const safeEmail = String(email || "").trim();
  const safeAssunto = String(assunto || "").trim();
  const safeMensagem = String(mensagem || "").trim();
  const htmlMensagem = escapeHtml(safeMensagem).replace(/\n/g, "<br>");

  const displayName = safeNome || "Apoio ao Aluno";
  const from = safeEmail
    ? `"${escapeHtml(displayName)}" <${safeEmail}>`
    : configuredFrom;

  return {
    to,
    from,
    sender: configuredFrom,
    replyTo: safeEmail,
    subject: `[Apoio ao Aluno] ${safeAssunto}`,
    text: `Novo pedido enviado através do site AEEUM.

Nome: ${safeNome}
Email: ${safeEmail}
Assunto: ${safeAssunto}

Mensagem:
${safeMensagem}
`,
    html: `<p><strong>Novo pedido enviado através do site AEEUM.</strong></p>
<p><strong>Nome:</strong> ${escapeHtml(safeNome)}</p>
<p><strong>Email:</strong> ${escapeHtml(safeEmail)}</p>
<p><strong>Assunto:</strong> ${escapeHtml(safeAssunto)}</p>
<p><strong>Mensagem:</strong></p>
<p>${htmlMensagem}</p>`,
  };
}

const supportController = {
  submitSupportRequest: async function (req, res) {
    try {
      const nome = String(req.body?.nome || "").trim();
      const email = String(req.body?.email || "").trim();
      const assunto = String(req.body?.assunto || "").trim();
      const mensagem = String(req.body?.mensagem || "").trim();

      if (!nome || !email || !assunto || !mensagem) {
        res
          .status(400)
          .json({ message: "Preencha todos os campos do formulário." });
        return;
      }

      const transporter = getTransporter();
      const mailOptions = buildSupportMail({ nome, email, assunto, mensagem });

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        message:
          "Pedido enviado com sucesso. A equipa irá responder-te assim que possível.",
      });
    } catch (error) {
      console.error("[support] email error:", error.message);
      res
        .status(500)
        .json({
          message:
            error.message || "Não foi possível enviar o pedido neste momento.",
        });
    }
  },
};

module.exports = supportController;
