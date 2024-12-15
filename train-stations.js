document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('train-stations-container');
  
    // Fetch train station paths from the server
    fetch('http://localhost:3000/train-stations')
      .then(response => response.json())
      .then(data => {
        if (data.length === 0) {
          container.innerHTML = '<p>No train station paths available.</p>';
          return;
        }
  
        data.forEach(train => {
          // Create a section for each train
          const section = document.createElement('div');
          section.className = 'train-section';
  
          // Add train name
          const heading = document.createElement('h2');
          heading.textContent = `${train.train_name} Train`;
          section.appendChild(heading);
  
          // Create the table
          const table = document.createElement('table');
          table.innerHTML = `
            <thead>
              <tr>
                <th>Departure Station</th>
                <th>Middle Station</th>
                <th>Destination Station</th>
                <th>Number of Miles</th>
              </tr>
            </thead>
            <tbody>
              ${train.paths.map(path => `
                <tr>
                  <td>${path.departure_station}</td>
                  <td>${path.middle_station || 'N/A'}</td>
                  <td>${path.destination_station}</td>
                  <td>${path.number_of_miles}</td>
                </tr>
              `).join('')}
            </tbody>
          `;
          section.appendChild(table);
  
          container.appendChild(section);
        });
      })
      .catch(error => {
        console.error('Error fetching train station paths:', error);
        container.innerHTML = '<p>Failed to load train station paths. Please try again later.</p>';
      });
  });
  