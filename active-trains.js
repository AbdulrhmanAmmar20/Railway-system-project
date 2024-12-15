// active-trains.js

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('active-trains-table');
  
    try {
      // Fetch active trains data
      const response = await fetch('http://localhost:3000/active-trains');
      const activeTrains = await response.json();
  
      // Populate the table with active train data
      activeTrains.forEach(train => {
        const row = document.createElement('tr');
  
        row.innerHTML = `
          <td>${train.train_name}</td>
          <td>${train.departure_station}</td>
          <td>${train.arrival_station}</td>
          <td>${train.departure_time}</td>
          <td>${train.arrival_time}</td>
          <td>${train.trip_date}</td>

        `;
  
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching active trains:', error);
      tableBody.innerHTML = '<tr><td colspan="5">Failed to load active trains. Please try again later.</td></tr>';
    }
  });
  