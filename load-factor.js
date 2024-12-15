function loadLoadFactors() {
    const dateInput = document.getElementById('dateInput');
    const loadFactorContainer = document.getElementById('load-factor-container');
    const selectedDate = dateInput.value;
  
    if (!selectedDate) {
      alert('Please select a date.');
      return;
    }
  
    loadFactorContainer.innerHTML = '<p>Loading load factors...</p>';
  
    fetch(`http://localhost:3000/load-factors?date=${selectedDate}`)
      .then(response => response.json())
      .then(data => {
        loadFactorContainer.innerHTML = ''; // Clear loading message
        if (data.length === 0) {
          loadFactorContainer.innerHTML = '<p>No data found for the selected date.</p>';
          return;
        }
  
        data.forEach(train => {
          // Calculate load factor percentage
          const loadFactor = ((train.occupied_seats / train.total_seats) * 100).toFixed(2);
  
          // Determine the color of the bar based on the load factor
          let barColor;
          if (loadFactor <= 50) {
            barColor = '#4CAF50'; // Green
          } else if (loadFactor <= 75) {
            barColor = '#FFC107'; // Yellow
          } else {
            barColor = '#F44336'; // Red
          }
  
          // Create the train section
          const section = document.createElement('div');
          section.className = 'train-section';
  
          // Trip details
          const tripDetails = `${train.departure_station} → ${
            train.middle_station || "N/A"
          } → ${train.destination_station}`;
  
          // Add train name, trip details, and load factor
          section.innerHTML = `
            <h3>${train.train_name} - ${train.train_name_arabic}</h3>
            <h4>${tripDetails}</h4>
            <p>Total Seats: ${train.total_seats}</p>
            <p>Occupied Seats: ${train.occupied_seats}</p>
            <p>Load Factor: ${loadFactor}%</p>
            <div class="capacity-bar">
              <div class="bar-fill" style="width: ${loadFactor}%; background-color: ${barColor};">${loadFactor}%</div>
            </div>
          `;
  
          loadFactorContainer.appendChild(section);
        });
      })
      .catch(error => {
        console.error('Error fetching load factors:', error);
        loadFactorContainer.innerHTML = '<p>Failed to load data. Please try again later.</p>';
      });
  }
  