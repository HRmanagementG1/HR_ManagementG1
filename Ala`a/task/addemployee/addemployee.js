document.addEventListener("DOMContentLoaded", async () => {
  // Wait for the workspace to be ready to load the users and other data.
  const W = window.workspace;
  await W.ready;

  // Only allow HR role to access this page.
  if (!W.requireRole("HR")) return;
  const form = document.getElementById("addEmployeeForm");
  const message = document.getElementById("alertMessage");
  const show = (text, type) => {
    message.textContent = text;
    message.className = `alert alert-${type}`;
  };
  // reads the saved list from browser storage.
  W.users().forEach((person) => {
    const option = document.createElement("option");
    option.value = person.id;
    option.textContent = person.name;
    document.getElementById("empManager").append(option);
  });

  // Set the default hire date to today.
  const today = new Date();
  document.getElementById("empHireDate").value =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Handle form submission to add a new employee.
  form.addEventListener("submit", (event) => {
    event.preventDefault();


    // Validate the form and check for duplicate emails before adding the employee.
    if (!form.reportValidity()) return;

    // Helper function to get trimmed input values by ID.
    const value = (id) => document.getElementById(id).value.trim();
    

    // Get the employee name and email, and check for duplicates.
    const name = value("empName"),email = value("empEmail").toLowerCase();

    // Validate the employee name and check if the email already exists in the users list.
    if (!name) return show("Enter the employee name.", "danger");
    if (W.users().some((person) => person.email?.toLowerCase() === email))
      return show("An employee with this email already exists.", "danger");

    // Create a new employee object with the form data.
    const employee = {
      id: crypto.randomUUID(),
      name,
      username: name,
      email,
      department: value("empDepartment"),
      position: value("empPosition"),
      role: value("empRole"),
      password: document.getElementById("empPassword").value,
      employeeCode: `EMP-${String(W.users().length + 1).padStart(3, "0")}`,
      phone: value("empPhone"),
      salary: Number(value("empSalary")),
      hireDate: value("empHireDate"),
      employmentType: value("empEmploymentType"),
      managerId: value("empManager"),
      bio: value("empBio"),
      joinDate: new Date().toISOString(),
      location: value("empLocation"),
    };

    // Save the new employee to the workspace and reset the form.
    W.save("site_users", [...W.users(), employee]);
    form.reset();
    show(
      "Employee added. They can sign in with their email and temporary password and receive task assignments.",
      "success",
    );
  });
});
