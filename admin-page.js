// Retrieve the email from query parameters or localStorage
const params = new URLSearchParams(window.location.search);
const email = params.get('email') || localStorage.getItem('email') || "User";
const name2 = params.get('name') || localStorage.getItem('name') || "User";


// Display the welcome message
document.getElementById('welcome-message').innerText = Welcome, ${name2};

// Update all service links with the user's email
document.querySelectorAll('.service-card a').forEach(link => {
  if (email) {
    const url = new URL(link.href, window.location.origin);
    url.searchParams.set('email', email); // Add email to query params
    link.href = url.toString();
  }
});

// Logout function
function logout() {
  // Clear the email from localStorage
  localStorage.removeItem('email');
  // Redirect to login page
  window.location.href = "/app.html";
}
