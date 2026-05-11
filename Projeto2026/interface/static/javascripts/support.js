/*
 * support.js
 * Feature: Support form — handles submission and shows inline feedback.
 * Depends on: shared.js (supportForm, feedback)
 */
// -----------------------------------------------------------------------------
// Feature: Support Form
// -----------------------------------------------------------------------------
function setupSupportFeature() {
  if (!supportForm || !feedback) return;
  const submitButton = supportForm.querySelector('button[type="submit"]');

  supportForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(supportForm);
    const payload = {
      nome: String(formData.get("nome") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      assunto: String(formData.get("assunto") || "").trim(),
      mensagem: String(formData.get("mensagem") || "").trim(),
    };

    feedback.dataset.state = "loading";
    feedback.textContent = "A enviar o teu pedido...";
    submitButton?.setAttribute("disabled", "disabled");

    try {
      const response = await fetch("/api/apoio-aluno", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || "Não foi possível enviar o pedido.");
      }

      feedback.dataset.state = "success";
      feedback.textContent =
        data?.message || "Pedido enviado com sucesso. Vamos responder-te assim que possível.";
      supportForm.reset();
    } catch (error) {
      feedback.dataset.state = "error";
      feedback.textContent = error.message || "Não foi possível enviar o pedido.";
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });
}
