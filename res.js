// Get query parameters
const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get('city');
const destination = urlParams.get('destination');

// Use the parameters
document.getElementById('trip-info').innerHTML = `
    <h2>Booking for: ${city} ➡️ ${destination}</h2>
`;
