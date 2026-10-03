// Shared login code for employee and HR pages.
const employeeFile = new URL("../data/employees.json", document.currentScript.src);

async function getEmployees() {
  const response = await fetch(employeeFile);
  if (!response.ok) {
    throw new Error("Could not load employee data.");
  }

  const employeesFromFile = await response.json();
  let savedEmployees = [];

  try {
    savedEmployees = JSON.parse(localStorage.getItem("site_users")) || [];
  } catch (error) {
    savedEmployees = [];
  }

  try {
    const oldEmployees = JSON.parse(localStorage.getItem("employees")) || [];
    oldEmployees.forEach(function (employee) {
      const alreadySaved = savedEmployees.some(function (saved) {
        return String(saved.id) === String(employee.id);
      });
      if (!alreadySaved) savedEmployees.push(employee);
    });
  } catch (error) {
    // Continue with the current employee list if older saved data is unreadable.
  }

  const employees = [];

  employeesFromFile.forEach(function (employee) {
    const savedEmployee = savedEmployees.find(function (saved) {
      return String(saved.id) === String(employee.id);
    });

    if (savedEmployee) {
      employees.push(savedEmployee);
    } else {
      employees.push(employee);
    }
  });

  savedEmployees.forEach(function (employee) {
    const alreadyAdded = employees.some(function (saved) {
      return String(saved.id) === String(employee.id);
    });

    if (!alreadyAdded) {
      employees.push(employee);
    }
  });

  localStorage.setItem("site_users", JSON.stringify(employees));
  return employees;
}

function setupLogin(role, usernameId, destination) {
  const form = document.getElementById("loginForm");
  const username = document.getElementById(usernameId);
  const password = document.getElementById("password");
  const toggle = document.getElementById("togglePassword");
  const message = document.getElementById("login-message");
  const submitButton = form.querySelector("button[type='submit']");

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
      let foundEmployee = null;

      for (let i = 0; i < employees.length; i++) {
        const employee = employees[i];
        const usernameValue = (employee.username || "").toLowerCase();
        const employeeName = (employee.name || "").toLowerCase();
        const email = (employee.email || "").toLowerCase();

        if ((enteredName === usernameValue || enteredName === employeeName || enteredName === email) && employee.password === password.value) {
          foundEmployee = employee;
          break;
        }
      }

      if (foundEmployee === null) {
        message.textContent = "Email, username, or password is incorrect.";
        message.hidden = false;
        return;
      }

      const employeeRole = String(foundEmployee.role || "Employee").toLowerCase();
      if (employeeRole !== role.toLowerCase()) {
        message.textContent = "Please use the correct login page for your account.";
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
