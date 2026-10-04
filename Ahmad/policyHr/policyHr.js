"use strict";

const storageKey = "workforce.policies.v1";
const jsonFile = new URL("../../data/policies.json", document.currentScript.src);
const categoryNames = {
  everyday: "HR & Culture",
  culture: "Conduct",
  security: "Security & IT",
  wellbeing: "Benefits"
};
const pageSize = 6;
let policies = [];
let currentCategory = "all";
let currentPage = 1;
let editingId = null;

function get(id) {
  return document.getElementById(id);
}

function escapeText(value) {
  return String(value || "").replace(/[&<>"]/g, function (character) {
    const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" };
    return replacements[character];
  }).replace(/'/g, "&#39;");
}

function showError(message) {
  get("load-error").textContent = message;
  get("load-error").hidden = message === "";
}

function validPolicyList(list) {
  if (!Array.isArray(list)) return false;
  for (let i = 0; i < list.length; i++) {
    if (!list[i] || !list[i].title || !Array.isArray(list[i].clauses)) return false;
  }
  return true;
}

function savePolicies(newPolicies) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(newPolicies));
    policies = newPolicies;
    showError("");
    render();
    return true;
  } catch (error) {
    showError("Could not save the policies in this browser. Check local storage and try again.");
    return false;
  }
}

function getEffectiveDate(policy) {
  if (policy.effectiveDate) return policy.effectiveDate;
  const match = (policy.meta || "").match(/Effective Date:\s*([^•]+)/);
  return match ? match[1].trim() : "—";
}

function toDateInput(value) {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return isoDate[0];
  const dateParts = value.match(/^([A-Za-z]+) (\d{1,2}),? (\d{4})$/);
  if (dateParts) {
    const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
    const month = months[dateParts[1].slice(0, 3)];
    if (month) return dateParts[3] + "-" + month + "-" + dateParts[2].padStart(2, "0");
  }
  const today = new Date();
  return today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
}

function render() {
  const topSearch = document.getElementById("global-search");
  const topSearchText = topSearch ? topSearch.value : "";
  const query = (topSearchText + " " + get("search").value).trim().toLowerCase();
  const words = query.split(/\s+/).filter(Boolean);
  const visiblePolicies = policies.filter(function (policy) {
    const categoryMatches = currentCategory === "all" || policy.category === currentCategory;
    const text = (policy.title + " " + (policy.description || "") + " " +
      (categoryNames[policy.category] || policy.category)).toLowerCase();
    return categoryMatches && words.every(function (word) { return text.includes(word); });
  });

  const pages = Math.max(1, Math.ceil(visiblePolicies.length / pageSize));
  if (currentPage > pages) currentPage = pages;
  const firstIndex = (currentPage - 1) * pageSize;
  const pagePolicies = visiblePolicies.slice(firstIndex, firstIndex + pageSize);

  renderCategories();
  renderRows(pagePolicies);
  renderPagination(visiblePolicies.length, pages, firstIndex);
  get("summary").textContent = "Showing " + (visiblePolicies.length ? firstIndex + 1 : 0) +
    "–" + Math.min(firstIndex + pageSize, visiblePolicies.length) +
    " of " + visiblePolicies.length + " policies";
  const dates = policies.map(function (policy) { return policy.updatedAt || ""; }).filter(Boolean);
  dates.sort();
  get("updated").textContent = dates.length ? "Updated " + dates[dates.length - 1] : "Policy library";
}

function renderCategories() {
  let html = "";
  const allCategories = { all: "All Categories" };
  Object.keys(categoryNames).forEach(function (key) { allCategories[key] = categoryNames[key]; });
  Object.keys(allCategories).forEach(function (key) {
    html += "<button type=\"button\" data-category=\"" + key + "\" class=\"btn rounded-pill px-3 py-1 " +
      (key === currentCategory ? "text-white " : "text-secondary ") + "border-0\" style=\"background-color:" +
      (key === currentCategory ? "#18554a" : "#f6f7f4") + ";\">" +
      allCategories[key] + "</button>";
  });
  get("categories").innerHTML = html;
}

