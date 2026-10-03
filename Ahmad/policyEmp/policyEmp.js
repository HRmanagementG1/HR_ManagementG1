// Employee policy viewer for the Wanderly HR system.
document.addEventListener("DOMContentLoaded", async function () {
  
  const storageKey = "workforce.policies.v1";
  const categories = {
    all: "All policies",
    new: "New policies",
    everyday: "Everyday work",
    wellbeing: "Wellbeing & Leave",
    security: "Security & Data",
    culture: "Culture & Conduct"
  };
  let policies = [];
  let category = "all";
  let selected = null;
  let statusTimer;

  function get(id) {
    return document.getElementById(id);
  }

  // Escape text before placing it in an HTML template.
  function escape(value) {
    const text = document.createElement("span");
    if (value == null) value = "";
    text.textContent = String(value);
    return text.innerHTML.split('"').join("&quot;").split("'").join("&#39;");
  }

  // Validate the structure of the employee policy data and filter out any hidden policies.
  function employeePolicies(items) {
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
    // Filter out any policies that are marked as hidden, so they are not displayed to employees.
    return items.filter(function (policy) {
      return policy.hidden !== true;
    });
  }

  // Load the employee policies from localStorage or the JSON file, and save them to localStorage for future use.
  async function loadPolicies() {
    const saved = localStorage.getItem(storageKey);
    if (saved !== null) {
      policies = employeePolicies(JSON.parse(saved));
      return;
    }
    const response = await fetch("../../data/policies.json");
    if (!response.ok) throw new Error("Could not load the policy file.");
    const items = await response.json();
    policies = employeePolicies(items);
    localStorage.setItem(storageKey, JSON.stringify(items));
  }

 // Check if a policy matches the selected category filter, allowing for "all" and "new" categories.
  function matchesCategory(policy, categoryName) {
    if (categoryName === "all") return true;
    if (categoryName === "new") return Boolean(policy.isNew);
    return policy.category === categoryName;
  }
  // Render the counts of total policies and new policies, and create filter buttons for each category.
  function renderCounts() {
    get("total-count").textContent = policies.length;
    get("new-count").textContent = policies.filter(function (policy) {
      return policy.isNew;
    }).length;
    get("filters").innerHTML = "";
    for (const key in categories) {
      const count = policies.filter(function (policy) {
        return matchesCategory(policy, key);
      }).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn filter-pill";
      if (key === category) button.className += " active";
      button.textContent = categories[key] + " (" + count + ")";
      button.setAttribute("aria-pressed", String(key === category));
      button.addEventListener("click", function () {
        category = key;
        render();
      });
      get("filters").appendChild(button);
    }
  }

  // Filter the policies based on the search query and selected category, returning only those that match both criteria.
  function visiblePolicies() {
    const query = get("policy-search").value.trim().toLowerCase();
    return policies.filter(function (policy) {
      let text = policy.title + " " + (policy.description || "") + " " +
        (categories[policy.category] || "");
      for (const clause of policy.clauses) {
        text += " " + clause.title + " " + clause.body;
      }
      return matchesCategory(policy, category) && text.toLowerCase().includes(query);
    });
  }

  // Render the policy cards in the list view, and attach event listeners for selecting a policy or downloading its PDF.
  function renderCards(visible) {
    get("policy-list").innerHTML = visible.map(function (policy) {
      return `<article class="policy-card${selected === policy.id ? ' selected' : ''}">
      <button type="button" class="card-content" data-select="${escape(policy.id)}" aria-pressed="${selected === policy.id}">
        <div class="d-flex align-items-start gap-3 justify-content-between"><div>
          <div class="d-flex flex-wrap align-items-center gap-2"><span class="category-tag ${escape(policy.category)}">${escape(categories[policy.category])}</span><small>${policy.updatedAt ? `Updated ${escape(policy.updatedAt)}` : 'Updated Sep 2026'}</small>${policy.isNew ? '<span class="new-tag">New</span>' : ''}</div>
          <h3>${escape(policy.shortTitle)}</h3><p>${escape(policy.description)}</p>
        </div>${selected === policy.id ? '<span class="selection-check" aria-hidden="true">✓</span>' : ''}</div>
      </button>
      <div class="card-actions d-flex flex-wrap justify-content-between align-items-center gap-2"><small>PDF · v${escape(policy.version)}</small><div class="d-flex gap-2"><button type="button" class="btn btn-sm btn-light" data-select="${escape(policy.id)}" data-focus-reader>View in reader</button><button type="button" class="btn btn-sm btn-primary-policy" data-download="${escape(policy.id)}" aria-label="Download ${escape(policy.shortTitle)} PDF">↓ PDF</button></div></div>
    </article>`;
    }).join("");
    get("policy-list").querySelectorAll("[data-select]").forEach(function (button) {
      button.addEventListener("click", function () {
        const focusReader = button.hasAttribute("data-focus-reader");
        const policy = policies.find(function (item) {
          return String(item.id) === button.dataset.select;
        });
        selected = policy.id;
        render();
        if (focusReader) {
          get("doc-title").tabIndex = -1;
          get("doc-title").focus({ preventScroll: true });
          get("reader").scrollIntoView({ behavior: "smooth", block: "nearest" });
        } else {
          get("policy-list").querySelectorAll(".card-content").forEach(function (card) {
            if (card.dataset.select === String(selected)) card.focus({ preventScroll: true });
          });
        }
      });
    });
    get("policy-list").querySelectorAll("[data-download]").forEach(function (button) {
      button.addEventListener("click", function () {
        const policy = policies.find(function (item) {
          return String(item.id) === button.dataset.download;
        });
        if (policy) download([policy], policy.fileName || "Policy.pdf");
      });
    });
  }

  // Render the selected policy in the reader view, displaying its code, title, meta information, and clauses in a structured format.
  function renderReader() {
    const policy = policies.find(function (item) { return item.id === selected; });
    get("doc-code").textContent = policy.code || "";
    get("doc-title").textContent = policy.title;
    get("doc-meta").textContent = policy.meta || "";
    get("doc-clauses").innerHTML = "";
    policy.clauses.forEach(function (clause, index) {
      const section = document.createElement("div");
      section.className = "clause";
      section.innerHTML = '<span class="clause-number"></span><div><h3></h3><p></p></div>';
      section.querySelector(".clause-number").textContent = index + 1;
      section.querySelector("h3").textContent = clause.title;
      section.querySelector("p").textContent = clause.body;
      get("doc-clauses").appendChild(section);
    });
  }

  // Render the overall view, including the policy list, reader, and counts, based on the current category and search filters.
  function render() {
    const visible = visiblePolicies();
    const hasSelected = visible.find(function (policy) { return policy.id === selected; });
    if (visible.length > 0 && !hasSelected) selected = visible[0].id;
    const empty = visible.length === 0;
    get("download-selected").disabled = empty;
    get("print-policy").disabled = empty;
    get("empty-state").hidden = !empty;
    get("reader").hidden = empty;
    get("results-count").textContent = "Showing " + visible.length +
      (visible.length === 1 ? " policy" : " policies");
    renderCounts();
    renderCards(visible);
    if (!empty) renderReader();
  }

  // Display a temporary status message to the user, which disappears after a few seconds.
  function status(message) {
    clearTimeout(statusTimer);
    get("policy-status").textContent = message;
    get("policy-status").hidden = false;
    statusTimer = setTimeout(function () {
      get("policy-status").hidden = true;
    }, 4500);
  }

  // Download the selected policies as a PDF file, using the jsPDF library to format the content and add page numbers.
  function download(items, filename) {
    if (typeof jspdf === "undefined" || !jspdf.jsPDF) {
      status('The PDF library could not load. Check your connection and try again, or use Print to save as PDF.');
      return;
    }
    try {
      const pdf = new jspdf.jsPDF();
      items.forEach(function (policy, index) {
        if (index) pdf.addPage();
        let y = 24;
        function write(text, size, bold = false) {
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(size);
          const lines = pdf.splitTextToSize(String(text || "").replace(/[–—]/g, '-').replace(/•/g, '|'), 170);
          lines.forEach(function (line) {
            if (y > 270) {
              pdf.addPage();
              y = 24;
            }
            pdf.text(line, 20, y);
            y += size * 0.5;
          });
          y += 5;
        };
        pdf.setTextColor(0, 57, 58);
        write('WANDERLY / EMPLOYEE POLICIES', 11, true);
        write(policy.code, 10);
        write(policy.title, 20, true);
        pdf.setTextColor(63, 73, 72);
        write(policy.meta, 10);
        policy.clauses.forEach(function (clause, clauseIndex) {
          write(`${clauseIndex + 1}. ${clause.title}`, 12, true);
          write(clause.body, 11);
        });
        write('Demonstration content. Requires HR approval before use.', 9);
      });
      const count = pdf.getNumberOfPages();
      for (let page = 1; page <= count; page++) {
        pdf.setPage(page);
        pdf.setFontSize(9);
        pdf.text(`Wanderly | Page ${page} of ${count}`, 20, 287);
      }
      pdf.save(filename);
      status(`PDF ready: ${filename}`);
    } catch (error) {
      console.error('PDF generation failed', error);
      status('Could not create the PDF. Please try again or use Print to save as PDF.');
    }
  }

  // Initialize the policy viewer by disabling controls, loading policies, and setting up event listeners for search, filters, and downloads.
  get("policy-search").disabled = true;
  get("show-new").disabled = true;
  get("download-selected").disabled = true;
  get("print-policy").disabled = true;
  try {
    await loadPolicies();
  } catch (error) {
    console.error("Could not load policies:", error);
    get("total-count").textContent = "—";
    get("new-count").textContent = "0";
    get("results-count").textContent = "Policies unavailable";
    get("empty-state").hidden = false;
    get("empty-state").innerHTML = "<h2>Policies could not be loaded</h2><p>Please refresh to try again.</p>";
    get("reader").hidden = true;
    return;
  }
  get("policy-search").disabled = false;
  get("show-new").disabled = false;
  get("policy-search").addEventListener("input", render);
  get("show-new").addEventListener("click", function () {
    category = "new";
    get("policy-search").value = "";
    render();
  });
  get("reset-filters").addEventListener("click", function () {
    category = "all";
    get("policy-search").value = "";
    render();
    get("policy-search").focus();
  });
  get("download-selected").addEventListener("click", function () {
    const policy = policies.find(function (item) { return item.id === selected; });
    if (policy) download([policy], policy.fileName || "Policy.pdf");
  });
  get("print-policy").addEventListener("click", function () { print(); });
  // HR changes in another tab update the employee view.
  addEventListener("storage", function (event) {
    if (event.storageArea !== localStorage) return;
    if (event.key !== storageKey && event.key !== null) return;
    try {
      let items = [];
      if (event.newValue !== null) items = JSON.parse(event.newValue);
      policies = employeePolicies(items);
      render();
    } catch (error) {
      policies = [];
      render();
      status("Saved policies could not be read. Check the HR library and refresh.");
    }
  });
  render();
});
