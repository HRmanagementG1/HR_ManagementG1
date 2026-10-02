document.addEventListener("DOMContentLoaded", async () => {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole("HR")) return;
  const all = W.users(),
    esc = W.escape;
  const body = document.getElementById("employeeTableBody");
  const search = document.querySelector(".main-search input");
  search.value = new URLSearchParams(location.search).get("q") || "";
  const tabs = [...document.querySelectorAll(".tab")];
  const categories = [
    () => true,
    (e) => ["Engineering", "IT"].includes(e.department),
    (e) => ["Product & Design", "Design"].includes(e.department),
    (e) => e.department === "Marketing",
    (e) => ["Human Resources", "HR", "Operations"].includes(e.department),
    (e) => e.department === "Sales",
  ];
  let category = 0,
    ascending = true;
  tabs.forEach((tab, index) => {
    tab.textContent = `${tab.textContent.replace(/\s*\(.*\)/, "")} (${all.filter(categories[index]).length})`;
    tab.onclick = () => {
      category = index;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      render();
    };
  });
  function render() {
    const query = search.value.trim().toLowerCase();
    const visible = all
      .filter(categories[category])
      .filter((e) =>
        [e.name, e.email, e.department, e.position].some((v) =>
          String(v || "")
            .toLowerCase()
            .includes(query),
        ),
      )
      .sort((a, b) => (ascending ? 1 : -1) * a.name.localeCompare(b.name));
    body.innerHTML =
      visible
        .map(
          (e) =>
            `<tr><td><div class="emp-cell"><div class="avatar">${esc(
              e.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2),
            )}</div><div class="emp-info"><span class="emp-name">${esc(e.name)}</span><span class="emp-role-email">${esc(e.position || e.role)} · ${esc(e.email)}</span></div></div></td><td><span class="dept-badge">${esc(e.department)}</span></td><td>${esc(e.location || "—")}</td><td><button class="btn-more" data-id="${esc(e.id)}">More Details</button></td></tr>`,
        )
        .join("") || '<tr><td colspan="4">No employees found.</td></tr>';
    document.querySelector(".pagination-info").textContent =
      `Showing ${visible.length} of ${all.length} employees`;
  }
  search.addEventListener("input", render);
  document.querySelector(".pagination-controls").hidden = true;
  const filter = document.querySelector(".controls-row .btn-outline");
  filter.textContent = "Sort A–Z";
  filter.onclick = () => {
    ascending = !ascending;
    filter.textContent = ascending ? "Sort A–Z" : "Sort Z–A";
    render();
  };
  const modal = document.getElementById("employeeModal");
  body.onclick = (event) => {
    const button = event.target.closest("[data-id]");
    const e = all.find((e) => e.id === button?.dataset.id);
    if (!e) return;
    const values = {
      modalAvatar: e.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2),
      modalName: e.name,
      modalRole: e.position || e.role,
      modalDepartment: e.department,
      modalEmail: e.email,
      modalLocation: e.location || "—",
      modalWorkId: e.id,
      modalFullName: e.name,
    };
    Object.entries(values).forEach(
      ([id, value]) => (document.getElementById(id).textContent = value || "—"),
    );
    document.getElementById("modalSalary").textContent =
      e.salary == null
        ? "Not provided"
        : new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(e.salary);
    document.getElementById("modalPhone").textContent =
      e.phone || "Not provided";
    document.getElementById("modalHireDate").textContent =
      e.hireDate ||
      (e.joinDate ? new Date(e.joinDate).toLocaleDateString() : "Not recorded");
    document.getElementById("modalEmploymentType").textContent =
      e.employmentType || "Full-time";
    document.getElementById("fullEmployeeRecord").href =
      `employee-details.html?id=${encodeURIComponent(e.id)}`;
    modal.classList.add("active");
    document.getElementById("closeModalBtn").focus();
  };
  document.getElementById("closeModalBtn").onclick = () =>
    modal.classList.remove("active");
  modal.onclick = (event) => {
    if (event.target === modal) modal.classList.remove("active");
  };
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") modal.classList.remove("active");
  });
  const cards = [...document.querySelectorAll(".stat-card")];
  const labels = [
    "TOTAL WORKFORCE",
    "ACTIVE WORKING",
    "ON LEAVE",
    "NEWLY ONBOARDED",
  ];
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const onLeave = new Set(
    W.read("site_leaves", [])
      .filter(
        (leave) =>
          String(leave.status).toLowerCase() === "approved" &&
          leave.start <= today &&
          leave.end >= today &&
          all.some((e) => e.id === String(leave.owner)),
      )
      .map((leave) => String(leave.owner)),
  ).size;
  const counts = [
    all.length,
    all.length - onLeave,
    onLeave,
    all.filter((e) => {
      const date = new Date(e.hireDate || e.joinDate);
      return (
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear()
      );
    }).length,
  ];
  cards.forEach((card, index) => {
    card.querySelector(".stat-title").textContent = labels[index];
    card.querySelector(".stat-number").textContent = counts[index];
    card
      .querySelectorAll(".stat-badge,.stat-desc,.stat-progress-bar")
      .forEach((el) => (el.hidden = true));
  });
  render();
});