function renderRows(pagePolicies) {
  let html = "";
  pagePolicies.forEach(function (policy) {
    const author = policy.author || "HR administrator";
    const isHidden = policy.hidden === true;
    html += "<tr><td class=\"py-3 border-bottom text-secondary\"><div class=\"fw-semibold text-dark fs-6\">" +
      escapeText(policy.title) + "</div><div style=\"font-size:0.75rem\">v" + escapeText(policy.version || "1.0") +
      (policy.updatedAt ? " · Updated " + escapeText(policy.updatedAt) : "") + "</div></td>" +
      "<td class=\"py-3 border-bottom\"><span class=\"bg-light px-2 py-1 rounded\">" + escapeText(categoryNames[policy.category] || policy.category) + "</span></td>" +
      "<td class=\"py-3 border-bottom\">" + escapeText(getEffectiveDate(policy)) + "</td>" +
      "<td class=\"py-3 border-bottom\"><span class=\"badge rounded-pill px-3 py-2\" style=\"background-color:" +
      (isHidden ? "#f6f7f4;color:#6c757d" : "#eaf0eb;color:#2b7a63") + "\">" + (isHidden ? "Hidden" : "Visible") + "</span></td>" +
      "<td class=\"py-3 border-bottom\">" + escapeText(author) + "</td>" +
      "<td class=\"py-3 border-bottom text-end\"><button class=\"btn btn-sm policy-action\" type=\"button\" data-action=\"visibility\" data-id=\"" +
      escapeText(policy.id) + "\">" + (isHidden ? "Show" : "Hide") + "</button> " +
      "<button class=\"btn btn-sm policy-action\" type=\"button\" data-action=\"edit\" data-id=\"" + escapeText(policy.id) + "\">Edit</button></td></tr>";
  });
  if (pagePolicies.length === 0) html = "<tr><td colspan=\"6\" class=\"text-center py-5\">No policies match your search.</td></tr>";
  get("rows").innerHTML = html;
}

function renderPagination(total, pages, firstIndex) {
  const previousDisabled = currentPage === 1 ? "disabled" : "";
  const nextDisabled = currentPage === pages ? "disabled" : "";
  get("pagination").innerHTML =
    "<button type=\"button\" class=\"btn btn-sm text-secondary\" data-page=\"" + (currentPage - 1) + "\" " + previousDisabled + ">Previous</button> " +
    "<span class=\"rounded px-2 py-1 bg-dark text-white\">" + currentPage + " / " + pages + "</span> " +
    "<button type=\"button\" class=\"btn btn-sm text-secondary\" data-page=\"" + (currentPage + 1) + "\" " + nextDisabled + ">Next</button>";
}

const dialog = document.createElement("dialog");
dialog.className = "border rounded-4 p-4 shadow";
dialog.style.cssText = "width:min(680px,94vw);max-height:90vh;color:#212529;";
dialog.innerHTML =
  "<form id=\"policy-form\">" +
  "<div class=\"d-flex justify-content-between align-items-center mb-4\"><h2 id=\"editor-title\">Add New Policy</h2>" +
  "<button type=\"button\" id=\"editor-close\">Close</button></div>" +
  "<div id=\"editor-error\" class=\"alert alert-danger\" role=\"alert\" hidden></div>" +
  "<label for=\"policy-title\">Policy title</label><input id=\"policy-title\" class=\"form-control mb-3\" required maxlength=\"200\">" +
  "<label for=\"policy-category\">Category</label><select id=\"policy-category\" class=\"form-select mb-3\">" +
  "<option value=\"everyday\">HR &amp; Culture</option><option value=\"culture\">Conduct</option>" +
  "<option value=\"security\">Security &amp; IT</option><option value=\"wellbeing\">Benefits</option></select>" +
  "<label for=\"policy-date\">Effective date</label><input id=\"policy-date\" type=\"date\" class=\"form-control mb-3\" required>" +
  "<label for=\"policy-version\">Version</label><input id=\"policy-version\" class=\"form-control mb-3\" required maxlength=\"30\">" +
  "<label for=\"policy-author\">Author</label><input id=\"policy-author\" class=\"form-control mb-3\" required maxlength=\"100\">" +
  "<label for=\"policy-description\">Description</label><textarea id=\"policy-description\" class=\"form-control mb-3\" rows=\"2\"></textarea>" +
  "<div class=\"d-flex justify-content-between\"><strong>Policy sections</strong><button type=\"button\" id=\"add-clause\">Add section</button></div>" +
  "<div id=\"policy-clauses\"></div><label><input id=\"policy-hidden\" type=\"checkbox\"> Hide this policy</label>" +
  "<div class=\"d-flex justify-content-end gap-2 mt-4\"><button type=\"button\" id=\"editor-cancel\">Cancel</button>" +
  "<button type=\"submit\">Save Policy</button></div></form>";
document.body.append(dialog);

function addClause(clause) {
  const section = document.createElement("fieldset");
  section.className = "border rounded-3 p-3 mb-3";
  const title = clause ? escapeText(clause.title) : "";
  const body = clause ? escapeText(clause.body) : "";
  section.innerHTML = "<legend>Section</legend><label>Section title<input class=\"clause-title form-control\" required maxlength=\"150\" value=\"" +
    title + "\"></label><label>Content<textarea class=\"clause-body form-control\" required rows=\"3\">" +
    body + "</textarea></label><button type=\"button\" class=\"remove-clause\">Remove section</button>";
  get("policy-clauses").appendChild(section);
}

