document.addEventListener('DOMContentLoaded', () => {
  const trainSelect = document.getElementById('trainSelect');
  const loyaltyContainer = document.getElementById('loyalty-container');

  // Fetch available trains and populate dropdown
  fetch('http://localhost:3000/available-trains')
    .then(response => response.json())
    .then(data => {
      data.forEach(train => {
        const option = document.createElement('option');
        option.value = train.train_id;
        option.textContent = `${train.english_name} (${train.arabic_name})`;
        trainSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error fetching trains:', error);
      loyaltyContainer.innerHTML = '<p>Failed to load available trains. Please try again later.</p>';
    });
});

// Load loyalty waitlist for the selected train
function loadLoyaltyWaitlist() {
  const trainSelect = document.getElementById('trainSelect');
  const loyaltyContainer = document.getElementById('loyalty-container');
  const trainNumber = trainSelect.value;

  if (!trainNumber) {
    alert('Please select a train.');
    return;
  }

  loyaltyContainer.innerHTML = ''; // Clear previous results

  fetch(`http://localhost:3000/loyalty-waitlist?trainNumber=${trainNumber}`)
    .then(response => response.json())
    .then(data => {
      if (Object.keys(data).length === 0) {
        loyaltyContainer.innerHTML = '<p>No waitlisted passengers found for this train.</p>';
        return;
      }

      Object.keys(data).forEach(classType => {
        const section = document.createElement('div');
        section.className = 'class-section';

        const heading = document.createElement('h2');
        heading.textContent = `${classType.charAt(0).toUpperCase() + classType.slice(1)} Class`;
        section.appendChild(heading);

        const table = document.createElement('table');
        table.innerHTML = `
          <thead>
            <tr>
              <th>Passenger Name</th>
              <th>Loyalty Class</th>
              <th>Email</th>
              <th>Number of Seats</th>
              <th>Booking Status</th>
            </tr>
          </thead>
          <tbody>
            ${data[classType].map(passenger => `
              <tr>
                <td>${passenger.name}</td>
                <td>${passenger.loyalty_class}</td>
                <td>${passenger.email}</td>
                <td>${passenger.number_of_seats}</td>
                <td>${passenger.booking_status}</td>
              </tr>
            `).join('')}
          </tbody>
        `;
        section.appendChild(table);

        loyaltyContainer.appendChild(section);
      });
    })
    .catch(error => {
      console.error('Error fetching loyalty waitlist:', error);
      loyaltyContainer.innerHTML = '<p>Failed to load loyalty waitlist. Please try again later.</p>';
    });
}
