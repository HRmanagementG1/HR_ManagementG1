"use strict";

const root = document.getElementById("employee-policies");
const storageKey = "workforce.policies.v1";
const jsonFile = new URL("../../data/policies.json", document.currentScript.src);
const categoryNames = {
  all: "All policies",
  new: "New policies",
  everyday: "Everyday work",
  wellbeing: "Wellbeing & Leave",
  security: "Security & Data",
  culture: "Culture & Conduct"
};
let policies = [];
let selectedId = null;
let selectedCategory = "all";

function get(id) {
  return root.querySelector("#" + id);
}

function escapeText(value) {
  return String(value || "").replace(/[&<>"]/g, function (character) {
    const replacements = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" };
    return replacements[character];
  }).replace(/'/g, "&#39;");
}

function validPolicies(items) {
  if (!Array.isArray(items)) return false;
  for (let i = 0; i < items.length; i++) {
    if (!items[i] || !items[i].title || !Array.isArray(items[i].clauses)) return false;
    for (let clause = 0; clause < items[i].clauses.length; clause++) {
      if (!items[i].clauses[clause].title || !items[i].clauses[clause].body) return false;
    }
  }
  return true;
}

function getDate(policy) {
  if (policy.updatedAt) return policy.updatedAt.slice(0, 10);
  if (policy.effectiveDate) return policy.effectiveDate.slice(0, 10);
  const metaMatch = (policy.meta || "").match(/Effective Date: ([^•]+)/);
  if (!metaMatch) return "";
  const dateMatch = metaMatch[1].trim().match(/^([A-Za-z]+) (\d{1,2}),? (\d{4})$/);
  if (!dateMatch) return "";
  const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
  const month = months[dateMatch[1].slice(0, 3)];
  return month ? dateMatch[3] + "-" + month + "-" + dateMatch[2].padStart(2, "0") : "";
}

async function loadPolicies() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      policies = JSON.parse(saved);
    } else {
      const response = await fetch(jsonFile);
      if (!response.ok) throw new Error("Could not load the policy JSON file.");
      policies = await response.json();
      localStorage.setItem(storageKey, JSON.stringify(policies));
    }
    if (!validPolicies(policies)) throw new Error("The saved policy data is invalid.");
    policies = policies.filter(function (policy) { return policy.hidden !== true; });
    if (policies.length > 0) selectedId = policies[0].id;
    render();
  } catch (error) {
    console.error(error);
    get("total-count").textContent = "—";
    get("results-count").textContent = "Policies unavailable";
    get("empty-state").hidden = false;
    get("empty-state").innerHTML = "<h2>Policies could not be loaded</h2><p>Please refresh the page to try again.</p>";
    get("reader").hidden = true;
  }
}

function getVisiblePolicies() {
  const search = get("policy-search").value.trim().toLowerCase();
  return policies.filter(function (policy) {
    let categoryMatches = selectedCategory === "all";
    if (selectedCategory === "new") categoryMatches = policy.isNew === true;
    if (selectedCategory !== "all" && selectedCategory !== "new") {
      categoryMatches = policy.category === selectedCategory;
    }
    const clauseText = policy.clauses.map(function (clause) {
      return clause.title + " " + clause.body;
    }).join(" ");
    const text = [
      policy.title,
      policy.description,
      categoryNames[policy.category],
      clauseText
    ].join(" ").toLowerCase();
    return categoryMatches && text.includes(search);
  });
}

function renderFilters() {
  let html = "";
  Object.keys(categoryNames).forEach(function (key) {
    let count = policies.filter(function (policy) {
      return key === "all" ||
        (key === "new" ? policy.isNew : policy.category === key);
    }).length;
    html += "<button type=\"button\" class=\"btn filter-pill\" data-category=\"" +
      key + "\">" + categoryNames[key] + " (" + count + ")</button>";
  });
  get("filters").innerHTML = html;
  get("total-count").textContent = policies.length;
  get("new-count").textContent = policies.filter(function (policy) {
    return policy.isNew;
  }).length;

  const dates = policies.map(getDate).filter(Boolean);
  dates.sort(function (a, b) { return b.localeCompare(a); });
  if (dates.length) {
    const parts = dates[0].split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    get("latest-update").textContent = "Updated " + monthNames[Number(parts[1]) - 1] + " " + Number(parts[2]) + ", " + parts[0];
  } else {
    get("latest-update").textContent = "No update date available";
  }
}

