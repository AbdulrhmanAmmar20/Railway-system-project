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
        const response = await fetch('http://localhost:3000/data');
        if (!response.ok) {
            throw new Error(`Error fetching trips: ${response.statusText}`);
        }

        const trips = await response.json();
        console.log("API Response:", trips);

        // Filter trips based on search criteria
        const filteredTrips = trips.filter(trip => {
            const matchesDeparture = leavingFrom
                ? trip.departure?.trim().toLowerCase() === leavingFrom.trim().toLowerCase()
                : true;
            const matchesDestination = goingTo
                ? trip.arrival?.trim().toLowerCase() === goingTo.trim().toLowerCase()
                : true;
            const matchesDate = departureDate
                ? new Date(trip.trip_date).toISOString().split('T')[0] === departureDate
                : true;

            console.log(`Trip: ${trip.departure} ➡️ ${trip.arrival}`);
            console.log("Matches Departure:", matchesDeparture);
            console.log("Matches Destination:", matchesDestination);
            console.log("Matches Date:", matchesDate);

            return matchesDeparture && matchesDestination && matchesDate;
        });

        if (filteredTrips.length === 0) {
            outputList.innerHTML = '<p>No trips found.</p>';
        } else {
            filteredTrips.forEach(trip => {
                const departureDateFormatted = new Date(trip.trip_date).toLocaleDateString();

                // Create a card for each filtered trip
                const tripCard = document.createElement('div');
                tripCard.classList.add('trip-card');
                tripCard.innerHTML = `
                    <div class="trip-details">
                        <h3>${trip.departure} ➡️ ${trip.arrival}</h3>
                        <p><strong>Departure Date:</strong> ${departureDateFormatted}</p>
                    </div>
                    <div class="action">
                        <a href="res.html?departure=${encodeURIComponent(trip.departure)}&arrival=${encodeURIComponent(trip.arrival)}">
                            <button>Book Now</button>
                        </a>
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
