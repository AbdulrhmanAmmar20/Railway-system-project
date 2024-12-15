// Get query parameters
const urlParams = new URLSearchParams(window.location.search);
console.log(urlParams);
const city = urlParams.get('departure');
const destination = urlParams.get('arrival');
const adultCount = parseInt(urlParams.get('adult') || 1); // Default to 1 adult
const childCount = parseInt(urlParams.get('child') || 0);
const infantCount = parseInt(urlParams.get('infant') || 0);

// Populate trip info
document.getElementById('trip-info').innerHTML = `<h2>${city} → ${destination}</h2>`;

// Dynamically add dependents fields
function createDependentFields(type, count) {
    const passengerInfo = document.getElementById('passenger-info');
    for (let i = 1; i <= count; i++) {
        const dependentDiv = document.createElement('div');
        dependentDiv.classList.add('dependent-section');
        dependentDiv.innerHTML = `
            <h3>${type} ${i}</h3>
            <label for="${type.toLowerCase()}-name-${i}">Full Name:</label>
            <input type="text" id="${type.toLowerCase()}-name-${i}" name="${type.toLowerCase()}-name-${i}" placeholder="Enter name" required>

            <label for="${type.toLowerCase()}-relationship-${i}">Relationship:</label>
            <select id="${type.toLowerCase()}-relationship-${i}" name="${type.toLowerCase()}-relationship-${i}" required>
                <option value="Child">Child</option>
                <option value="Spouse">Spouse</option>
                <option value="Other">Other</option>
            </select>

            <label for="${type.toLowerCase()}-luggage-weight-${i}">Luggage Weight (kg):</label>
            <input type="number" id="${type.toLowerCase()}-luggage-weight-${i}" name="${type.toLowerCase()}-luggage-weight-${i}" placeholder="Enter weight (kg)" step="0.01" min="0">

            <label for="${type.toLowerCase()}-no-of-luggage-${i}">Number of Luggage:</label>
            <input type="number" id="${type.toLowerCase()}-no-of-luggage-${i}" name="${type.toLowerCase()}-no-of-luggage-${i}" placeholder="Enter number of luggage" min="0">
        `;
        passengerInfo.appendChild(dependentDiv);
    }
}

// Add dependents dynamically
createDependentFields('Adult', adultCount - 1); // Exclude the main user from adults
createDependentFields('Child', childCount);
createDependentFields('Infant', infantCount);


/*------------- after reservation --------------*/
document.getElementById('reservation-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const buttonId = e.submitter.id; // Identify which button was clicked

    // Extract main user data
    const mainUser = {
        name: document.getElementById('main-user-name').value,
        class_type: document.getElementById('class_type').value,
        luggage_weight: parseFloat(document.getElementById('main-user-luggage-weight').value) || 0,
        no_of_luggage: parseInt(document.getElementById('main-user-no-of-luggage').value) || 0,
    };

    // Extract dependents data
    const dependents = [];
    document.querySelectorAll('.dependent-section').forEach((section) => {
        const name = section.querySelector('input[id*="name"]').value;
        const relationship = section.querySelector('select[id*="relationship"]').value;
        const luggageWeight = parseFloat(section.querySelector('input[id*="luggage-weight"]').value) || 0;
        const noOfLuggage = parseInt(section.querySelector('input[id*="no-of-luggage"]').value) || 0;

        dependents.push({ name, relationship, luggage_weight: luggageWeight, no_of_luggage: noOfLuggage });
    });

    const urlParams = new URLSearchParams(window.location.search);
    const trip_id = parseInt(urlParams.get('trip_id'));

    if (!trip_id || !localStorage.getItem('email')) {
        alert('Invalid booking information. Please try again.');
        return;
    }

    const payload = {
        email: localStorage.getItem('email'),
        trip_id,
        main_user: mainUser,
        dependents,
        booking_status: 'Reserved',
        booking_date: new Date().toISOString().split('T')[0],
        number_of_seats: 1 + (dependents ? dependents.length : 0),
    };

    console.log('Payload:', payload);

    try {
        const response = await fetch('http://localhost:3000/add-booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (result.success) {
            alert('Booking successful!');
            if (buttonId === 'pay-now') {
                window.location.href = 'payment.html';
            } else if (buttonId === 'pay-later') {
                window.location.href = 'userpage.html';
            }
        } else {
            alert(`Booking failed: ${result.message}`);
        }
    } catch (error) {
        console.error('Error processing booking:', error);
        alert('An error occurred. Please try again.');
    }
});
