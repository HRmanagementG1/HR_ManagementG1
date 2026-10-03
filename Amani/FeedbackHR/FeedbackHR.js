document.addEventListener("DOMContentLoaded", async function () {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole("HR")) return;
  const esc = W.escape;
  const list = document.querySelector(".feedback-list");
  const search = document.querySelector(".feedback-search");
  const filters = [...document.querySelectorAll(".filter")];
  const categories = ["all", "unread", "anonymous", "support", "kudos"];
  let selected = "all";
  function render() {
    const feedbacks = W.read("feedback", []);
    const unread = feedbacks.filter(f => !f.read).length;
    const counts = [feedbacks.length, unread, feedbacks.filter(f => f.topic === "Kudos").length];
    document.querySelectorAll(".stat-card .stat-number").forEach((el, i) => el.textContent = counts[i]);
    filters[0].textContent = "All Feedback (" + feedbacks.length + ")";
    filters[1].textContent = "Unread (" + unread + ")";
    const query = search.value.trim().toLowerCase();
    const visible = feedbacks.filter(f => {
      const matchesCategory = selected === "all" || (selected === "unread" && !f.read) || (selected === "anonymous" && (!f.name || f.name === "Anonymous Employee")) || (selected === "support" && f.topic === "Support") || (selected === "kudos" && f.topic === "Kudos");
      return matchesCategory && [f.name, f.message, f.topic].some(value => String(value || "").toLowerCase().includes(query));
    });
    list.innerHTML = visible.map(f => {
      const name = f.name || "Anonymous Employee";
      const initials = name.split(/\s+/).map(word => word[0]).join("").slice(0, 2);
      const type = f.topic === "Support" ? "support" : f.topic === "Kudos" ? "kudos" : "suggestion";
      return '<div class="feedback-card"><div class="feedback-top"><div class="employee-info"><div class="avatar">' + esc(initials) + '</div><div><h3>' + esc(name) + '</h3><span>Employee • Submitted ' + esc(f.date || "") + '</span></div></div><span class="feedback-type ' + type + '">' + esc(f.topic) + '</span></div><p class="feedback-message">' + esc(f.message) + '</p><div class="feedback-bottom"><span class="status ' + (f.read ? "reviewed" : "unread") + '">' + (f.read ? "Reviewed" : "◉ Unread") + '</span><div class="feedback-actions">' + (!f.read ? '<button data-action="read" data-id="' + esc(f.id) + '">Mark as Read</button><button data-action="assign" data-id="' + esc(f.id) + '">Assign to HR Lead</button>' : "") + '</div></div>' + (f.assignedTo ? '<p>Assigned to ' + esc(f.assignedTo) + '</p>' : "") + '</div>';
    }).join("") || '<p style="text-align:center">No feedback found.</p>';
  }
  filters.forEach((button, index) => button.addEventListener("click", function () {
    selected = categories[index];
    filters.forEach(item => item.classList.toggle("active", item === button));
    render();
  }));
  search.addEventListener("input", render);
  list.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button || !W.requireRole("HR")) return;
    const feedbacks = W.read("feedback", []);
    const feedback = feedbacks.find(f => String(f.id) === button.dataset.id);
    if (!feedback) return;
    if (button.dataset.action === "read") feedback.read = true;
    if (button.dataset.action === "assign") feedback.assignedTo = "HR Lead";
    W.save("feedback", feedbacks);
    render();
  });
  window.addEventListener("storage", event => { if (event.key === "feedback") render(); });
  render();
});
