import('../../Shared/login.js').then(({ setupLogin }) => {
  setupLogin({
    role: 'Employee',
    usernameId: 'username',
    destination: '../Wessam/employee_leave.html'
  });
}).catch(() => {
  const message = document.getElementById('login-message');
  message.hidden = false;
  message.textContent = 'Login could not load. Open the project through its web server and refresh.';
});
