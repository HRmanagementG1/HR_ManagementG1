document.addEventListener("DOMContentLoaded", async () => {
  const W = window.workspace;
  await W.ready;

  // Only allow Employee role to access this page.
  const hrView = document.body.dataset.workspaceRole === "HR";
  if (!W.requireRole(hrView ? "HR" : "Employee")) return;

  
  const userId = hrView
    ? new URLSearchParams(location.search).get("id")
    : String(W.session().id);
  const user = W.users().find((person) => person.id === userId);
  if (!user) {
    document.querySelector(".main-container").textContent =
      "Employee record not found.";
    return;
  }
  const employeeId =
    user.employeeCode || `EMP-${String(user.id).padStart(3, "0")}`;
  document
    .querySelectorAll("[data-user]")
    .forEach(
      (el) => (el.textContent = user[el.dataset.user] || "Not provided"),
    );
  document.getElementById("recordStatus").textContent =
    `${employeeId} · Active Employee`;
  document.getElementById("departmentLocation").textContent = [
    user.department,
    user.location,
  ]
    .filter(Boolean)
    .join(" · ");
  const avatar = document.getElementById("informationAvatar");
  avatar.textContent = user.name
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("");
  if (user.image && /^(https?:|data:image\/)/.test(user.image)) {
    const image = document.createElement("img");
    image.src = user.image;
    image.alt = user.name;
    avatar.replaceChildren(image);
  }
  const hired = new Date(user.hireDate || user.joinDate);
  const fields = {
    ...user,
    employeeId,
    hireDate: Number.isNaN(hired.getTime())
      ? "Not recorded"
      : hired.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    manager:
      W.users().find((person) => String(person.id) === String(user.managerId))
        ?.name ||
      user.manager ||
      "Not assigned",
  };
  document
    .querySelectorAll("[data-info]")
    .forEach(
      (el) => (el.textContent = fields[el.dataset.info] || "Not provided"),
    );
  const phoneForm = document.getElementById("phoneForm");
  if (!hrView && phoneForm) {
    const phoneInput = document.getElementById("phoneInput");
    const editPhone = document.getElementById("editPhone");
    const phoneMessage = document.getElementById("phoneMessage");

    function closePhoneEditor() {
      phoneForm.hidden = true;
      editPhone.hidden = false;
      editPhone.setAttribute("aria-expanded", "false");
      editPhone.focus();
    }

    editPhone.addEventListener("click", () => {
      phoneInput.value = user.phone || "";
      phoneInput.setCustomValidity("");
      phoneMessage.textContent = "";
      phoneForm.hidden = false;
      editPhone.hidden = true;
      editPhone.setAttribute("aria-expanded", "true");
      phoneInput.focus();
    });
    document.getElementById("cancelPhone").addEventListener("click", closePhoneEditor);
    phoneInput.addEventListener("input", () => phoneInput.setCustomValidity(""));

    phoneForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const phone = phoneInput.value.trim();
      const digits = phone.replace(/\D/g, "");
      if (!/^\+?[\d\s()-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
        phoneInput.setCustomValidity("Enter a phone number with 7–15 digits.");
        phoneInput.reportValidity();
        return;
      }

      const session = W.session();
      if (!session || session.role !== "Employee" || String(session.id) !== userId) {
        phoneMessage.textContent = "Please sign in again to edit your phone number.";
        return;
      }

      try {
        // Read the latest records and update only this employee's phone number.
        const users = W.users();
        const account = users.find((person) => String(person.id) === userId);
        if (!account) throw new Error("Employee record not found.");
        account.phone = phone;
        W.save("site_users", users);
      } catch {
        phoneMessage.textContent = "Could not save your number. Please try again.";
        return;
      }

      user.phone = phone;
      document.querySelector('[data-info="phone"]').textContent = phone;
      closePhoneEditor();
      phoneMessage.textContent = "Phone number saved.";
      try {
        W.save("site_session", { ...session, phone });
      } catch {
        phoneMessage.textContent = "Phone number saved. Refresh to update your session.";
      }
    });
  }
  const extra = document.createElement("section");
  extra.className = "employee-record-extra";
  const title = document.createElement("h3");
  title.textContent = "Employment details";
  extra.append(title);
  for (const [label, value] of [
    ["Employment type", user.employmentType || "Full-time"],
    ["Account role", user.role],
    ["About", user.bio || "No employee notes recorded."],
  ]) {
    const p = document.createElement("p"),
      strong = document.createElement("strong");
    strong.textContent = `${label}: `;
    p.append(strong, document.createTextNode(value));
    extra.append(p);
  }
  document.querySelector(".left-column").append(extra);
  const salary = Number(user.salary);
  const available = user.salary != null && Number.isFinite(salary);
  const amount = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  let hidden = false;
  const displaySalary = () => {
    document.getElementById("annualSalary").textContent = hidden
      ? "••••••"
      : available
        ? `${amount(salary)} USD`
        : "Not provided";
    document.getElementById("monthlySalary").textContent = hidden
      ? "••••••"
      : available
        ? `${amount(salary / 12)} / mo`
        : "—";
    const toggle = document.getElementById("toggleSalary");
    toggle.setAttribute("aria-label", hidden ? "Show salary" : "Hide salary");
    toggle.setAttribute("aria-pressed", String(hidden));
    toggle.innerHTML = `<i class="fa-solid fa-eye${hidden ? "-slash" : ""}"></i>`;
  };
  displaySalary();
  document.getElementById("toggleSalary").onclick = () => {
    hidden = !hidden;
    displaySalary();
  };
  const performance = user.performance;
  document.querySelector(".quarter-badge").textContent =
    performance?.period || "Awaiting appraisal";
  document.querySelector(".score-big").textContent = performance?.score ?? "—";
  document.querySelector(".rating-stars-text strong").textContent =
    performance?.summary || "No appraisal recorded";
  document.querySelector(".stars").hidden = !performance;
  document.querySelector(".bonus-badge").textContent =
    performance?.bonus || "Review details will appear here";
  const metrics = ["collaboration", "leadership", "initiative", "policy"];
  document.querySelectorAll(".progress-item").forEach((item, index) => {
    const value = performance?.[metrics[index]];
    item.querySelector("strong").textContent =
      value == null ? "Not rated" : `${value} / 5.0`;
    item.querySelector(".progress-fill").style.width =
      `${Math.max(0, Math.min(100, ((Number(value) || 0) / 5) * 100))}%`;
  });
  if (document.getElementById("recordFooter"))
    document.getElementById("recordFooter").textContent =
      `Wanderly People Systems · Record ${employeeId}`;
  const dialog = document.getElementById("credentialDialog");
  document.getElementById("credentialDetails").textContent =
    `${user.name} · ${employeeId} · ${user.email}`;
  document.getElementById("credentialButton").onclick = () =>
    dialog.showModal();
  document.getElementById("closeCredential").onclick = () => dialog.close();
});
