(() => {
  "use strict";
  const base = new URL(
    ".",
    document.currentScript?.src ||
      new URL("/Shared/workspace.js", location.href),
  );
  const read = (key, fallback = null) => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  };
  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escape = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const normalizeRole = (role) =>
    String(role || "")
      .trim()
      .toLowerCase() === "hr"
      ? "HR"
      : "Employee";
  const normalize = (person) => ({
    ...person,
    id: String(person.id),
    name: person.name || person.username || "",
    username: person.username || person.name || "",
    role: normalizeRole(person.role),
  });
  const ready = (async () => {
    const response = await fetch(new URL("../data/employees.json", base));
    if (!response.ok) throw new Error("Could not load employees.");
    const defaults = await response.json();
    // Convert records removed by the older Delete button into blocked accounts.
    const deleted = read("site_deleted_users", []).map(String);
    const saved = read("site_users", []);
    const users = defaults.map(function (person) {
      const savedPerson = saved.find(function (item) {
        return String(item.id) === String(person.id) && typeof item.password === "string";
      });
      return normalize({ ...person, ...savedPerson });
    });
    [...saved, ...read("employees", [])].forEach((person) => {
      if (
        !users.some(
          (item) =>
            String(item.id) === String(person.id) ||
            item.email?.toLowerCase() === person.email?.toLowerCase(),
        )
      ) {
        users.push(normalize(person));
      }
    });
    users.forEach(function (person) {
      if (deleted.includes(person.id)) person.blocked = true;
    });
    save("site_users", users);
    localStorage.removeItem("site_deleted_users");
    const session = read("site_session");
    if (session) {
      const account = users.find((person) =>
        session.id != null
          ? person.id === String(session.id)
          : person.email?.toLowerCase() === session.email?.toLowerCase(),
      );
      if (account && !account.blocked) {
        const { password, ...details } = account;
        save("site_session", details);
      } else {
        localStorage.removeItem("site_session");
      }
    }
    return users;
  })();
  // Pages await ready before reading the same employee directory used by login.
  window.workspace = {
    ready,
    read,
    save,
    escape,
    users: () => read("site_users", []),
    setEmployeeBlocked(id, blocked) {
      if (!this.requireRole("HR")) return false;
      if (String(this.session().id) === String(id)) return false;
      const users = this.users();
      const employee = users.find(person => String(person.id) === String(id));
      if (!employee) return false;
      employee.blocked = Boolean(blocked);
      save("site_users", users);
      return true;
    },
    leaves() {
      const records = read("site_leaves", []);
      if (!Array.isArray(records)) return [];
      const statuses = { pending: "Pending", approved: "Approved", declined: "Declined", rejected: "Declined", cancelled: "Cancelled" };
      return records.filter(leave => leave && typeof leave === "object").map(leave => ({
        ...leave, status: statuses[String(leave.status).toLowerCase()] || leave.status
      }));
    },
    leaveUsage(id, year = new Date().getFullYear()) {
      const maximum = 15;
      const used = this.leaves().filter(leave =>
        String(leave.owner) === String(id) && leave.status === "Approved"
      ).reduce((total, leave) => total + this.leaveDaysInYear(leave.start, leave.end, year), 0);
      return { year, maximum, used, remaining: Math.max(0, maximum - used) };
    },
    leaveBalance(id, year) {
      return this.leaveUsage(id, year).remaining;
    },
    leaveDaysInYear(start, end, year) {
      if (!this.leaveDays(start, end)) return 0;
      return this.leaveDays(start > year + "-01-01" ? start : year + "-01-01",
        end < year + "-12-31" ? end : year + "-12-31");
    },
    leaveAllowanceError(id, start, end) {
      if (!this.leaveDays(start, end)) return "Choose a valid date range.";
      for (let year = Number(start.slice(0, 4)); year <= Number(end.slice(0, 4)); year++) {
        const balance = this.leaveBalance(id, year);
        if (this.leaveDaysInYear(start, end, year) > balance) {
          return "You have " + balance + " leave days remaining out of 15 for " + year + ".";
        }
      }
      return "";
    },
    leaveDays(start, end) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return 0;
      const days = Math.floor((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
      return Number.isFinite(days) && days > 0 ? days : 0;
    },
    session: () => {
      const session = read("site_session");
      return session ? { ...session, role: normalizeRole(session.role) } : null;
    },
    requireRole(role) {
      const session = this.session();
      const account = session && this.users().find(person => String(person.id) === String(session.id));
      if (!session || !account || account.blocked || account.role !== role || session.role !== role) {
        localStorage.removeItem("site_session");
        location.replace(
          new URL(
            role === "HR"
              ? "../Ahmad/loginHr/LoginHr.html"
              : "../Ahmad/LoginEmp/LoginEmp.html",
            base,
          ),
        );
        return false;
      }
      return true;
    },
    tasks: () => read("site_tasks", []),
    saveTasks: (tasks) => save("site_tasks", tasks),
    updateTask(id, changes) {
      const tasks = this.tasks();
      const task = tasks.find((item) => String(item.id) === String(id));
      if (!task) return null;
      Object.assign(task, changes);
      this.saveTasks(tasks);
      return task;
    },
  };
  ready.catch((error) => console.error("Workspace failed to load:", error));
})();
