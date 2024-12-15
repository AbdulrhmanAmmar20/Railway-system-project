function loadDependents() {
  const dateInput = document.getElementById('dateInput');
  const dependentsContainer = document.getElementById('dependents-container');
  const selectedDate = dateInput.value;

  if (!selectedDate) {
    alert('Please select a date.');
    return;
  }

  // Clear the container and show loading message
  dependentsContainer.innerHTML = '<p>Loading dependents...</p>';

  // Fetch dependents for the selected date
  fetch(`http://localhost:3000/dependents?date=${selectedDate}`)
    .then(response => {
      console.log(`Response Status: ${response.status}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Fetched Dependents:', data); // Log the API response
      dependentsContainer.innerHTML = ''; // Clear loading message

      // If no dependents found
      if (data.length === 0) {
        dependentsContainer.innerHTML = '<p>No dependents found for the selected date.</p>';
        return;
      }

      // Group dependents by train name
      const groupedData = data.reduce((groups, dependent) => {
        const trainKey = `${dependent.train_name} - ${dependent.train_name_arabic}`;
        if (!groups[trainKey]) {
          groups[trainKey] = [];
        }
        groups[trainKey].push(dependent);
        return groups;
      }, {});

      // Render sections for each train
      Object.keys(groupedData).forEach(trainKey => {
        const section = document.createElement('div');
        section.className = 'dependent-section';

        // Add train name (English and Arabic)
        const trainHeader = `<h3>${trainKey}</h3>`;
        section.innerHTML = trainHeader;

        // Create table for dependents
        const table = document.createElement('table');
        table.innerHTML = `
          <thead>
            <tr>
              <th>Passenger Name</th>
              <th>Dependent Name</th>
              <th>Relationship</th>
              <th>Trip</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            ${groupedData[trainKey]
              .map(
                dependent => `
              <tr>
                <td>${dependent.passenger_name || 'N/A'}</td>
                <td>${dependent.dependent_name || 'N/A'}</td>
                <td>${dependent.relationship || 'N/A'}</td>
                <td>${dependent.departure_station || 'N/A'} ➡️ ${dependent.middle_station || "N/A"} ➡️ ${dependent.destination_station || 'N/A'}</td>
                <td>${Number(dependent.price).toFixed(2)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        `;
        section.appendChild(table);

        dependentsContainer.appendChild(section);
      });
    })
    .catch(error => {
      console.error('Error fetching dependents:', error); // Log any fetch errors
      dependentsContainer.innerHTML = '<p>Failed to load data. Please try again later.</p>';
    });
}
