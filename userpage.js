// Retrieve the email from query parameters or localStorage
const params = new URLSearchParams(window.location.search);
const email = params.get('email') || localStorage.getItem('email') || "User";
const name2 = params.get('name') || localStorage.getItem('name') || "User";

// Function to fetch loyalty class and miles
async function fetchLoyaltyInfo(email) {
  try {
    const response = await fetch(`http://localhost:3000/get-loyalty-info?email=${email}`);
    if (!response.ok) {
      throw new Error("Failed to fetch loyalty info.");
    }

    const result = await response.json();
    if (result.success) {
      // Update the welcome message with loyalty details
      document.getElementById('welcome-message').innerText = `Welcome, ${name2}`;
      const loyaltyDetails = `
        <p>Loyalty Class: <strong>${result.loyalty_class || "None"}</strong></p>
        <p>Total Miles Traveled: <strong>${result.miles_traveled || 0}</strong></p>
      `;
      document.getElementById('loyalty-info').innerHTML = loyaltyDetails;
    } else {
      console.error('Error:', result.message);
    }
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
  }
}

// Call the function to fetch and display loyalty details
if (email && email !== "User") {
  fetchLoyaltyInfo(email);
}

// Display the welcome message
document.getElementById('welcome-message').innerText = `Welcome, ${name2}`;

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
  window.location.href = "/app.html";
}
