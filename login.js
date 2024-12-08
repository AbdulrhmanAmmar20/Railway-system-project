const navbarMenu = document.querySelector(".navbar .links");
const hamburgerBtn = document.querySelector(".hamburger-btn");
const hideMenuBtn = navbarMenu.querySelector(".close-btn");
const showPopupBtn = document.querySelector(".login-btn");
const formPopup = document.querySelector(".form-popup");
const hidePopupBtn = formPopup.querySelector(".close-btn");
const signupLoginLink = formPopup.querySelectorAll(".bottom-link a");

// Show mobile menu
hamburgerBtn.addEventListener("click", () => {
    navbarMenu.classList.toggle("show-menu");
});

// Hide mobile menu
hideMenuBtn.addEventListener("click", () =>  hamburgerBtn.click());

// Show login popup
showPopupBtn.addEventListener("click", () => {
    document.body.classList.toggle("show-popup");
});

// Hide login popup
hidePopupBtn.addEventListener("click", () => showPopupBtn.click());

// Show or hide signup form
signupLoginLink.forEach(link => {
    link.addEventListener("click", (e) => {
        e.preventDefault();
        formPopup.classList[link.id === 'signup-link' ? 'add' : 'remove']("show-signup");
    });
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission
  
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
  
    try {
      // Send a POST request to the server to validate the username and password
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
  
      const result = await response.json();
  
      if (result.success) {
        // If the login is successful, redirect to userpage.html
        window.location.href = `/userpage.html?username=${encodeURIComponent(username)}`;
    } else {
        // Show an alert if the login fails
        alert(result.message);
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('An error occurred. Please try again.');
    }
  });
  