// This script manages the HR policy dashboard, allowing HR administrators to view, edit, and manage company policies. It handles loading policies from local storage or a JSON file, filtering and searching policies, rendering the policy list and editor, and saving changes back to local storage.
document.addEventListener("DOMContentLoaded", async function () {
  try {
    await hrDashboardReady;
  } catch (error) {
    console.error("Could not load the HR dashboard:", error);
    return;
  }

  const storageKey = "workforce.policies.v1";
  const categories = {
    everyday: "HR & Culture",
    culture: "Conduct",
    security: "Security & IT",
    wellbeing: "Benefits"
  };
  const pageSize = 6;
  let policies = [];
  let category = "all";
  let page = 1;
  let editingId = null;

  function get(id) {
    return document.getElementById(id);
  }

  function escape(value) {
    const span = document.createElement("span");
    if (value == null) value = "";
    span.textContent = String(value);
    return span.innerHTML.split('"').join("&quot;").split("'").join("&#39;");
  }

  function formatDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function today() {
    return formatDate(new Date());
  }

  function dateLabel(policy) {
    if (policy.effectiveDate) return policy.effectiveDate;
    if (policy.meta) {
      const parts = policy.meta.split("Effective Date:");
      if (parts.length > 1) return parts[1].split("•")[0].trim();
    }
    return "—";
  }

  function showError(message) {
    get("load-error").textContent = message;
    get("load-error").hidden = message === "";
  }

  function checkPolicies(items) {
    if (!Array.isArray(items)) throw new Error("Invalid policy list.");
    const ids = [];
    for (const policy of items) {
      if (!policy || policy.id == null || typeof policy.title !== "string" ||
          !Array.isArray(policy.clauses)) {
        throw new Error("A policy has missing information.");
      }
      if (ids.includes(String(policy.id))) throw new Error("Duplicate policy ID.");
      ids.push(String(policy.id));
      for (const clause of policy.clauses) {
        if (!clause || typeof clause.title !== "string" || typeof clause.body !== "string") {
          throw new Error("A policy section has missing information.");
        }
      }
    }
  }

  async function loadPolicies() {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      const items = JSON.parse(saved);
      checkPolicies(items);
      policies = items;
      return;
    }
    const response = await fetch("../../data/policies.json");
    if (!response.ok) throw new Error("Could not load the policy file.");
    const items = await response.json();
    checkPolicies(items);
    localStorage.setItem(storageKey, JSON.stringify(items));
    policies = items;
  }

  // Display a message to the user, and hide it if the message is empty.
  function savePolicies(items) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
      policies = items;
      showError("");
      render();
      return true;
    } catch (error) {
      showError("Could not save policies. Check that browser storage is available and try again.");
      return false;
    }
  }

  function filteredPolicies() {
    const search = get("global-search").value + " " + get("search").value;
    const words = search.trim().toLowerCase().split(/\s+/);
    return policies.filter(function (policy) {
      if (category !== "all" && policy.category !== category) return false;
      const text = (policy.title + " " + (policy.description || "") + " " +
        (categories[policy.category] || policy.category)).toLowerCase();
      for (const word of words) {
        if (!text.includes(word)) return false;
      }
      return true;
    });
  }

  
  function renderCategories() {
    get("categories").innerHTML = "";
    const labels = { all: "All Categories" };
    for (const key in categories) labels[key] = categories[key];
    for (const key in labels) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn rounded-pill px-3 py-1 fw-medium border-0";
      button.textContent = labels[key];
      button.setAttribute("aria-pressed", String(category === key));
      button.style.fontSize = "0.9rem";
      button.style.backgroundColor = "#f6f7f4";
      button.style.color = "#6c757d";
      if (category === key) {
        button.style.backgroundColor = "#18554a";
        button.style.color = "#ffffff";
      }
      button.addEventListener("click", function () {
        category = key;
        page = 1;
        render();
      });
      get("categories").appendChild(button);
    }
  }

  // Render the policy list, including the table rows, pagination controls, and summary information. Attach event listeners for editing and toggling visibility of policies.
  function makeRow(policy) {
    const author = policy.author || "HR administrator";
    let initials = "";
    const names = author.trim().split(/\s+/).slice(0, 2);
    for (const name of names) initials += name[0] || "";
    const hidden = policy.hidden === true;
    return `<tr>
        <td class="py-3 border-bottom text-secondary"><div class="d-flex align-items-center gap-3"><div class="d-flex align-items-center justify-content-center rounded-3 fs-5 flex-shrink-0" style="width:40px;height:40px;background-color:#f6f7f4;color:#18554a;"><i class="bi bi-journal-text"></i></div><div><div class="fw-semibold text-dark fs-6">${escape(policy.title)}</div><div style="font-size:0.75rem;">v${escape(policy.version || '1.0')}${policy.updatedAt ? ` • Updated ${escape(policy.updatedAt)}` : ''}</div></div></div></td>
        <td class="py-3 border-bottom text-secondary"><span class="bg-light px-2 py-1 rounded" style="font-size:0.8rem;">${escape(categories[policy.category] || policy.category)}</span></td>
        <td class="py-3 border-bottom text-secondary" style="font-size:0.9rem;">${escape(dateLabel(policy))}</td>
        <td class="py-3 border-bottom"><span class="badge rounded-pill px-3 py-2 fw-medium" style="background-color:${hidden ? '#f6f7f4' : '#eaf0eb'};color:${hidden ? '#6c757d' : '#2b7a63'};">● ${hidden ? 'Hidden' : 'Visible'}</span></td>
        <td class="py-3 border-bottom"><div class="d-flex align-items-center gap-2"><span class="rounded-circle d-flex align-items-center justify-content-center fw-semibold flex-shrink-0" style="width:32px;height:32px;background-color:#f6f7f4;color:#6c757d;font-size:0.75rem;">${escape(initials)}</span><span style="font-size:0.85rem;">${escape(author)}</span></div></td>
        <td class="py-3 border-bottom text-end"><div class="d-flex justify-content-end gap-2"><button type="button" class="btn btn-sm text-secondary" data-action="visibility" data-id="${escape(policy.id)}" title="${hidden ? 'Show' : 'Hide'} policy" aria-label="${hidden ? 'Show' : 'Hide'} ${escape(policy.title)}"><i class="bi bi-eye${hidden ? '-slash' : ''}"></i></button><button type="button" class="btn btn-sm text-secondary" data-action="edit" data-id="${escape(policy.id)}" title="Edit policy" aria-label="Edit ${escape(policy.title)}"><i class="bi bi-pencil"></i></button></div></td>
      </tr>`;
  }

  function render() {
    const filtered = filteredPolicies();
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
    page = Math.min(page, pages);
    const start = (page - 1) * pageSize;
    const pagePolicies = filtered.slice(start, start + pageSize);
    renderCategories();
    get("rows").innerHTML = pagePolicies.map(makeRow).join("");
    if (pagePolicies.length === 0) {
      get("rows").innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">No policies match your search.</td></tr>';
    }
    get("rows").querySelectorAll("[data-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        const policy = policies.find(function (item) {
          return String(item.id) === button.dataset.id;
        });
        if (!policy) return;
        if (button.dataset.action === "edit") {
          openEditor(policy);
        } else {
          // Copy before saving so a failed save keeps the previous data.
          const items = JSON.parse(JSON.stringify(policies));
          for (const item of items) {
            if (item.id === policy.id) {
              item.hidden = !item.hidden;
              item.updatedAt = today();
            }
          }
          savePolicies(items);
        }
      });
    });
    const hiddenCount = policies.filter(function (policy) { return policy.hidden === true; }).length;
    let first = start + 1;
    if (filtered.length === 0) first = 0;
    get("summary").textContent = "Showing " + first + "–" + Math.min(start + pageSize, filtered.length) +
      " of " + filtered.length + " policies (" + hiddenCount + " hidden)";
    get("pagination").innerHTML = '<button class="btn btn-sm text-secondary">Previous</button><span class="rounded px-2 py-1 bg-dark text-white"></span><button class="btn btn-sm text-secondary">Next</button>';
    const buttons = get("pagination").querySelectorAll("button");
    buttons[0].disabled = page === 1;
    buttons[1].disabled = page === pages;
    buttons[0].onclick = function () { page--; render(); };
    buttons[1].onclick = function () { page++; render(); };
    get("pagination").querySelector("span").textContent = page + " / " + pages;
    let lastUpdate = "";
    for (const policy of policies) {
      if (policy.updatedAt && policy.updatedAt > lastUpdate) lastUpdate = policy.updatedAt;
    }
    get("updated").textContent = "Policy library";
    if (lastUpdate) get("updated").textContent = "Updated " + lastUpdate;
  }

  let categoryOptions = "";
  for (const key in categories) {
    categoryOptions += '<option value="' + key + '">' + categories[key] + '</option>';
  }
  const dialog = document.createElement('dialog');
  dialog.className = 'border rounded-4 p-4 shadow';
  dialog.style.cssText = 'width: min(680px, 94vw); max-height: 90vh; color: #212529;';
  dialog.setAttribute('aria-labelledby', 'editor-title');
  dialog.innerHTML = `<form id="policy-form">
    <div class="d-flex justify-content-between align-items-center mb-4"><h2 id="editor-title" class="h4 fw-bold mb-0">Add New Policy</h2><button type="button" id="editor-close" class="btn-close" aria-label="Close editor"></button></div>
    <div id="editor-error" class="alert alert-danger" role="alert" hidden></div>
    <label class="form-label" for="policy-title">Policy title</label><input id="policy-title" class="form-control mb-3" required maxlength="200">
    <div class="row"><div class="col-sm-6"><label class="form-label" for="policy-category">Category</label><select id="policy-category" class="form-select mb-3">${categoryOptions}</select></div><div class="col-sm-6"><label class="form-label" for="policy-date">Effective date</label><input id="policy-date" type="date" class="form-control mb-3" required></div></div>
    <div class="row"><div class="col-sm-6"><label class="form-label" for="policy-version">Version</label><input id="policy-version" class="form-control mb-3" required maxlength="30"></div><div class="col-sm-6"><label class="form-label" for="policy-author">Author</label><input id="policy-author" class="form-control mb-3" required maxlength="100"></div></div>
    <label class="form-label" for="policy-description">Description</label><textarea id="policy-description" class="form-control mb-3" rows="2"></textarea>
    <div class="d-flex justify-content-between align-items-center mb-2"><label class="form-label mb-0">Policy sections</label><button id="add-clause" type="button" class="btn btn-sm btn-light">+ Add section</button></div><div id="policy-clauses"></div>
    <div class="form-check my-3"><input id="policy-hidden" type="checkbox" class="form-check-input"><label class="form-check-label" for="policy-hidden">Hide this policy</label></div>
    <div class="d-flex justify-content-end gap-2 mt-4"><button type="button" id="editor-cancel" class="btn rounded-pill border px-4">Cancel</button><button type="submit" class="btn rounded-pill px-4 fw-semibold" style="background-color:#fbd36b;">Save Policy</button></div>
  </form>`;
  document.body.appendChild(dialog);

  // Add a new policy section to the editor, with fields for the section title and content, and a button to remove the section.
  function addClause(clause) {
    if (!clause) clause = { title: "", body: "" };
    const section = document.createElement("fieldset");
    section.className = "border rounded-3 p-3 mb-3";
    section.innerHTML = `<legend class="float-none w-auto fs-6 px-1">Section</legend><label class="d-block mb-2">Section title<input class="form-control clause-title mt-1" required value="${escape(clause.title)}"></label><label class="d-block mb-2">Content<textarea class="form-control clause-body mt-1" rows="3" required>${escape(clause.body)}</textarea></label><button type="button" class="btn btn-sm text-secondary remove-clause">Remove section</button>`;
    section.querySelector(".remove-clause").addEventListener("click", function () {
      section.remove();
    });
    get("policy-clauses").appendChild(section);
  }


  // Open the policy editor dialog, pre-filling the fields with the selected policy's data if editing an existing policy, or leaving them blank for a new policy.
  function openEditor(policy) {
    editingId = null;
    get("policy-form").reset();
    get("editor-title").textContent = "Add New Policy";
    get("editor-error").hidden = true;
    get("policy-date").value = today();
    get("policy-version").value = "1.0";
    get("policy-author").value = "HR administrator";
    get("policy-clauses").innerHTML = "";
    if (policy) {
      editingId = policy.id;
      get("editor-title").textContent = "Edit Policy";
      get("policy-title").value = policy.title;
      get("policy-category").value = policy.category || "everyday";
      const date = new Date(dateLabel(policy));
      if (policy.effectiveDate) get("policy-date").value = policy.effectiveDate;
      else if (!Number.isNaN(date.getTime())) get("policy-date").value = formatDate(date);
      get("policy-version").value = policy.version || "1.0";
      get("policy-author").value = policy.author || "HR administrator";
      get("policy-description").value = policy.description || "";
      get("policy-hidden").checked = policy.hidden === true;
      policy.clauses.forEach(addClause);
    }
    if (get("policy-clauses").children.length === 0) addClause();
    dialog.showModal();
  }

  function saveEditor(event) {
    event.preventDefault();
    if (!get("policy-form").reportValidity()) return;
    const clauses = [];
    for (const section of get("policy-clauses").children) {
      clauses.push({
        title: section.querySelector(".clause-title").value.trim(),
        body: section.querySelector(".clause-body").value.trim()
      });
    }
    const title = get("policy-title").value.trim();
    const version = get("policy-version").value.trim();
    const author = get("policy-author").value.trim();
    const incomplete = clauses.some(function (clause) { return !clause.title || !clause.body; });
    if (!title || !version || !author || clauses.length === 0 || incomplete) {
      get("editor-error").textContent = "Enter a title, version, author, and at least one complete section.";
      get("editor-error").hidden = false;
      return;
    }
    const original = policies.find(function (policy) { return policy.id === editingId; });
    let item = {};
    if (original) {
      // Retain existing fields that are not edited by this form.
      item = JSON.parse(JSON.stringify(original));
    } else {
      let largestId = 0;
      for (const policy of policies) largestId = Math.max(largestId, Number(policy.id) || 0);
      item.id = largestId + 1;
    }
    // Update the policy fields with the values from the editor form.
    item.title = title;
    item.shortTitle = title;
    item.category = get("policy-category").value;
    item.effectiveDate = get("policy-date").value;
    item.version = version;
    item.author = author;
    item.description = get("policy-description").value.trim();
    item.clauses = clauses;
    item.hidden = get("policy-hidden").checked;
    item.updatedAt = today();
    item.code = item.code || "POL-" + new Date().getFullYear() + "-" + item.id;
    item.fileName = item.fileName || "Policy_" + item.id + ".pdf";
    if (item.isNew == null) item.isNew = true;
    let appliesTo = "Applies to: All Employees";
    if (item.meta) appliesTo = item.meta.split("•").slice(1).join("•").trim() || appliesTo;
    item.meta = "Effective Date: " + item.effectiveDate + " • " + appliesTo;
    const items = policies.slice();
    if (original) {
      const index = policies.indexOf(original);
      items[index] = item;
    } else {
      items.push(item);
    }
    if (savePolicies(items)) {
      dialog.close();
    } else {
      get("editor-error").textContent = get("load-error").textContent;
      get("editor-error").hidden = false;
    }
  }

  
  get("editor-close").onclick = function () { dialog.close(); };
  get("editor-cancel").onclick = function () { dialog.close(); };
  get("add-clause").onclick = function () { addClause(); };
  get("policy-form").addEventListener("submit", saveEditor);
  get("add").disabled = true;
  get("add").onclick = function () { openEditor(); };
  get("rows").innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">Loading policies…</td></tr>';
  get("pagination").innerHTML = "";
  
  try {
    await loadPolicies();
    get("add").disabled = false;
    function searchChanged() { page = 1; render(); }
    get("search").addEventListener("input", searchChanged);
    get("global-search").addEventListener("input", searchChanged);
    render();
  } catch (error) {
    get("rows").innerHTML = '<tr><td colspan="6" class="text-center text-secondary py-5">Policies unavailable</td></tr>';
    get("summary").textContent = "Policies unavailable";
    showError("Could not load policies: " + error.message + " Open the project through its web server and refresh.");
  }
});