function renderList(visible) {
  let html = "";
  visible.forEach(function (policy) {
    const category = categoryNames[policy.category] || policy.category || "";
    const date = policy.updatedAt || "Sep 2026";
    const isSelected = String(policy.id) === String(selectedId);
    html += "<article class=\"policy-card" + (isSelected ? " selected" : "") + "\">" +
      "<button type=\"button\" class=\"card-content\" data-select=\"" + escapeText(policy.id) + "\">" +
      "<div class=\"d-flex align-items-start gap-3 justify-content-between\"><div>" +
      "<div class=\"d-flex flex-wrap align-items-center gap-2\"><span class=\"category-tag " + escapeText(policy.category) + "\">" + escapeText(category) +
      "</span><small>Updated " + escapeText(date) + "</small>" +
      (policy.isNew ? "<span class=\"new-tag\">New</span>" : "") + "</div>" +
      "<h3>" + escapeText(policy.shortTitle || policy.title) + "</h3><p>" + escapeText(policy.description) + "</p>" +
      "</div>" + (isSelected ? "<span class=\"selection-check\">✓</span>" : "") + "</div></button>" +
      "<div class=\"card-actions\"><small>PDF · v" + escapeText(policy.version || "1.0") + "</small>" +
      "<div><button type=\"button\" data-select=\"" + escapeText(policy.id) + "\" data-reader>View in reader</button> " +
      "<button type=\"button\" data-download=\"" + escapeText(policy.id) + "\">↓ PDF</button></div></div></article>";
  });
  get("policy-list").innerHTML = html;
  get("empty-state").hidden = visible.length > 0;
  get("reader").hidden = visible.length === 0;
  get("results-count").textContent = "Showing " + visible.length +
    (visible.length === 1 ? " policy" : " policies");
  get("download-selected").disabled = visible.length === 0;
  get("print-policy").disabled = visible.length === 0;
  get("filters").querySelectorAll("[data-category]").forEach(function (button) {
    button.classList.toggle("active", button.dataset.category === selectedCategory);
    button.setAttribute("aria-pressed", button.dataset.category === selectedCategory);
  });
  if (visible.length > 0) renderReader();
}

function renderReader() {
  const policy = policies.find(function (item) {
    return String(item.id) === String(selectedId);
  });
  if (!policy) return;
  get("doc-code").textContent = policy.code || "Company policy";
  get("doc-title").textContent = policy.title;
  get("doc-meta").textContent = policy.meta || "";
  let html = "";
  policy.clauses.forEach(function (clause, index) {
    html += "<div class=\"clause\"><span class=\"clause-number\">" +
      (index + 1) + "</span><div><h3>" + escapeText(clause.title) +
      "</h3><p>" + escapeText(clause.body) + "</p></div></div>";
  });
  get("doc-clauses").innerHTML = html;
}

function render() {
  renderFilters();
  const visible = getVisiblePolicies();
  if (visible.length > 0 && !visible.some(function (policy) {
    return String(policy.id) === String(selectedId);
  })) selectedId = visible[0].id;
  renderList(visible);
}

function download(policy) {
  const status = get("policy-status");
  if (!jspdf || !jspdf.jsPDF) {
    status.textContent = "PDF is unavailable. Use Print to save the policy as a PDF.";
    status.hidden = false;
    return;
  }
  try {
    const pdf = new jspdf.jsPDF();
    pdf.setFontSize(18);
    pdf.text(policy.title, 20, 20);
    pdf.setFontSize(11);
    pdf.text(policy.meta || "", 20, 30);
    let y = 42;
    policy.clauses.forEach(function (clause, index) {
      const lines = pdf.splitTextToSize((index + 1) + ". " + clause.title + ": " + clause.body, 170);
      lines.forEach(function (line) {
        if (y > 275) { pdf.addPage(); y = 20; }
        pdf.text(line, 20, y);
        y += 7;
      });
      y += 3;
    });
    pdf.save(policy.fileName || "Policy.pdf");
    status.textContent = "PDF ready.";
    status.hidden = false;
  } catch (error) {
    console.error(error);
    status.textContent = "Could not create the PDF. Use Print instead.";
    status.hidden = false;
  }
}

get("policy-search").addEventListener("input", render);
get("filters").addEventListener("click", function (event) {
  const button = event.target.closest("[data-category]");
  if (button) {
    selectedCategory = button.dataset.category;
    render();
  }
});
get("policy-list").addEventListener("click", function (event) {
  const selectButton = event.target.closest("[data-select]");
  const downloadButton = event.target.closest("[data-download]");
  if (selectButton) {
    selectedId = selectButton.dataset.select;
    render();
    if (selectButton.hasAttribute("data-reader")) {
      get("reader").scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }
  if (downloadButton) {
    const policy = policies.find(function (item) {
      return String(item.id) === downloadButton.dataset.download;
    });
    if (policy) download(policy);
  }
});
get("show-new").addEventListener("click", function () {
  selectedCategory = "new";
  get("policy-search").value = "";
  render();
});
get("reset-filters").addEventListener("click", function () {
  selectedCategory = "all";
  get("policy-search").value = "";
  render();
});
get("download-selected").addEventListener("click", function () {
  const policy = policies.find(function (item) {
    return String(item.id) === String(selectedId);
  });
  if (policy) download(policy);
});
get("print-policy").addEventListener("click", function () { print(); });
addEventListener("storage", function (event) {
  if (event.key !== storageKey && event.key !== null) return;
  try {
    policies = event.newValue ? JSON.parse(event.newValue) : [];
    if (!validPolicies(policies)) throw new Error("Invalid policy data");
    policies = policies.filter(function (policy) { return policy.hidden !== true; });
    render();
  } catch (error) {
    console.error(error);
  }
});

loadPolicies();
