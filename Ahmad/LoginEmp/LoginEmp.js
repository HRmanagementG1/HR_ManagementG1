 fetch('../../Deyaa/navbar_Home.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;
      })
      .catch(error => console.error('Error loading navbar:', error));
 
 document.addEventListener('DOMContentLoaded', () => {
      const togglePasswordBtn = document.getElementById('togglePassword');
      const passwordInput = document.getElementById('password');

      if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', function() {
          const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          this.textContent = type === 'password' ? 'Show' : 'Hide';
        });
      }

      // Prevent default form submission for preview purposes
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          console.log('Employee Login form submitted!');
        });
      }
    });