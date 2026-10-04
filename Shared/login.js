// Shared login form: switch roles without leaving this page.
const loginRoot = new URL("../", document.currentScript.src);
async function getEmployees() {
  await window.workspace.ready;
  return window.workspace.users();
}

function setupLogin(role, usernameId, destination) {
  const form = document.getElementById("loginForm");
  const username = document.getElementById(usernameId);
  const password = document.getElementById("password");
  const toggle = document.getElementById("togglePassword");
  const message = document.getElementById("login-message");
  const submitButton = form.querySelector("button[type='submit']");

  function chooseRole(nextRole) {
    role = nextRole;
    destination = new URL(role === "HR" ? "Lujain/TaskHr/dashboard.html" : "Ala%60a/task/employee-profile/employee-profile.html", loginRoot).href;
    document.querySelectorAll("[data-login-role]").forEach(function(button) {
      button.setAttribute("aria-pressed", String(button.dataset.loginRole === role));
    });
    document.querySelector(".auth-eyebrow").textContent = role + " workspace";
    document.querySelector(".auth-intro").textContent = role === "HR"
      ? "Support your people and keep your team moving forward."
      : "Your tasks, your people, and the details that matter.";
    submitButton.textContent = role === "HR" ? "Sign in to HR →" : "Sign in to your workspace →";
    message.hidden = true;
    document.title = "Login | Wanderly";
  }
  document.querySelectorAll("[data-login-role]").forEach(function(button) {
    button.addEventListener("click", function() { chooseRole(this.dataset.loginRole); });
  });
  chooseRole(role);

  toggle.addEventListener("click", function () {
    if (password.type === "password") {
      password.type = "text";
      toggle.textContent = "Hide";
      toggle.setAttribute("aria-pressed", "true");
    } else {
      password.type = "password";
      toggle.textContent = "Show";
      toggle.setAttribute("aria-pressed", "false");
    }
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    message.hidden = true;

    if (!form.reportValidity()) {
      return;
    }

    submitButton.disabled = true;
    try {
      const employees = await getEmployees();
      const enteredName = username.value.trim().toLowerCase();
      const foundEmployee = employees.find(function (employee) {
        const usernameValue = (employee.username || "").toLowerCase();
        const employeeName = (employee.name || "").toLowerCase();
        const email = (employee.email || "").toLowerCase();

        if ((enteredName === usernameValue || enteredName === employeeName || enteredName === email) && employee.password === password.value) {
          return true;
        }
        return false;
      });

      if (!foundEmployee) {
        message.textContent = "Email, username, or password is incorrect.";
        message.hidden = false;
        return;
      }

      if (foundEmployee.blocked) {
        message.textContent = "Your account is blocked. Contact HR for help.";
        message.hidden = false;
        return;
      }

      const employeeRole = String(foundEmployee.role || "Employee").toLowerCase();
      if (employeeRole !== role.toLowerCase()) {
        message.textContent = "Choose " + (employeeRole === "hr" ? "HR login" : "Employee login") + " above to sign in with this account.";
        message.hidden = false;
        return;
      }

      const currentUser = {};
      Object.keys(foundEmployee).forEach(function (key) {
        if (key !== "password") currentUser[key] = foundEmployee[key];
      });
      currentUser.name = foundEmployee.name || foundEmployee.username;
      localStorage.setItem("site_session", JSON.stringify(currentUser));
      localStorage.removeItem("loggedInUser");
      location.href = new URL(destination, location.href).href;
    } catch (error) {
      message.textContent = "Could not load the employee file. Please open the project through a web server and try again.";
      message.hidden = false;
      console.error(error);
    } finally {
      submitButton.disabled = false;
    }
  });
}
