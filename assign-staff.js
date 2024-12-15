document.addEventListener('DOMContentLoaded', () => {
  const trainDetailsTable = document.getElementById('train-details');
  const assignForm = document.getElementById('assign-staff-form');

  // Fetch and display train details
async function loadTrainDetails() {
  try {
    const response = await fetch('http://localhost:3000/train-details');
    const result = await response.json();

    if (result.success) {
      const tbody = document.querySelector('#train-details tbody');
      tbody.innerHTML = result.data.map(train => `
        <tr>
          <td>${train.train_id}</td>
          <td>${train.trip_id}</td>
          <td>${train.train_name || 'N/A'}</td>
          <td>${train.driver_name || 'Unassigned'}</td>
          <td>${train.engineer_name || 'Unassigned'}</td>
          <td>${train.trip_date || 'N/A'}</td>
        </tr>
      `).join('');
    } else {
      document.querySelector('#train-details tbody').innerHTML = '<tr><td colspan="6">No train details available</td></tr>';
    }
  } catch (error) {
    console.error('Error loading train details:', error);
    alert('Failed to load train details.');
  }
}

  // Assign staff to train
  document.getElementById('assign-staff-form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const tripId = document.getElementById('tripId').value;
    const staffName = document.getElementById('staffName').value;
    const staffType = document.getElementById('staffType').value;
    const date = document.getElementById('date').value;
  
    try {
      const response = await fetch('http://localhost:3000/assign-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trip_id: tripId, staff_name: staffName, role: staffType, trip_date: date }),
      });
  
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        loadTrainDetails();
        e.target.reset();
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error assigning staff:', error);
      alert('An error occurred while assigning staff.');
    }
  });  

  // Initial load
  loadTrainDetails();
});
