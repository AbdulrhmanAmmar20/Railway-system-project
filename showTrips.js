document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const email = params.get('email');

  document.getElementById('username-display').textContent = email;

  const tripsContainer = document.getElementById('trips-container');

  try {
    const response = await fetch(`http://localhost:3000/user-trips?email=${encodeURIComponent(email)}`);
    const data = await response.json();

    if (data.success) {
      data.trips.forEach(trip => {
        const tripCard = document.createElement('div');
        tripCard.classList.add('trip-card');
        tripCard.innerHTML = `
          <h3>${trip.departure} ➡️ ${trip.arrival}</h3>
          <p><strong>Date:</strong> ${new Date(trip.trip_date).toLocaleDateString()}</p>
          <p><strong>Booking Status:</strong> ${trip.booking_status}</p>
          <p><strong>Payment Status:</strong> ${trip.payment_status}</p>
          ${
            trip.payment_status === 'Unpaid'
              ? `<button class="pay-now-btn" onclick="redirectToPayment('${trip.booking_id}')">Pay Now</button>`
              : ''
          }
        `;
        tripsContainer.appendChild(tripCard);
      });
    } else {
      tripsContainer.innerHTML = `<p>${data.message}</p>`;
    }
  } catch (error) {
    console.error('Error fetching trips:', error);
    tripsContainer.innerHTML = '<p>Error fetching trips. Please try again later.</p>';
  }
});

// Redirect to the payment page with booking ID
function redirectToPayment(bookingId) {
  window.location.href = `/payment.html?booking_id=${bookingId}`;
}

// Logout function
function logout() {
  localStorage.removeItem('email');
  window.location.href = '/app.html';
}