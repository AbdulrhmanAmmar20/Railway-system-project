// promote-passenger.js

document.addEventListener('DOMContentLoaded', async () => {
    const bookingContainer = document.getElementById('booking-container');
  
    try {
      // Fetch bookings data
      const response = await fetch('http://localhost:3000/waitlisted-bookings'); // Update this endpoint as necessary
      const bookings = await response.json();
  
      // Loop through each booking and create a card
      bookings.forEach(booking => {
        const card = document.createElement('div');
        card.className = 'booking-card';
      
        card.innerHTML = `
          <h3>Booking ID: ${booking.booking_id}</h3>
          <p>Passenger: ${booking.name}</p>
          <p>Departure: ${booking.departure_station}</p> <!-- Updated to show station name -->
          <p>Destination: ${booking.arrival_station}</p>
          <p>Class: ${booking.class_type}</p>
          <p>Status: ${booking.booking_status}</p>
          <button class = "promote-card" onclick="promoteBooking(${booking.booking_id})">Promote Now</button>
        `;
      
        bookingContainer.appendChild(card);
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      bookingContainer.innerHTML = '<p>Failed to load bookings. Please try again later.</p>';
    }
  });

  async function promoteBooking(bookingId) {
    try {
      const response = await fetch(`http://localhost:3000/promote-booking/${bookingId}`, {
        method: 'POST',
      });
  
      if (response.ok) {
        alert('Booking successfully promoted!');
        location.reload(); // Reload to fetch updated bookings
      } else {
        const errorMessage = await response.text();
        alert(`Failed to promote booking: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error promoting booking:', error);
      alert('An error occurred while promoting the booking.');
    }
  }
  
  