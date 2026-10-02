document.addEventListener("DOMContentLoaded", async () => {
  const W = window.workspace;
  await W.ready;
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
      `Workforce People Systems · Record ${employeeId}`;
  const dialog = document.getElementById("credentialDialog");
  document.getElementById("credentialDetails").textContent =
    `${user.name} · ${employeeId} · ${user.email}`;
  document.getElementById("credentialButton").onclick = () =>
    dialog.showModal();
  document.getElementById("closeCredential").onclick = () => dialog.close();
});
