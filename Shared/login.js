// Both login pages call this function with their own settings.
function setupLogin(role, usernameId, destination) {
  const form = document.getElementById("loginForm");
  const username = document.getElementById(usernameId);
  const password = document.getElementById("password");
  const toggle = document.getElementById("togglePassword");
  const message = document.getElementById("login-message");
  const submit = form.querySelector('button[type="submit"]');

  function showMessage(text) {
    message.textContent = text;
    message.hidden = text === "";
  }

  // Load the employee list from localStorage or the JSON file.
  async function loadEmployees() {

    const saved = localStorage.getItem("site_users");
    if (saved !== null) {
      const employees = JSON.parse(saved);
      if (!Array.isArray(employees)) throw new Error("Invalid employee list.");
      return employees;
    }
    // If not in localStorage, load from the JSON file and save it to localStorage.
    const response = await fetch("../../data/employees.json");
    if (!response.ok) throw new Error("Could not load employees.");
    const employees = await response.json();
    if (!Array.isArray(employees)) throw new Error("Invalid employee file.");
    // Normalize the employee data to ensure consistent structure.
    for (const employee of employees) {
      employee.id = String(employee.id);
      employee.name = employee.name || employee.username || "";
      employee.username = employee.username || employee.name;
    }
    // Save the normalized employee list to localStorage for future logins.
    localStorage.setItem("site_users", JSON.stringify(employees));
    return employees;
  }

  // Toggle password visibility when the toggle button is clicked.
  toggle.addEventListener("click", function () {
    // Toggle the password input type between "password" and "text" to show or hide the password.
    if (password.type === "password") {
      password.type = "text";
      toggle.textContent = "Hide";
      toggle.setAttribute("aria-pressed", "true");
    } 
    else {
      password.type = "password";
      toggle.textContent = "Show";
      toggle.setAttribute("aria-pressed", "false");
    }
  });

  // Handle the form submission for login.
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    // Validate the form and check if the submit button is disabled to prevent multiple submissions.
    if (!form.reportValidity() || submit.disabled) return;
    submit.disabled = true;
    showMessage("");
    try {
      const employees = await loadEmployees();
      const enteredName = username.value.trim().toLowerCase();
      let user = null;
      // Check if the entered username or email matches any employee's username, name, or email, and if the password matches.
      for (const employee of employees) {
        const names = [employee.username, employee.name, employee.email];
        for (const name of names) {
          if (typeof name === "string" && name.toLowerCase() === enteredName &&
              employee.password === password.value) {
            user = employee;
            break;
          }
        }
        if (user) break;
      }
      if (!user) {
        showMessage("Incorrect username, email, or password.");
        return;
      }
      // Check if the user's role matches the expected role for this login page.
      if (String(user.role).toLowerCase() !== role.toLowerCase()) {
        showMessage("Please use the " + user.role + " login page.");
        return;
      }
      // Keep the password out of the signed-in user's session.
      const session = {};
      for (const key in user) {
        if (key !== "password") session[key] = user[key];
      }
      session.id = String(user.id);
      session.name = user.name || user.username;
      session.role = role;
      localStorage.setItem("site_session", JSON.stringify(session));
      localStorage.removeItem("loggedInUser");
      location.href = destination;
    } catch (error) {
      showMessage("Could not sign in. Check browser storage and open the project through its web server.");
      console.error("Login failed:", error);
    } finally {
      submit.disabled = false;
    }
  });
}
