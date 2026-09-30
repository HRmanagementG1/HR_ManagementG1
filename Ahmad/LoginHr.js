fetch('navbar_Home.html')
      .then(response => response.text())
      .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;
      })
      .catch(error => console.error('Error loading navbar:', error));


document.addEventListener('DOMContentLoaded', () => {
      const togglePasswordBtn = document.getElementById('togglePasswordBtn');
      const passwordInput = document.getElementById('password');

      // Toggle password visibility
      togglePasswordBtn.addEventListener('click', function() {
        // Check current type and toggle
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update the button text
        this.textContent = type === 'password' ? 'Show' : 'Hide';
      });

      // Prevent default form submission for demo purposes
      const loginForm = document.getElementById('loginForm');
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Login form submitted!');
        // authentication logic goes here
      });
    });