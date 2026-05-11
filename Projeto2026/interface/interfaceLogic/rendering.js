"use strict";

function renderApiUnavailable(res, err) {
  console.error("[render] API error:", err.message);
  res.status(502).render("error", {
    message: "API indisponível",
    error: { status: 502, stack: err.stack },
  });
}

module.exports = {
  renderApiUnavailable,
};
