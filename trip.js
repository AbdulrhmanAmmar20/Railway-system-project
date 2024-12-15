document.querySelector('.search-button').addEventListener('click', async () => {
    const outputList = document.getElementById('output-list');
    outputList.innerHTML = ''; // Clear previous results

    // Get search criteria from input fields
    const leavingFrom = document.getElementById('leaving-from').value.trim();
    const goingTo = document.getElementById('going-to').value.trim();
    const departureDate = document.getElementById('departure-date').value;

    console.log("Leaving From:", leavingFrom);
    console.log("Going To:", goingTo);
    console.log("Departure Date:", departureDate);

    try {
        const response = await fetch('http://localhost:3000/data'); // API endpoint
        if (!response.ok) {
            throw new Error(`Error fetching trips: ${response.statusText}`);
        }

        const trips = await response.json();
        console.log("API Response:", trips);

        // Filter trips based on search criteria
        const filteredTrips = trips.filter(trip => {
            const matchesDeparture = leavingFrom
                ? trip.departure_city?.trim().toLowerCase() === leavingFrom.trim().toLowerCase()
                : true;
            const matchesDestination = goingTo
                ? trip.arrival_city?.trim().toLowerCase() === goingTo.trim().toLowerCase()
                : true;
            const tripDate = trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : null;
            const matchesDate = departureDate
                ? tripDate === departureDate
                : true;
        
            return matchesDeparture && matchesDestination && matchesDate;
        });
        
        if (filteredTrips.length === 0) {
            outputList.innerHTML = '<p>No trips found.</p>';
        } else {
            filteredTrips.forEach(trip => {
                const departureDateFormatted = new Date(trip.trip_date).toLocaleDateString();
                const departureTimeFormatted = trip.departure_time ? trip.departure_time.slice(0, 5) : "N/A";
                const arrivalTimeFormatted = trip.arrival_time ? trip.arrival_time.slice(0, 5) : "N/A";
                const middleStationHTML = trip.middle_station 
                    ? `<p><strong>Middle Station:</strong> ${trip.middle_station}</p>` 
                    : '';

        
                    const tripCard = document.createElement('div');
                    tripCard.classList.add('trip-card');
                    
                    tripCard.innerHTML = `
                        <div class="trip-details">
                            <h3>${trip.departure_city} → ${trip.arrival_city}</h3>
                            ${middleStationHTML}
                            <p><strong>Departure Date:</strong> ${departureDateFormatted}</p>
                            <p><strong>Departure Time:</strong> ${departureTimeFormatted}</p>
                            <p><strong>Arrival Time:</strong> ${arrivalTimeFormatted}</p>
                            <h4>25% discount for your family</h4>
                        </div>
                        <div class="action">
                             <h3 id="trip-price">${trip.price} SR</h3>

                            <button 
                                class="book-now-btn"
                                data-trip-id="${trip.trip_id}" 
                                data-departure="${trip.departure_city}" 
                                data-arrival="${trip.arrival_city}" 
                                data-date="${departureDateFormatted}">
                                Book Now
                            </button>
                        </div>
                    `;
                    outputList.appendChild(tripCard);
                    
            });
        }
        
    } catch (error) {
        console.error('Error fetching trips:', error);
        outputList.innerHTML = '<p>Error fetching trips. Please try again later.</p>';
    }
});

// Passenger count dropdown logic
document.getElementById('passenger-count').addEventListener('click', () => {
    const dropdown = document.querySelector('.passenger-dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
});

document.querySelectorAll('.increase, .decrease').forEach(button => {
    button.addEventListener('click', (e) => {
        const type = e.target.getAttribute('data-type');
        const countElement = document.getElementById(`${type}-count`);
        let count = parseInt(countElement.innerText);

        if (e.target.classList.contains('increase')) {
            count++;
        } else if (e.target.classList.contains('decrease') && count > 0) {
            count--;
        }

        countElement.innerText = count;
    });
});

document.getElementById('confirm-passenger-selection').addEventListener('click', () => {
    const adultCount = parseInt(document.getElementById('adult-count').innerText);
    const childCount = parseInt(document.getElementById('child-count').innerText);
    const infantCount = parseInt(document.getElementById('infant-count').innerText);

    const totalPassengers = adultCount + childCount + infantCount;
    const label = `${adultCount} Adult${adultCount > 1 ? 's' : ''}`;
    const childLabel = childCount > 0 ? `, ${childCount} Child${childCount > 1 ? 'ren' : ''}` : '';
    const infantLabel = infantCount > 0 ? `, ${infantCount} Infant${infantCount > 1 ? 's' : ''}` : '';

    document.getElementById('passenger-count').value = `${label}${childLabel}${infantLabel}`;

    // Hide the dropdown
    document.querySelector('.passenger-dropdown').style.display = 'none';
});

// Redirect to the reservation page on "Book Now" click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('book-now-btn')) {
        e.preventDefault(); // Prevent default behavior

        // Get trip and passenger data
        const button = e.target;
        const tripId = button.getAttribute('data-trip-id');
        const departure = button.getAttribute('data-departure');
        const arrival = button.getAttribute('data-arrival');
        const date = button.getAttribute('data-date');

        const adultCount = parseInt(document.getElementById('adult-count').innerText) || 0;
        const childCount = parseInt(document.getElementById('child-count').innerText) || 0;
        const infantCount = parseInt(document.getElementById('infant-count').innerText) || 0;

        // Store data in localStorage
        localStorage.setItem('trip_id', tripId);
        localStorage.setItem('trip_date', date);

        // Construct query parameters for the reservation page
        const reservationUrl = `res.html?trip_id=${encodeURIComponent(tripId)}&departure=${encodeURIComponent(departure)}&arrival=${encodeURIComponent(arrival)}&date=${encodeURIComponent(date)}&adult=${adultCount}&child=${childCount}&infant=${infantCount}`;

        // Redirect to reservation page
        window.location.href = reservationUrl;
    }
});
