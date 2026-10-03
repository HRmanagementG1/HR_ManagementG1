document.addEventListener("DOMContentLoaded", async function () {
  const W = window.workspace;
  await W.ready;
  if (!W.requireRole("HR")) return;
  const get = id => document.getElementById(id);
  const form = get("addEmployeeForm");
  const editId = new URLSearchParams(location.search).get("id");
  const person = editId ? W.users().find(user => String(user.id) === editId) : null;
  function show(text, type) {
    get("alertMessage").textContent = text;
    get("alertMessage").className = "alert alert-" + type;
  }
  if (editId && !person) {
    show("This employee could not be found. Return to the employee list.", "danger");
    form.hidden = true;
    return;
  }
  W.users().forEach(function (user) {
    if (String(user.id) === editId) return;
    get("empManager").add(new Option(user.name, user.id));
  });
  const fields = {
    empName: "name", empEmail: "email", empPosition: "position",
    empPhone: "phone", empLocation: "location", empHireDate: "hireDate",
    empSalary: "salary", empDepartment: "department",
    empEmploymentType: "employmentType", empRole: "role",
    empManager: "managerId", empBio: "bio"
  };
  if (person) {
    document.title = "Edit Employee | Wanderly";
    document.querySelector(".workspace-banner h1").textContent = "Edit Employee";
    document.querySelector(".workspace-eyebrow").textContent = "PEOPLE OPERATIONS / EMPLOYEE INFORMATION";
    document.querySelector(".workspace-banner p:last-child").textContent = "Update your teammate’s information.";
    form.querySelector("button[type=submit]").textContent = "Save Changes";
    get("empPassword").disabled = true;
    get("empPassword").parentElement.hidden = true;
    form.querySelector(":scope > p").hidden = true;
    get("empHireDate").required = false;
    for (const id in fields) {
      const input = get(id);
      const value = person[fields[id]] ?? "";
      if (input.tagName === "SELECT" && value && !Array.from(input.options).some(option => option.value === String(value))) {
        input.add(new Option(value, value));
      }
      input.value = value;
    }
    if (!person.employmentType) get("empEmploymentType").value = "Full-time";
    if (String(person.id) === String(W.session().id)) get("empRole").disabled = true;
  } else {
    const today = new Date();
    get("empHireDate").value = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!W.requireRole("HR") || !form.reportValidity()) return;
    const users = W.users();
    const original = editId ? users.find(user => String(user.id) === editId) : null;
    if (editId && !original) return show("This employee no longer exists.", "danger");
    const changes = {};
    for (const id in fields) changes[fields[id]] = get(id).value.trim();
    changes.email = changes.email.toLowerCase();
    changes.salary = Number(changes.salary);
    if (!changes.name || !changes.position || !changes.location) return show("Enter a name, job title, and location.", "danger");
    if (users.some(user => String(user.id) !== editId && user.email?.toLowerCase() === changes.email)) return show("An employee with this email already exists.", "danger");
    if (original && String(original.id) === String(W.session().id)) changes.role = original.role;
    let employee;
    if (original) {
      employee = { ...original, ...changes };
      if (original.username === original.name) employee.username = employee.name;
      const index = users.findIndex(user => String(user.id) === editId);
      users[index] = employee;
      // Keep older records connected when an employee’s email changes.
      for (const key of ["meetings", "feedback"]) {
        const records = W.read(key, []);
        records.forEach(function (record) {
          const belongs = record.employeeId != null
            ? String(record.employeeId) === editId
            : Boolean(original.email && (key === "feedback" ? record.email : record.employeeEmail)?.toLowerCase() === original.email.toLowerCase());
          if (belongs) {
            record.employeeId = employee.id;
            if (key === "feedback") {
              record.email = employee.email;
              record.name = employee.name;
            } else {
              record.employeeEmail = employee.email;
              record.employeeName = employee.name;
            }
          }
        });
        W.save(key, records);
      }
    } else {
      let code = users.length + 1;
      while (users.some(user => user.employeeCode === "EMP-" + String(code).padStart(3, "0"))) code++;
      employee = { ...changes, id: crypto.randomUUID(), username: changes.name,
        password: get("empPassword").value, employeeCode: "EMP-" + String(code).padStart(3, "0"), joinDate: new Date().toISOString() };
      users.push(employee);
    }
    W.save("site_users", users);
    if (String(W.session().id) === String(employee.id)) {
      const { password, ...details } = employee;
      W.save("site_session", details);
    }
    if (!original) form.reset();
    show(original ? "Employee information updated." : "Employee added. They can sign in with their email and temporary password.", "success");
  });
});
