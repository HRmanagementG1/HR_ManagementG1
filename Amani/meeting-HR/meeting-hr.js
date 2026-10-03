document.addEventListener("DOMContentLoaded", async function () {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole("HR")) return;
  const M = window.meetingStore;
  const get = id => document.getElementById(id);
  const esc = W.escape;
  const form = get("schedule-form");
  const hours = M.availability();
  get("start-time").value = hours.start;
  get("end-time").value = hours.end;
  get("schedule-date").min = M.today();
  W.users().filter(user => user.role === "Employee").forEach(user => {
    get("schedule-employee").add(new Option(user.name + " — " + user.email, user.id));
  });
  function render() {
    const meetings = M.read();
    get("total-meetings").textContent = meetings.length;
    get("pending-meetings").textContent = meetings.filter(m => m.status === "Pending").length;
    get("approved-today").textContent = meetings.filter(m => m.status === "Confirmed" && m.date === M.today()).length;
    const query = get("meeting-search").value.trim().toLowerCase();
    const visible = meetings.filter(m => (get("meeting-status-filter").value === "all" || m.status === get("meeting-status-filter").value) && (m.employeeName || "").toLowerCase().includes(query));
    get("empty-meetings").style.display = visible.length ? "none" : "block";
    get("hr-meeting-list").innerHTML = visible.map(m => {
      const status = ["Pending", "Confirmed", "Cancelled", "Completed"].includes(m.status) ? m.status : "Pending";
      let actions = "—";
      if (status === "Pending") actions = '<button class="action-button" data-action="approve" data-id="' + esc(m.id) + '">Approve</button> <button class="action-button" data-action="decline" data-id="' + esc(m.id) + '">Decline</button>';
      const link = M.safeLink(m.meetingLink);
      if (status === "Confirmed" && link) actions = '<a class="action-button" target="_blank" rel="noopener noreferrer" href="' + esc(link) + '">Join Room</a>';
      return '<tr><td><strong>' + esc(m.employeeName) + '</strong><br><small>' + esc(m.employeeEmail) + '</small></td><td>' + esc(m.topic) + '</td><td>' + esc(m.date) + '</td><td>' + esc(m.time) + '</td><td><span class="status ' + status.toLowerCase() + '">' + status + '</span></td><td>' + actions + '</td></tr>';
    }).join("");
  }
  get("hr-meeting-list").addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");
    if (!button || !W.requireRole("HR")) return;
    const meetings = M.read();
    const meeting = meetings.find(m => String(m.id) === button.dataset.id);
    if (!meeting || meeting.status !== "Pending") return render();
    if (button.dataset.action === "approve") {
      const error = M.validate(meeting.date, meeting.time, meeting.duration || 30);
      if (error) return alert(error);
    }
    if (!confirm(button.dataset.action === "approve" ? "Approve this meeting request?" : "Decline this meeting request?")) return;
    meeting.status = button.dataset.action === "approve" ? "Confirmed" : "Cancelled";
    if (meeting.status === "Confirmed") {
      meeting.hrRepresentative = W.session().name;
      meeting.meetingLink = "https://meet.jit.si/Workforce-HR-" + encodeURIComponent(meeting.id);
    }
    M.save(meetings);
    render();
  });
  get("open-schedule").addEventListener("click", function () {
    get("schedule-section").scrollIntoView({ behavior: "smooth", block: "start" });
    get("schedule-employee").focus({ preventScroll: true });
  });
  get("save-availability").addEventListener("click", function () {
    if (!W.requireRole("HR")) return;
    const start = get("start-time").value;
    const end = get("end-time").value;
    if (!start || !end || start >= end) {
      get("availability-message").textContent = "Choose an end time after the start time.";
      return;
    }
    W.save("meeting_availability", { start, end });
    get("availability-message").textContent = "Availability saved. New requests and approvals must fit these hours.";
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!W.requireRole("HR") || !form.reportValidity()) return;
    const user = W.users().find(user => String(user.id) === get("schedule-employee").value && user.role === "Employee");
    if (!user) return alert("Please select an employee.");
    const topic = get("schedule-topic").value.trim();
    const date = get("schedule-date").value;
    const time = get("schedule-time").value;
    const duration = Number.parseInt(get("schedule-duration").value, 10);
    const error = M.validate(date, time, duration);
    if (error || !topic) return alert(error || "Enter a meeting topic.");
    const enteredLink = get("meeting-link").value.trim();
    if (enteredLink && !M.safeLink(enteredLink)) return alert("Use an http or https meeting link.");
    const id = crypto.randomUUID();
    const meetings = M.read();
    meetings.push({ id, employeeId: user.id, employeeName: user.name, employeeEmail: user.email, topic, reason: "Meeting scheduled by HR", date, time, duration, hrRepresentative: W.session().name, status: "Confirmed", meetingLink: enteredLink || "https://meet.jit.si/Workforce-HR-" + id, createdAt: new Date().toISOString() });
    M.save(meetings);
    form.reset();
    render();
    alert("Meeting created successfully.");
  });
  get("meeting-search").addEventListener("input", render);
  get("meeting-status-filter").addEventListener("change", render);
  window.addEventListener("storage", event => { if (event.key === "meetings") render(); });
  render();
});
