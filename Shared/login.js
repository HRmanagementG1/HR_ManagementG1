// Simple browser-only login for this project.
const employeesUrl = new URL('../data/employees.json', import.meta.url);

async function loadLoginEmployees() {
  let savedEmployees = null;
  try {
    savedEmployees = JSON.parse(localStorage.getItem('site_users'));
  } catch (error) {
    // Replace an old or invalid saved employee list with the JSON file.
  }

  const hasLoginDetails = Array.isArray(savedEmployees) && savedEmployees.length > 0
    && savedEmployees.every(employee => employee && typeof employee.email === 'string'
      && typeof employee.password === 'string' && typeof employee.role === 'string');

  if (!hasLoginDetails) {
    const response = await fetch(employeesUrl);
    if (!response.ok) throw new Error('Could not load employees.json. Please refresh and try again.');
    const employees = await response.json();
    if (!Array.isArray(employees) || !employees.length) {
      throw new Error('The employee file is empty or invalid.');
    }
    localStorage.setItem('site_users', JSON.stringify(employees.map(employee => ({
      ...employee,
      name: employee.name || employee.username
    }))));
  }

  // Login always checks the copy in local storage.
  return JSON.parse(localStorage.getItem('site_users'));
}

export function setupLogin({ role, usernameId, destination }) {
  const form = document.getElementById('loginForm');
  const username = document.getElementById(usernameId);
  const password = document.getElementById('password');
  const toggle = document.getElementById('togglePassword');
  const message = document.getElementById('login-message');
  const submit = form.querySelector('button[type="submit"]');

  function showMessage(text) {
    message.textContent = text;
    message.hidden = !text;
  }

  toggle.addEventListener('click', () => {
    const showPassword = password.type === 'password';
    password.type = showPassword ? 'text' : 'password';
    toggle.textContent = showPassword ? 'Hide' : 'Show';
    toggle.setAttribute('aria-pressed', String(showPassword));
  });

  // Start loading when the form opens. A failed load can be retried on submit.
  let employeesReady = loadLoginEmployees().catch(error => {
    showMessage(error.message);
    return null;
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    submit.disabled = true;
    showMessage('');

    try {
      if (!await employeesReady) employeesReady = loadLoginEmployees();
      await employeesReady;
      const employees = JSON.parse(localStorage.getItem('site_users'));
      const enteredUsername = username.value.trim().toLowerCase();
      const employee = employees.find(person => {
        const matchesUsername = [person.username, person.name, person.email]
          .some(value => typeof value === 'string' && value.toLowerCase() === enteredUsername);
        return matchesUsername && person.password === password.value;
      });

      if (!employee) {
        showMessage('Incorrect username, email, or password. Please try again.');
        return;
      }
      if (employee.role.toLowerCase() !== role.toLowerCase()) {
        showMessage(`This account cannot use the ${role} login. Please use the ${employee.role} login page.`);
        return;
      }

      // Keep the password out of the logged-in user's session.
      const { password: savedPassword, ...session } = employee;
      session.name = employee.name || employee.username;
      localStorage.setItem('site_session', JSON.stringify(session));
      localStorage.removeItem('loggedInUser');
      window.location.href = new URL(destination, employeesUrl).href;
    } catch (error) {
      employeesReady = Promise.resolve(null);
      showMessage('Could not sign in. Check that browser storage is enabled and open the project through its web server.');
      console.error('Login failed:', error);
    } finally {
      submit.disabled = false;
    }
  });
}
