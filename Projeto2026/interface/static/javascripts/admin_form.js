document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("adminEntityForm");
  const submitButton = document.getElementById("submitBtn");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const formConfig = window.ADMIN_FORM_CONFIG || {};
  const fields = Array.isArray(formConfig.fields) ? formConfig.fields : [];

  if (!form) return;

  const createRepeaterRow = (placeholder = "", value = "") => {
    const row = document.createElement("div");
    row.className = "w3-row admin-repeater-item";
    row.style.marginBottom = "8px";
    row.innerHTML = `
      <div class="w3-col s9">
        <input class="w3-input" type="text" data-repeater-item-input placeholder="${placeholder}" value="${value}">
      </div>
      <div class="w3-col s3">
        <button class="w3-button w3-red w3-block" type="button" data-repeater-remove>Remover</button>
      </div>
    `;
    return row;
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const createStructuredInputMarkup = (subfield, value = "") => {
    const safeName = escapeHtml(subfield.name || "");
    const safePlaceholder = escapeHtml(subfield.placeholder || "");
    const safeValue = escapeHtml(value);

    if (subfield.type === "select") {
      const options = Array.isArray(subfield.options) ? subfield.options : [];
      const optionsMarkup = [
        `<option value=""></option>`,
        ...options.map((option) => {
          const optionValue = String(option.value ?? "");
          const selected = optionValue === String(value ?? "") ? ' selected="selected"' : "";
          return `<option value="${escapeHtml(optionValue)}"${selected}>${escapeHtml(option.label ?? optionValue)}</option>`;
        }),
      ].join("");

      return `
        <select class="w3-select" data-structured-input data-subfield-name="${safeName}">
          ${optionsMarkup}
        </select>
      `;
    }

    return `
      <input
        class="w3-input"
        type="${escapeHtml(subfield.type || "text")}"
        value="${safeValue}"
        placeholder="${safePlaceholder}"
        data-structured-input
        data-subfield-name="${safeName}"
      >
    `;
  };

  const createStructuredRow = (config, entry = {}) => {
    const row = document.createElement("div");
    row.className = "admin-structured-list-item";
    row.dataset.structuredItem = "true";

    const fieldsMarkup = (config.fields || [])
      .map((subfield) => {
        const value = entry?.[subfield.name] ?? "";
        return `
          <div class="admin-structured-list-field">
            <label class="w3-label">${escapeHtml(subfield.label || subfield.name || "")}</label>
            ${createStructuredInputMarkup(subfield, value)}
          </div>
        `;
      })
      .join("");

    row.innerHTML = `
      <div class="admin-structured-list-grid">
        ${fieldsMarkup}
      </div>
      <button class="w3-button w3-red w3-margin-top" type="button" data-structured-remove>Remover</button>
    `;

    return row;
  };

  const ensureRepeaterHasRow = (repeater) => {
    const itemsHost = repeater.querySelector(".admin-repeater-items");
    if (!itemsHost || itemsHost.children.length > 0) return;

    itemsHost.appendChild(
      createRepeaterRow(repeater.dataset.placeholder || "", ""),
    );
  };

  document.querySelectorAll(".admin-repeater").forEach((repeater) => {
    const itemsHost = repeater.querySelector(".admin-repeater-items");
    const addButton = repeater.querySelector("[data-repeater-add]");

    if (!itemsHost || !addButton) return;

    itemsHost.addEventListener("click", (event) => {
      const button = event.target.closest("[data-repeater-remove]");
      if (!button) return;

      const row = button.closest(".admin-repeater-item");
      if (row) row.remove();
      ensureRepeaterHasRow(repeater);
    });

    addButton.addEventListener("click", () => {
      itemsHost.appendChild(
        createRepeaterRow(repeater.dataset.placeholder || "", ""),
      );
    });

    ensureRepeaterHasRow(repeater);
  });

  document.querySelectorAll(".admin-structured-list").forEach((list) => {
    const configScript = list.querySelector("[data-structured-config]");
    const itemsHost = list.querySelector(".admin-structured-list-items");
    const addButton = list.querySelector("[data-structured-add]");
    let config = { fields: [], addLabel: "+ Adicionar item" };

    if (!itemsHost || !addButton || !configScript) return;

    try {
      config = JSON.parse(configScript.textContent || "{}");
    } catch (error) {
      config = { fields: [], addLabel: "+ Adicionar item" };
    }

    if (!itemsHost.children.length) {
      itemsHost.appendChild(createStructuredRow(config));
    }

    itemsHost.addEventListener("click", (event) => {
      const button = event.target.closest("[data-structured-remove]");
      if (!button) return;

      const row = button.closest("[data-structured-item]");
      if (row) row.remove();

      if (!itemsHost.children.length) {
        itemsHost.appendChild(createStructuredRow(config));
      }
    });

    addButton.textContent = config.addLabel || "+ Adicionar item";
    addButton.addEventListener("click", () => {
      itemsHost.appendChild(createStructuredRow(config));
    });
  });

  const getFieldValue = (field) => {
    if (field.type === "multiselect") {
      const select = form.querySelector(`[name="${field.name}"]`);
      return select
        ? Array.from(select.selectedOptions).map((option) => option.value)
        : [];
    }

    if (field.type === "repeater") {
      const repeater = form.querySelector(`[data-field-name="${field.name}"]`);
      const itemKey = field.itemKey || "texto";
      if (!repeater) return [];

      return Array.from(
        repeater.querySelectorAll("[data-repeater-item-input]"),
      )
        .map((input) => input.value.trim())
        .filter(Boolean)
        .map((value) => ({ [itemKey]: value }));
    }

    if (field.type === "structured-list") {
      const list = form.querySelector(`[data-field-name="${field.name}"]`);
      if (!list) return [];

      return Array.from(list.querySelectorAll("[data-structured-item]"))
        .map((row) => {
          const entry = {};
          row.querySelectorAll("[data-structured-input]").forEach((input) => {
            const key = input.dataset.subfieldName;
            if (!key) return;
            entry[key] = input.value;
          });
          return entry;
        })
        .filter((entry) => Object.values(entry).some((value) => String(value || "").trim() !== ""));
    }

    if (field.type === "file") return null;

    const input = form.querySelector(`[name="${field.name}"]`);
    return input ? input.value : "";
  };

  const hasSelectedFile = () =>
    fields.some((field) => {
      if (field.type !== "file") return false;
      const input = form.querySelector(`[name="${field.name}"]`);
      return Boolean(input?.files?.length);
    });

  const buildPayload = () => {
    const payload = {};

    fields.forEach((field) => {
      if (field.type === "file") return;
      payload[field.name] = getFieldValue(field);
    });

    return payload;
  };

  const buildFormData = (payload) => {
    const formData = new FormData();

    fields.forEach((field) => {
      const uploadName = field.uploadName || field.name;

      if (field.type === "file") {
        const input = form.querySelector(`[name="${field.name}"]`);
        if (input?.files?.[0]) {
          formData.append(uploadName, input.files[0]);
        }
        return;
      }

      if (field.type === "multiselect") {
        const values = payload[field.name] || [];
        if (!values.length) {
          formData.append(field.name, "");
          return;
        }
        values.forEach((value) => formData.append(field.name, value));
        return;
      }

      if (field.type === "repeater") {
        formData.append(field.name, JSON.stringify(payload[field.name] || []));
        return;
      }

      if (field.type === "structured-list") {
        formData.append(field.name, JSON.stringify(payload[field.name] || []));
        return;
      }

      formData.append(field.name, payload[field.name] ?? "");
    });

    return formData;
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const payload = buildPayload();
    const useFormData = hasSelectedFile();

    submitButton?.setAttribute("disabled", "disabled");
    loadingSpinner?.classList.remove("w3-hide");

    try {
      const requestInit = {
        method: formConfig.method || "POST",
      };

      if (useFormData) {
        requestInit.body = buildFormData(payload);
      } else {
        requestInit.headers = {
          "Content-Type": "application/json",
        };
        requestInit.body = JSON.stringify(payload);
      }

      const response = await fetch(formConfig.action, requestInit);
      if (!response.ok) {
        let errorMessage = "Erro desconhecido";
        let redirectTo = null;

        try {
          const data = await response.json();
          errorMessage = data?.message || errorMessage;
          redirectTo = data?.redirectTo || null;
        } catch (error) {
          // noop
        }

        if (response.status === 401 && redirectTo) {
          window.location.href = redirectTo;
          return;
        }

        throw new Error(errorMessage);
      }

      window.location.href = formConfig.successRedirect || "/admin";
    } catch (error) {
      alert(`Erro ao guardar: ${error.message}`);
      submitButton?.removeAttribute("disabled");
      loadingSpinner?.classList.add("w3-hide");
    }
  });
});
