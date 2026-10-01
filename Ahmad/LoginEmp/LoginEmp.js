import('../../Shared/login.js').then(({ setupLogin }) => {
  setupLogin({
    role: 'Employee',
    usernameId: 'username',
    destination: '../Ala%60a/task/employee-profile/employee-profile.html'
  });
}).catch(() => {
  const message = document.getElementById('login-message');
  message.hidden = false;
  message.textContent = 'Login could not load. Open the project through its web server and refresh.';
});
