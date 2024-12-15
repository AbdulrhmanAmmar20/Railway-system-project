document.addEventListener('DOMContentLoaded', async () => {
    const trip_id = localStorage.getItem('trip_id');
    const email = localStorage.getItem('email');
    console.log('Fetching total price for trip_id:', trip_id);

    try {
        const response = await fetch(`http://localhost:3000/get-total-price?trip_id=${trip_id}&email=${email}`);
        const result = await response.json();

        if (response.ok && result.success) {
            const totalPrice = result.total_price;
            document.getElementById('total-price').textContent = `${totalPrice} SR`;
        } else {
            document.getElementById('total-price').textContent = 'Error fetching price';
        }
    } catch (error) {
        console.error('Error in Fetch Request:', error);
        document.getElementById('total-price').textContent = 'Error fetching price';
    }
});

document.getElementById('payment-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const cardholderName = document.getElementById('cardholder-name').value;
    const cardNumber = document.getElementById('card-number').value;
    const cardType = document.getElementById('card-type').value;
    const expDate = document.getElementById('exp-date').value;
    const cvv = document.getElementById('cvv').value;

    const email = localStorage.getItem('email');
    const tripDate = localStorage.getItem('tripDate');
    const trip_id = localStorage.getItem('trip_id');

    const paymentDueDate = new Date(tripDate);
    paymentDueDate.setDate(paymentDueDate.getDate() - 1);

    const paymentStatus = new Date() > paymentDueDate ? 'Pending' : 'Completed';
    const paymentDate = paymentStatus === 'Completed' ? new Date().toISOString().split('T')[0] : paymentDueDate.toISOString().split('T')[0];

    const payload = {
        email,
        trip_id,
        payment_due: paymentDueDate.toISOString().split('T')[0],
        credit_card_no: cardNumber,
        payment_status: paymentStatus,
        payment_date: paymentDate,
    };

    console.log('Payment Payload:', payload);

    try {
        const response = await fetch('http://localhost:3000/process-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert('Payment successful!');
            await displayTickets(trip_id, email);
        } else {
            alert(`Payment failed: ${result.message}`);
        }
    } catch (error) {
        console.error('Error processing payment:', error);
        alert('An error occurred while processing your payment.');
    }
});



async function displayTickets(trip_id, email) {
    try {
        // Fetch ticket data from the server
        const response = await fetch(`http://localhost:3000/get-tickets?trip_id=${trip_id}&email=${email}`);
        const result = await response.json();

        if (!result.success) {
            alert(result.message || 'Failed to fetch tickets.');
            return;
        }

        const { booking, dependents } = result;

        // Ensure the .card container exists
        const cardElement = document.querySelector('.card');
        if (!cardElement) {
            console.error('Card container not found.');
            return;
        }

        // Clear content and prepare the tickets section
        cardElement.innerHTML = `<h1>Tickets</h1>`;
        const cardWrap = document.createElement('div');
        cardElement.appendChild(cardWrap);

        // Generate ticket for the main user
        let ticketData = "";
        const mainUserCard = generateTicketCard(
            booking.email,
            booking.train_name,
            booking.seat_no,
            booking.trip_date,
            booking.departure,
            booking.arrival
        );
        ticketData += generateTicketText(booking.email, booking.train_name, booking.seat_no, booking.trip_date, booking.departure, booking.arrival);
        cardWrap.appendChild(mainUserCard);

        // Generate tickets for dependents
        if (dependents && dependents.length > 0) {
            dependents.forEach((dependent) => {
                const dependentCard = generateTicketCard(
                    dependent.name,
                    booking.train_name,
                    dependent.seat_no,
                    booking.trip_date,
                    booking.departure,
                    booking.arrival
                );
                ticketData += generateTicketText(dependent.name, booking.train_name, dependent.seat_no, booking.trip_date, booking.departure, booking.arrival);
                cardWrap.appendChild(dependentCard);
            });
        }

        // Add download link
        addDownloadLink(ticketData);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        alert('Failed to fetch ticket details. Please try again.');
    }
}









function generateTicketCard(name, train, seat, time, departure, arrival) {
    const ticketCard = document.createElement('div');
    ticketCard.classList.add('ticket-card'); // Add the class here
    ticketCard.innerHTML = `
        <div>${departure} ➡ ${arrival}</div>
        <div>
            <h3>${name || "Passenger Name"}</h3>
        </div>
        <div>
            <h3>${train}</h3>
            <span>Train</span>
        </div>
        <div>
            <h3>${new Date(time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            })}</h3>
            <span>Time</span>
        </div>
        <div>
            <div id="seat">Seat: ${seat || 'Not Assigned'}</div>
        </div>


         
            <section class="custom-kontakt">
            <div class="barcode-box">
                <div class="barcode-stripes"><span class="stripe-1"></span><span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="stripe-3"></span><span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="stripe-1"></span> <span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-2"></span><span class="stripe-3"></span><span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-1"></span> <span class="stripe-3"></span><span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="stripe-3"></span> <span class="stripe-2"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="stripe-1"></span><span class="sig1">20</span><span class="sig2">10</span><span class="sig3">-</span><span class="sig4">20</span><span class="sig5">17</span> <span class="sig6">SE</span> <span class="sig7">DE</span><span class="sig8">SI</span><span class="sig9">GN</span></div>
            </div>
            </section>
        

    `;
    return ticketCard;
}




// Generate text representation of a ticket
function generateTicketText(name, train, seat, time, departure, arrival) {
    return `
Ticket for: ${name || "Passenger Name"}
Train: ${train}
Departure: ${departure}
Arrival: ${arrival}
Time: ${new Date(time).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    })}
Seat: ${seat || "Not Assigned"}

-----------------------------------------
`;
}

// Add download link for tickets
function addDownloadLink(ticketData) {
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(new Blob([ticketData], { type: "text/plain" }));
    downloadLink.download = "tickets.txt";
    downloadLink.textContent = "Download Tickets";
    downloadLink.style.display = "block";
    downloadLink.style.margin = "20px auto";
    downloadLink.style.textAlign = "center";
    downloadLink.style.fontSize = "16px";
    downloadLink.style.color = "#fff";
    downloadLink.style.backgroundColor = "#441752";
    downloadLink.style.padding = "10px 20px";
    downloadLink.style.borderRadius = "5px";
    downloadLink.style.textDecoration = "none";

    const cardElement = document.querySelector('.card');
    if (cardElement) {
        cardElement.appendChild(downloadLink);
    }
}



// Logout function to redirect to app.html
function logout() {
    // Clear local storage or session data if needed
    localStorage.clear(); // Clear all stored data
    sessionStorage.clear(); // Clear session storage (if used)

    // Redirect to app.html
    window.location.href = 'app.html';
}



