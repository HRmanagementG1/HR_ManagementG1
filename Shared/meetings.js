// Shared storage and validation for employee and HR meeting pages.
window.meetingStore = {
  read() {
    const meetings = window.workspace.read("meetings", []);
    return Array.isArray(meetings) ? meetings : [];
  },
  save(meetings) {
    window.workspace.save("meetings", meetings);
  },
  owns(meeting, user) {
    if (!user) return false;
    if (meeting.employeeId != null) return String(meeting.employeeId) === String(user.id);
    return Boolean(user.email && meeting.employeeEmail &&
      meeting.employeeEmail.toLowerCase() === user.email.toLowerCase());
  },
  availability() {
    const saved = window.workspace.read("meeting_availability", null);
    if (saved && /^\d{2}:\d{2}$/.test(saved.start) && /^\d{2}:\d{2}$/.test(saved.end) && saved.start < saved.end) return saved;
    return { start: "09:00", end: "17:00" };
  },
  today() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  },
  validate(date, time, duration = 30) {
    if (!Number.isFinite(Number(duration)) || Number(duration) <= 0) return "Choose a valid meeting duration.";
    const start = new Date(`${date}T${time}`);
    if (!date || !time || !Number.isFinite(start.getTime())) return "Choose a valid meeting date and time.";
    if (start <= new Date()) return "Choose a meeting date and time in the future.";
    const hours = this.availability();
    const minutes = value => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
    if (time < hours.start || minutes(time) + Number(duration) > minutes(hours.end)) {
      return `The full meeting must fit between ${hours.start} and ${hours.end}.`;
    }
    return "";
  },
  safeLink(value) {
    try {
      const url = new URL(value);
      return ["https:", "http:"].includes(url.protocol) ? url.href : "";
    } catch { return ""; }
  }
};
