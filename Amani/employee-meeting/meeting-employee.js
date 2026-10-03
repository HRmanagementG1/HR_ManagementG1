document.addEventListener("DOMContentLoaded", async function () {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole("Employee")) return;
  const M = window.meetingStore;
  const user = W.session();
  const get = id => document.getElementById(id);
  const esc = W.escape;
  const form = get("meeting-form");
  get("meeting-date").min = M.today();
  const hint = document.createElement("p");
  hint.className = "meeting-hours-hint";
  form.append(hint);

  function render() {
    const hours = M.availability();
    hint.textContent = "Meetings last 30 minutes. HR availability: " + hours.start + "–" + hours.end + ".";
    get("meeting-time").min = hours.start;
    get("meeting-time").max = hours.end;
    const mine = M.read().filter(meeting => M.owns(meeting, user));
    const visible = mine.filter(meeting => get("status-filter").value === "all" || meeting.status === get("status-filter").value);
    get("empty-history").style.display = visible.length ? "none" : "block";
    get("meeting-history").innerHTML = visible.map(meeting => {
      const link = M.safeLink(meeting.meetingLink);
      const status = ["Pending", "Confirmed", "Cancelled", "Completed"].includes(meeting.status) ? meeting.status : "Pending";
      return '<tr><td>' + esc(meeting.topic) + '</td><td>' + esc(meeting.date) + '</td><td>' + esc(meeting.time) + '</td><td>' + esc(meeting.hrRepresentative || "Not assigned yet") + '</td><td><span class="status ' + status.toLowerCase() + '">' + status + '</span></td><td>' + (link && status === "Confirmed" ? '<a class="meeting-link" target="_blank" rel="noopener noreferrer" href="' + esc(link) + '">Join Meeting</a>' : "—") + '</td><td>' + (status === "Pending" ? '<button class="action-button" data-cancel="' + esc(meeting.id) + '">Cancel</button>' : "—") + '</td></tr>';
    }).join("");
    const upcoming = mine.filter(meeting => meeting.status === "Confirmed" && new Date(meeting.date + "T" + meeting.time) > new Date()).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    if (!upcoming) {
      get("upcoming-meeting").innerHTML = '<p class="no-meeting">You do not have an upcoming meeting.</p>';
      return;
    }
    const link = M.safeLink(upcoming.meetingLink);
    get("upcoming-meeting").innerHTML = '<div><h3>' + esc(upcoming.topic) + '</h3><p><strong>Date:</strong> ' + esc(upcoming.date) + '</p><p><strong>Time:</strong> ' + esc(upcoming.time) + '</p><p><strong>HR Representative:</strong> ' + esc(upcoming.hrRepresentative) + '</p>' + (link ? '<a class="meeting-link" target="_blank" rel="noopener noreferrer" href="' + esc(link) + '">Join Meeting</a>' : "") + '</div>';
  }
  get("meeting-reason").addEventListener("input", function () {
    get("character-count").textContent = this.value.length + "/500";
  });
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!W.requireRole("Employee")) return;
    if (String(W.session().id) !== String(user.id)) return location.reload();
    if (!form.reportValidity()) return;
    const reason = get("meeting-reason").value.trim();
    const date = get("meeting-date").value;
    const time = get("meeting-time").value;
    const error = M.validate(date, time);
    if (error || !reason) return alert(error || "Please enter your meeting reason.");
    const meetings = M.read();
    meetings.push({ id: crypto.randomUUID(), employeeId: user.id, employeeName: user.name, employeeEmail: user.email, topic: get("meeting-topic").value, reason, date, time, duration: 30, hrRepresentative: "Not assigned yet", status: "Pending", meetingLink: "", createdAt: new Date().toISOString() });
    M.save(meetings);
    form.reset();
    get("character-count").textContent = "0/500";
    render();
    alert("Your meeting request has been submitted successfully.");
  });
  get("meeting-history").addEventListener("click", function (event) {
    const button = event.target.closest("[data-cancel]");
    if (!button || !confirm("Cancel this meeting request?")) return;
    const meetings = M.read();
    const meeting = meetings.find(item => String(item.id) === button.dataset.cancel);
    if (!meeting || !M.owns(meeting, W.session()) || meeting.status !== "Pending") return render();
    meeting.status = "Cancelled";
    M.save(meetings);
    render();
  });
  get("status-filter").addEventListener("change", render);
  window.addEventListener("storage", event => { if (["meetings", "meeting_availability"].includes(event.key)) render(); });
  render();
});