function openEditor(policy) {
  editingId = policy ? policy.id : null;
  get("editor-title").textContent = policy ? "Edit Policy" : "Add New Policy";
  get("editor-error").hidden = true;
  get("policy-title").value = policy ? policy.title : "";
  get("policy-category").value = policy ? policy.category : "everyday";
  get("policy-date").value = policy ? toDateInput(getEffectiveDate(policy)) : new Date().toISOString().slice(0, 10);
  get("policy-version").value = policy ? policy.version || "1.0" : "1.0";
  get("policy-author").value = policy ? policy.author || "HR administrator" : "HR administrator";
  get("policy-description").value = policy ? policy.description || "" : "";
  get("policy-hidden").checked = policy ? policy.hidden === true : false;
  get("policy-clauses").innerHTML = "";
  if (policy && policy.clauses.length) {
    policy.clauses.forEach(addClause);
  } else {
    addClause();
  }
  dialog.showModal();
}

function loadPolicies() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      policies = JSON.parse(saved);
      if (!validPolicyList(policies)) throw new Error("The saved policy list is not valid.");
      get("add").disabled = false;
      render();
      return;
    }
    fetch(jsonFile).then(function (response) {
      if (!response.ok) throw new Error("Could not load the JSON file.");
      return response.json();
    }).then(function (items) {
      if (!validPolicyList(items)) throw new Error("The policy JSON data is not valid.");
      policies = items;
      localStorage.setItem(storageKey, JSON.stringify(items));
      get("add").disabled = false;
      render();
    }).catch(function (error) {
      get("rows").innerHTML = "<tr><td colspan=\"6\">Policies unavailable</td></tr>";
      get("summary").textContent = "Could not load policies: " + error.message;
      showError("Open this page through the project web server, then refresh.");
    });
  } catch (error) {
    showError("Could not read saved policies: " + error.message);
  }
}

["editor-close", "editor-cancel"].forEach(function (id) {
  get(id).addEventListener("click", function () { dialog.close(); });
});
get("add-clause").addEventListener("click", function () { addClause(); });
get("policy-clauses").addEventListener("click", function (event) {
  if (event.target.classList.contains("remove-clause")) event.target.parentElement.remove();
});
get("policy-form").addEventListener("submit", function (event) {
  event.preventDefault();
  const sections = get("policy-clauses").children;
  const clauses = [];
  for (let i = 0; i < sections.length; i++) {
    const title = sections[i].querySelector(".clause-title").value.trim();
    const body = sections[i].querySelector(".clause-body").value.trim();
    if (!title || !body) {
      get("editor-error").textContent = "Complete each policy section first.";
      get("editor-error").hidden = false;
      return;
    }
    clauses.push({ title: title, body: body });
  }
  if (!get("policy-form").reportValidity() || clauses.length === 0) {
    get("editor-error").textContent = "Fill out the required fields and add a policy section.";
    get("editor-error").hidden = false;
    return;
  }
  const oldPolicy = policies.find(function (policy) { return policy.id === editingId; });
  let newId = 1;
  policies.forEach(function (policy) { if (Number(policy.id) >= newId) newId = Number(policy.id) + 1; });
  if (oldPolicy) newId = oldPolicy.id;
  const date = get("policy-date").value;
  const policy = {
    id: newId,
    title: get("policy-title").value.trim(),
    shortTitle: get("policy-title").value.trim(),
    category: get("policy-category").value,
    effectiveDate: date,
    version: get("policy-version").value.trim(),
    author: get("policy-author").value.trim(),
    description: get("policy-description").value.trim(),
    clauses: clauses,
    hidden: get("policy-hidden").checked,
    updatedAt: new Date().toISOString().slice(0, 10),
    code: oldPolicy ? oldPolicy.code : "POL-" + new Date().getFullYear() + "-" + newId,
    fileName: oldPolicy ? oldPolicy.fileName : "Policy_" + newId + ".pdf",
    meta: "Effective Date: " + date + " • Applies to: All Employees",
    isNew: oldPolicy ? oldPolicy.isNew : true
  };
  let updated;
  if (oldPolicy) {
    updated = policies.map(function (item) { return item.id === editingId ? policy : item; });
  } else {
    updated = policies.concat(policy);
  }
  if (savePolicies(updated)) dialog.close();
});

get("add").disabled = true;
get("add").addEventListener("click", function () { openEditor(null); });
get("rows").addEventListener("click", function (event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const policy = policies.find(function (item) { return String(item.id) === button.dataset.id; });
  if (!policy) return;
  if (button.dataset.action === "edit") {
    openEditor(policy);
  } else {
    const updated = policies.map(function (item) {
      if (item.id === policy.id) {
        item.hidden = !item.hidden;
        item.updatedAt = new Date().toISOString().slice(0, 10);
      }
      return item;
    });
    savePolicies(updated);
  }
});
get("search").addEventListener("input", function () { currentPage = 1; render(); });
get("categories").addEventListener("click", function (event) {
  const button = event.target.closest("[data-category]");
  if (button) { currentCategory = button.dataset.category; currentPage = 1; render(); }
});
get("pagination").addEventListener("click", function (event) {
  const button = event.target.closest("[data-page]");
  if (button && !button.disabled) { currentPage = Number(button.dataset.page); render(); }
});
get("rows").innerHTML = "<tr><td colspan=\"6\">Loading policies…</td></tr>";
loadPolicies();
