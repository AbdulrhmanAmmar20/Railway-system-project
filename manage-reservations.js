const apiBase = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", fetchReservations);

async function fetchReservations() {
  try {
    const response = await fetch(`${apiBase}/reservations`);
    const data = await response.json();

    if (data.success) {
      const tableBody = document.querySelector("#reservations-table tbody");
      tableBody.innerHTML = "";

      data.data.forEach((reservation) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${reservation.booking_id}</td>
          <td>${reservation.email}</td>
          <td>${reservation.trip_id}</td>
          <td>${reservation.class_type}</td>
          <td>${reservation.total_price}</td>
          <td>${reservation.luggage_weight}</td>
          <td>${reservation.no_of_luggage}</td>
          <td>${reservation.seat_no}</td>
          <td>${reservation.booking_status}</td>
          <td>
            <button onclick="loadEditForm(${reservation.booking_id})">Edit</button>
            <button onclick="cancelReservation(${reservation.booking_id})">Cancel</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }
  } catch (error) {
    console.error("Error fetching reservations:", error);
  }
}

function showSection(section) {
  document.getElementById("add-form").classList.add("hidden");
  document.getElementById("edit-form").classList.add("hidden");

  if (section === "add") document.getElementById("add-form").classList.remove("hidden");
  if (section === "edit") document.getElementById("edit-form").classList.remove("hidden");
}

async function loadEditForm(bookingId) {
  try {
    const response = await fetch(`${apiBase}/reservations/${bookingId}`);
    const data = await response.json();

    if (data.success) {
      const reservation = data.data;

      document.getElementById("edit-email").value = reservation.email;
      document.getElementById("edit-trip-id").value = reservation.trip_id;
      document.getElementById("edit-class-type").value = reservation.class_type;
      document.getElementById("edit-total-price").value = reservation.total_price;
      document.getElementById("edit-luggage-weight").value = reservation.luggage_weight;
      document.getElementById("edit-no-of-luggage").value = reservation.no_of_luggage;
      document.getElementById("edit-seat-no").value = reservation.seat_no;
      document.getElementById("edit-booking-status").value = reservation.booking_status;

      showSection("edit");

      document.getElementById("edit-form").onsubmit = async function (e) {
        e.preventDefault();

        const updatedDetails = {
          email: document.getElementById("edit-email").value,
          trip_id: document.getElementById("edit-trip-id").value,
          class_type: document.getElementById("edit-class-type").value,
          total_price: document.getElementById("edit-total-price").value,
          luggage_weight: document.getElementById("edit-luggage-weight").value,
          no_of_luggage: document.getElementById("edit-no-of-luggage").value,
          seat_no: document.getElementById("edit-seat-no").value,
          booking_status: document.getElementById("edit-booking-status").value,
        };

        try {
          const updateResponse = await fetch(`${apiBase}/reservations/edit/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedDetails),
          });

          const updateData = await updateResponse.json();

          if (updateData.success) {
            alert("Reservation updated successfully.");
            fetchReservations();
            showSection(""); // Hide form
          } else {
            alert("Failed to update reservation.");
          }
        } catch (error) {
          console.error("Error updating reservation:", error);
        }
      };
    }
  } catch (error) {
    console.error("Error loading edit form:", error);
  }
}

async function cancelReservation(bookingId) {
  if (confirm("Are you sure you want to cancel this reservation?")) {
    try {
      const response = await fetch(`${apiBase}/reservations/cancel/${bookingId}`, { method: "PUT" });
      const data = await response.json();

      if (data.success) {
        alert("Reservation canceled successfully.");
        fetchReservations();
      } else {
        alert("Failed to cancel reservation.");
      }
    } catch (error) {
      console.error("Error canceling reservation:", error);
    }
  }
}

document.getElementById("add-form").onsubmit = async function (e) {
  e.preventDefault();

  const newReservation = {
    email: document.getElementById("add-email").value,
    trip_id: document.getElementById("add-trip-id").value,
    class_type: document.getElementById("add-class-type").value,
    total_price: document.getElementById("add-total-price").value,
    luggage_weight: document.getElementById("add-luggage-weight").value,
    no_of_luggage: document.getElementById("add-no-of-luggage").value,
    seat_no: document.getElementById("add-seat-no").value,
    booking_status: document.getElementById("add-booking-status").value,
  };

  try {
    const response = await fetch(`${apiBase}/reservations/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newReservation),
    });

    const data = await response.json();

    if (data.success) {
      alert("Reservation added successfully.");
      fetchReservations();
      showSection(""); // Hide form
    } else {
      alert("Failed to add reservation.");
    }
  } catch (error) {
    console.error("Error adding reservation:", error);
  }
};
