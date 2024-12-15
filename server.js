import express from 'express';
import pkg from 'pg'; // PostgreSQL module
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Client } = pkg;


// Initialize the Express app
const app = express();
const port = 3000;

// Middleware for CORS and JSON parsing
app.use(cors());
app.use(express.json());

// PostgreSQL Database Configuration
const client = new Client({
  user: 'postgres',
  password: '1234',
  host: 'localhost',
  port: 5432,
  database: 'users', // Database containing `users` and `trip` tables
});

// Connect to the database
client.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err.stack));



  /*------------------------ find the trips -----------------------*/

// API endpoint to get data from the `trip` table
app.get('/data', async (req, res) => {
  try {
      const query = `
          SELECT 
              t.trip_id,
              s1.city_location AS departure_city,
              s2.city_location AS arrival_city,
              t.trip_date,
              t.price,
              t.train_id,
              t.driver_id,
              t.engineer_id,
              COALESCE(ms.city_location, NULL) AS middle_station,
              t.departure_time,
              t.arrival_time
          FROM trip t
          INNER JOIN station s1 ON t.departure = s1.sequence_no
          INNER JOIN station s2 ON t.arrival = s2.sequence_no
          LEFT JOIN station ms ON t.middle_station = ms.sequence_no;
      `;
      const result = await client.query(query);
      res.json(result.rows);
  } catch (error) {
      console.error('Error retrieving trips:', error.stack);
      res.status(500).send('Error retrieving data');
  }
});



/*------------------- log in --------------------*/

// Login endpoint to check user credentials
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const query = 'SELECT * FROM passenger WHERE email = $1 AND password = $2';
    const result = await client.query(query, [email, password]);

    if (result.rows.length > 0) {
      const firstRow = result.rows[0]; // The tuple
      const name = firstRow.name; // Access the first attribute by name
      res.status(200).json({ success: true, message: 'Login successful', email, name});
    } 
    else {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error during login:', error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


/*------------------ find the user trips ----------------*/

app.get('/user-trips', async (req, res) => {
  const email = req.query.email;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const query = `
       SELECT 
        t.departure, 
        t.arrival, 
        t.trip_date, 
        b.booking_status, 
        CASE 
          WHEN p.booking_no IS NOT NULL THEN 'Paid' 
          ELSE 'Unpaid' 
        END AS payment_status
      FROM booking b
      INNER JOIN trip t ON b.trip_id = t.trip_id
      LEFT JOIN payment p ON b.booking_id = p.booking_no
      WHERE b.email = $1
    `;

    const result = await client.query(query, [email]);

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, trips: result.rows });
    } else {
      res.status(200).json({ success: false, message: 'No trips found for this user' });
    }
  } catch (error) {
    console.error('Error fetching user trips:', error.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
/////////////////// find the avaialble seats /////////////////////////////////

app.get('/get-available-seats', async (req, res) => {
  const { trip_id, class_type } = req.query;

  try {
    // Fetch the total seats for the class type from the train table
    const seatQuery = `
        SELECT tr.economy_seats_no, tr.business_seats_no
        FROM trip t
        INNER JOIN train tr ON t.train_id = tr.train_id
        WHERE t.trip_id = $1
    `;
    const seatResult = await client.query(seatQuery, [trip_id]);

    // Log the seatResult for debugging
    console.log('Seat Query Result:', seatResult.rows);

    if (seatResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Trip or train not found.' });
    }

    const row = seatResult.rows[0];

    // Determine total seats based on class type
    const totalSeats =
      class_type === 'economy'
        ? parseInt(row.economy_seats_no, 10)
        : parseInt(row.business_seats_no, 10);

    if (!totalSeats || totalSeats <= 0) {
      return res.status(500).json({
        success: false,
        message: `No seats available for class type: ${class_type}`,
      });
    }

    // Generate seat numbers (e.g., Seat 1, Seat 2, ...)
    const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);

    // Fetch already booked seats from both booking and dependent_booking tables
    const bookedSeatsQuery = `
        SELECT b.seat_no AS booked_seat
        FROM booking b
        WHERE b.trip_id = $1 AND b.class_type = $2
        UNION
        SELECT d.seat_no AS booked_seat
        FROM dependent_booking d
        INNER JOIN booking b ON d.booking_id = b.booking_id
        WHERE b.trip_id = $1 AND b.class_type = $2
    `;
    const bookedSeatsResult = await client.query(bookedSeatsQuery, [trip_id, class_type]);
    const bookedSeats = bookedSeatsResult.rows.map((row) => parseInt(row.booked_seat, 10));

    // Calculate available seats
    const availableSeats = allSeats.filter((seat) => !bookedSeats.includes(seat));

    res.status(200).json({ success: true, availableSeats });
  } catch (error) {
    console.error('Error fetching available seats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch available seats.' });
  }
});





app.post('/add-booking', async (req, res) => {
  const { email, trip_id, main_user, dependents, booking_status, booking_date } = req.body;

  console.log('Received payload:', req.body); // Log the full payload

  try {
      // Fetch train seat availability and trip details
      const seatQuery = `
          SELECT tr.economy_seats_no, tr.business_seats_no, t.number_of_miles
          FROM trip t
          INNER JOIN train tr ON t.train_id = tr.train_id
          WHERE t.trip_id = $1
      `;
      const seatResult = await client.query(seatQuery, [trip_id]);

      if (seatResult.rows.length === 0) {
          console.error('Invalid trip ID or train not found:', trip_id);
          return res.status(400).json({ success: false, message: 'Invalid trip ID or train not found' });
      }

      const { economy_seats_no, business_seats_no, number_of_miles } = seatResult.rows[0];

      // Fetch the trip price
      const tripQuery = 'SELECT price FROM trip WHERE trip_id = $1';
      const tripResult = await client.query(tripQuery, [trip_id]);

      if (tripResult.rows.length === 0) {
          console.error('Invalid trip ID:', trip_id);
          return res.status(400).json({ success: false, message: 'Invalid trip ID' });
      }

      let basePrice = parseFloat(tripResult.rows[0].price);
      if (!basePrice || basePrice <= 0) {
          console.error('Invalid trip price:', basePrice);
          return res.status(400).json({ success: false, message: 'Trip price is invalid or missing' });
      }

      // Fetch the passenger's loyalty class
      const loyaltyQuery = 'SELECT loyalty_class FROM passenger WHERE email = $1';
      const loyaltyResult = await client.query(loyaltyQuery, [email]);

      let discount = 0; // Default no discount for non-loyal passengers
      if (loyaltyResult.rows.length > 0) {
          const loyaltyClass = loyaltyResult.rows[0].loyalty_class;
          if (loyaltyClass === 'Silver') {
              discount = 0.25; // 25% discount for Silver
          } else if (loyaltyClass === 'Gold') {
              discount = 0.15; // 15% discount for Gold
          }
      }

      // Apply the discount to the base price
      basePrice = basePrice * (1 - discount);
      console.log(`Base price after ${discount * 100}% discount: ${basePrice}`);

      // Calculate total passengers (main user + dependents)
      const totalPassengers = 1 + (dependents ? dependents.length : 0);

      // Fetch already booked seats
      const bookedSeatsQuery = `
          SELECT seat_no
          FROM booking
          WHERE trip_id = $1 AND class_type = $2 AND booking_status != 'Canceled'
          UNION
          SELECT d.seat_no
          FROM dependent_booking d
          INNER JOIN booking b ON d.booking_id = b.booking_id
          WHERE b.trip_id = $1 AND b.class_type = $2 AND b.booking_status != 'Canceled'
      `;
      const bookedSeatsResult = await client.query(bookedSeatsQuery, [trip_id, main_user.class_type]);
      const bookedSeats = bookedSeatsResult.rows.map(row => row.seat_no);

      // Generate available seats
      const totalSeats = main_user.class_type === 'economy' ? economy_seats_no : business_seats_no;
      const allSeats = Array.from({ length: totalSeats }, (_, i) => i + 1);
      const availableSeats = allSeats.filter(seat => !bookedSeats.includes(seat));

      if (availableSeats.length < totalPassengers) {
          return res.status(400).json({ success: false, message: 'Not enough available seats, you are on the waitlist.' });
      }

      // Assign seats
      main_user.seat_no = availableSeats.shift();
      dependents.forEach((dependent, index) => {
          dependent.seat_no = availableSeats.shift();
      });

      // Determine seat availability and set booking status
      let finalBookingStatus = 'Reserved';
      if (availableSeats.length < totalPassengers) {
          finalBookingStatus = 'Waitlisted';
      }

      // Insert the main booking
      console.log('Inserting main booking...');
      const bookingQuery = `
          INSERT INTO booking (email, trip_id, class_type, seat_no, price, luggage_weight, no_of_luggage, booking_status, booking_date, number_of_seats)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING booking_id
      `;
      const mainBookingResult = await client.query(bookingQuery, [
          email,
          trip_id,
          main_user.class_type,
          main_user.seat_no,
          basePrice,
          main_user.luggage_weight || 0,
          main_user.no_of_luggage || 0,
          finalBookingStatus,
          booking_date,
          totalPassengers, // Total seats booked (main user + dependents)
      ]);

      const bookingId = mainBookingResult.rows[0].booking_id;
      console.log('Main booking added with ID:', bookingId);

      // Insert dependents
      if (dependents && dependents.length > 0) {
          console.log('Adding dependents...');
          const dependentQuery = `
              INSERT INTO dependent_booking (booking_id, name, relationship, seat_no, price, luggage_weight, no_of_luggage)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;

          for (const dependent of dependents) {
              const dependentPrice = basePrice * 0.75; // Apply 25% discount for dependents
              await client.query(dependentQuery, [
                  bookingId,
                  dependent.name,
                  dependent.relationship,
                  dependent.seat_no,
                  dependentPrice,
                  dependent.luggage_weight || 0,
                  dependent.no_of_luggage || 0,
              ]);
          }
      }

      res.status(200).json({
          success: true,
          message: 'Booking and dependents added successfully',
          booking_status: finalBookingStatus,
      });
  } catch (error) {
      console.error('Error adding booking:', error);
      res.status(500).json({ success: false, message: error.message });
  }
});








/*----------------------------- payment info Ineration ----------------------------------*/

app.post('/process-payment', async (req, res) => {
  const { email, trip_id, payment_due, credit_card_no, payment_date } = req.body;

  try {
      console.log('Received payment request:', req.body);

      // Fetch the most recent booking_no for the given email and trip_id
      const bookingQuery = `
          SELECT booking_id AS booking_no 
          FROM booking 
          WHERE email = $1 AND trip_id = $2
          ORDER BY booking_date DESC 
          LIMIT 1
      `;
      const bookingResult = await client.query(bookingQuery, [email, trip_id]);

      if (bookingResult.rows.length === 0) {
          console.error('No bookings found for email and trip_id:', email, trip_id);
          return res.status(400).json({ success: false, message: 'No bookings found for the given email and trip ID.' });
      }

      const bookingNo = bookingResult.rows[0].booking_no;
      console.log('Retrieved booking_no:', bookingNo);

      // Insert into payment table
      console.log('Inserting into payment table with booking_no:', bookingNo);
      const paymentQuery = `
          INSERT INTO payment (booking_no, payment_due, credit_card_no, payment_date)
          VALUES ($1, $2, $3, $4)
          RETURNING payment_id
      `;
      const result = await client.query(paymentQuery, [
          bookingNo,
          payment_due,
          credit_card_no,
          payment_date,
      ]);

      const paymentId = result.rows[0].payment_id;
      console.log('Payment added successfully with ID:', paymentId);

      res.status(200).json({ success: true, paymentId });
  } catch (error) {
      console.error('Error processing payment:', error.stack);
      res.status(500).json({ success: false, message: 'Failed to process payment.' });
  }
});


/* --------------------------------- read the total price --------------------------------*/

app.get('/get-total-price', async (req, res) => {
  const { trip_id, email } = req.query;

  try {
      // Query to fetch the total price for the current booking session (main user + dependents)
      const query = `
          SELECT 
              b.price AS main_user_price,
              COALESCE(SUM(d.price), 0) AS dependents_price
          FROM booking b
          LEFT JOIN dependent_booking d ON b.booking_id = d.booking_id
          WHERE b.trip_id = $1 AND b.email = $2
          GROUP BY b.booking_id
      `;

      const result = await client.query(query, [trip_id, email]);

      if (result.rows.length === 0) {
          console.error('No bookings found for this trip and user.');
          return res.status(404).json({ success: false, message: 'No bookings found for this trip and user' });
      }

      const { main_user_price, dependents_price } = result.rows[0];
      const total_price = parseFloat(main_user_price) + parseFloat(dependents_price);

      console.log('Backend Total Price Response:', { total_price });
      res.json({ success: true, total_price });
  } catch (error) {
      console.error('Error fetching total price:', error);
      res.status(500).json({ success: false, message: 'An error occurred while fetching total price' });
  }
});


////////// display the tickets /////////////////
app.get('/get-tickets', async (req, res) => {
  const { trip_id, email } = req.query;

  try {
      // Fetch main user booking
      const bookingQuery = `
         SELECT b.email, 
       b.seat_no, 
       t.trip_date,  
       tr.english_name AS train_name, 
       t.departure, 
       t.arrival
FROM booking b
INNER JOIN trip t ON b.trip_id = t.trip_id
INNER JOIN train tr ON t.train_id = tr.train_id
WHERE b.trip_id = 1 AND b.email = 'a';

      `;
      const bookingResult = await client.query(bookingQuery, [trip_id, email]);

      if (bookingResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'No booking found.' });
      }

      const booking = bookingResult.rows[0];

      // Fetch dependents
      const dependentsQuery = `
          SELECT d.name, d.seat_no
          FROM dependent_booking d
          INNER JOIN booking b ON d.booking_id = b.booking_id
          WHERE b.trip_id = $1 AND b.email = $2
      `;
      const dependentsResult = await client.query(dependentsQuery, [trip_id, email]);
      const dependents = dependentsResult.rows;

      res.status(200).json({ success: true, booking, dependents });
  } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch tickets.' });
  }
});

/////////////////////////// the loyalty info in the userpage ////////////////////////////////

app.get('/get-loyalty-info', async (req, res) => {
  const { email } = req.query;

  try {
    const query = `
      SELECT loyalty_class, miles_traveled 
      FROM passenger
      WHERE email = $1
    `;
    const result = await client.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      loyalty_class: result.rows[0].loyalty_class,
      miles_traveled: result.rows[0].miles_traveled
    });
  } catch (error) {
    console.error('Error fetching loyalty info:', error);
    res.status(500).json({ success: false, message: 'An error occurred while fetching loyalty info.' });
  }
});



/////////////////////////////////////////////// Admin page functionalities /////////////////////////////////////////////////


/////////////////// Functionality 1: Manage reservations //////////////////////////
// Fetch all reservations
// Serve the manage-reservations page
app.get("/manage-reservations", (req, res) => {
  res.sendFile(path.join(_dirname, "manage-reservations.html"));
});

// Fetch all reservations
app.get("/reservations", async (req, res) => {
  try {
    const query = `
      SELECT booking_id, email, trip_id, class_type, total_price, luggage_weight,
             no_of_luggage, seat_no, booking_status, booking_date
      FROM booking
      ORDER BY booking_id;
    `;
    const result = await client.query(query);
    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reservations." });
  }
});

// Fetch a single reservation by booking_id
app.get("/reservations/:id", async (req, res) => {
  const bookingId = req.params.id;

  try {
    const query = "SELECT * FROM booking WHERE booking_id = $1";
    const result = await client.query(query, [bookingId]);

    if (result.rows.length > 0) {
      res.status(200).json({ success: true, data: result.rows[0] });
    } else {
      res.status(404).json({ success: false, message: "Booking not found." });
    }
  } catch (error) {
    console.error("Error fetching reservation details:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reservation details." });
  }
});

// Add a new reservation
app.post("/reservations/add", async (req, res) => {
  const {
    email,
    trip_id,
    class_type,
    total_price,
    luggage_weight,
    no_of_luggage,
    seat_no,
    booking_status,
  } = req.body;

  try {
    // Query to find the maximum booking_id in the table
    const maxIdQuery = "SELECT COALESCE(MAX(booking_id), 0) AS max_id FROM booking";
    const maxIdResult = await client.query(maxIdQuery);

    // Calculate the next booking_id
    const nextId = parseInt(maxIdResult.rows[0].max_id, 10) + 1;
    console.log("Next booking_id:", nextId);

    // Insert the new booking with the calculated booking_id
    const insertQuery = `
      INSERT INTO booking (booking_id, email, trip_id, class_type, total_price, luggage_weight,
                           no_of_luggage, seat_no, booking_status, booking_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_DATE)
    `;

    await client.query(insertQuery, [
      nextId,
      email,
      trip_id,
      class_type,
      total_price,
      luggage_weight,
      no_of_luggage,
      seat_no,
      booking_status,
    ]);

    res.status(200).json({ success: true, message: "Booking added successfully." });
  } catch (error) {
    console.error("Error adding reservation:", error);
    res.status(500).json({ success: false, message: "Failed to add reservation." });
  }
});

// Edit reservation details
app.put("/reservations/edit/:id", async (req, res) => {
  const bookingId = req.params.id;
  const {
    email,
    trip_id,
    class_type,
    total_price,
    luggage_weight,
    no_of_luggage,
    seat_no,
    booking_status,
  } = req.body;

  try {
    const query = `
      UPDATE booking 
      SET email = $1, trip_id = $2, class_type = $3, total_price = $4, 
          luggage_weight = $5, no_of_luggage = $6, seat_no = $7, booking_status = $8
      WHERE booking_id = $9
    `;
    await client.query(query, [
      email,
      trip_id,
      class_type,
      total_price,
      luggage_weight,
      no_of_luggage,
      seat_no,
      booking_status,
      bookingId,
    ]);

    res.status(200).json({ success: true, message: "Booking updated successfully." });
  } catch (error) {
    console.error("Error editing reservation:", error);
    res.status(500).json({ success: false, message: "Failed to edit reservation." });
  }
});

// Cancel reservation by booking_id
app.put("/reservations/cancel/:id", async (req, res) => {
  const bookingId = req.params.id;

  try {
    const query = "UPDATE booking SET booking_status = 'Canceled' WHERE booking_id = $1";
    await client.query(query, [bookingId]);

    res.status(200).json({ success: true, message: "Booking status updated to Canceled." });
  } catch (error) {
    console.error("Error canceling reservation:", error);
    res.status(500).json({ success: false, message: "Failed to cancel reservation." });
  }
});


/////////////////// Functionality 2: Assign Staff ////////////////////////////////
// Back button to redirect to staff.html
app.get("/staff", (req, res) => {
  res.sendFile(path.join(_dirname, "staff.html"));
});


app.get('/train-details', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.train_id, 
        t.trip_id, 
        tr.english_name AS train_name, 
        t.driver_name, 
        t.engineer_name,
        t.trip_date
      FROM trip t
      INNER JOIN train tr ON t.train_id = tr.train_id
      ORDER BY t.train_id, t.trip_id; -- Arrange by train_id first, then trip_id
    `;
    const result = await client.query(query);

    if (result.rows.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching train details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch train details.' });
  }
});


app.post('/assign-staff', async (req, res) => {
  const { trip_id, staff_name, role, trip_date } = req.body;

  try {
    // Check if staff exists and their role matches
    const staffQuery = `
      SELECT * FROM staff WHERE name = $1 AND role = $2
    `;
    const staffResult = await client.query(staffQuery, [staff_name, role]);

    if (staffResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Staff member "${staff_name}" with role "${role}" does not exist.',
      });
    }

    // Check for conflicts: staff already assigned to another trip on the same date
    const conflictQuery = `
      SELECT * 
      FROM trip 
      WHERE trip_date = $1 
      AND (driver_name = $2 OR engineer_name = $2)
    `;
    const conflictResult = await client.query(conflictQuery, [trip_date, staff_name]);

    if (conflictResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Staff member "${staff_name}" is already assigned to another trip on ${trip_date}.',
      });
    }

    // Assign the staff to the trip
    const assignQuery = `
      UPDATE trip
      SET ${role === 'Driver' ? 'driver_name' : 'engineer_name'} = $1
      WHERE trip_id = $2
    `;
    await client.query(assignQuery, [staff_name, trip_id]);

    res.status(200).json({
      success: true,
      message: 'Staff member "${staff_name}" assigned as ${role} for trip ID ${trip_id}.',
    });
  } catch (error) {
    console.error('Error assigning staff:', error);
    res.status(500).json({ success: false, message: 'Failed to assign staff.' });
  }
});


/////////////////// Functionality 3: Promote Passenger //////////////////////////
// Endpoint to fetch waitlisted bookings
app.get('/waitlisted-bookings', async (req, res) => {
  try {
    const query = `
      SELECT 
        b.booking_id, 
        p.name, 
        s1.name AS departure_station, 
        s2.name AS arrival_station, 
        b.class_type, 
        b.booking_status
      FROM booking b
      JOIN passenger p ON b.email = p.email
      JOIN trip t ON b.trip_id = t.trip_id
      JOIN station s1 ON t.departure = s1.sequence_no
      JOIN station s2 ON t.arrival = s2.sequence_no
      WHERE b.booking_status = 'Waitlisted';
    `;
    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching waitlisted bookings:', error);
    res.status(500).send('Server error while fetching waitlisted bookings');
  }
});  


// Endpoint to promote a booking with capacity constraint
app.post('/promote-booking/:bookingId', async (req, res) => {
  const { bookingId } = req.params;

  try {
    // Get trip, train details, and number of seats for the booking
    const tripQuery = `
      SELECT 
        tr.train_id, 
        tr.trip_id, 
        tr.departure_time, 
        tr.arrival_time,
        tr.trip_date,
        b.number_of_seats, -- Seats for the current waitlisted booking
        train.economy_seats_no + train.business_seats_no AS train_capacity
      FROM booking b
      JOIN trip tr ON b.trip_id = tr.trip_id
      JOIN train ON tr.train_id = train.train_id
      WHERE b.booking_id = $1;
    `;
    const tripResult = await client.query(tripQuery, [bookingId]);

    if (tripResult.rows.length === 0) {
      return res.status(404).send('Booking not found');
    }

    const trip = tripResult.rows[0];

    // Calculate total seats already booked for this trip
    const seatQuery = `
      SELECT COALESCE(SUM(b.number_of_seats), 0) AS total_booked_seats
      FROM booking b
      WHERE b.trip_id = $1 AND b.booking_status = 'Permanent';
    `;
    const seatResult = await client.query(seatQuery, [trip.trip_id]);
    const totalBookedSeats = seatResult.rows[0].total_booked_seats;

    // Check if seats are available (including the number of seats in the waitlisted booking)
    if (totalBookedSeats + trip.number_of_seats > trip.train_capacity) {
      return res.status(400).send('No available seats to promote this booking');
    }

    
    // Promote the booking
    const updateQuery = `
      UPDATE booking
      SET booking_status = 'Permanent'
      WHERE booking_id = $1 AND booking_status = 'Waitlisted';
    `;
    const updateResult = await client.query(updateQuery, [bookingId]);

    if (updateResult.rowCount > 0) {
      res.status(200).send('Booking successfully promoted');
    } else {
      res.status(404).send('Booking not found or already promoted');
    }
  } catch (error) {
    console.error('Error promoting booking:', error);
    res.status(500).send('Server error while promoting booking');
  }
});

///////////////////////////////////////////////////////////////////////

////////////////////////// Functionality 4: Show Active Trains //////////////////////////

// Endpoint to fetch active trains for today
app.get('/active-trains', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.english_name AS train_name,
        s1.name AS departure_station,
        s2.name AS arrival_station,
        tr.departure_time,
        tr.arrival_time,
        tr.trip_date
      FROM trip tr
      JOIN train t ON tr.train_id = t.train_id
      JOIN station s1 ON tr.departure = s1.sequence_no
      JOIN station s2 ON tr.arrival = s2.sequence_no
      WHERE tr.trip_date = CURRENT_DATE;
    `;
    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching active trains:', error);
    res.status(500).send('Server error while fetching active trains');
  }
});

////////////////////////// Functionality 5: Train Stations Paths  //////////////////////////

// Endpoint to fetch train station paths
app.get('/train-stations', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.english_name AS train_name,
        tr.departure AS departure_station_id,
        s1.name AS departure_station,
        tr.middle AS middle_station_id,
        s2.name AS middle_station,
        tr.arrival AS destination_station_id,
        s3.name AS destination_station,
        tr.number_of_miles
      FROM trip tr
      JOIN train t ON tr.train_id = t.train_id
      JOIN station s1 ON tr.departure = s1.sequence_no
      LEFT JOIN station s2 ON tr.middle = s2.sequence_no
      JOIN station s3 ON tr.arrival = s3.sequence_no
      ORDER BY t.english_name, tr.trip_id;
    `;

    const result = await client.query(query);

    // Organize data by train
    const trains = {};
    result.rows.forEach(row => {
      if (!trains[row.train_name]) {
        trains[row.train_name] = [];
      }
      trains[row.train_name].push({
        departure_station: row.departure_station,
        middle_station: row.middle_station,
        destination_station: row.destination_station,
        number_of_miles: row.number_of_miles,
      });
    });

    // Format the response
    const response = Object.keys(trains).map(trainName => ({
      train_name: trainName,
      paths: trains[trainName],
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching train station paths:', error);
    res.status(500).send('Server error while fetching train station paths');
  }
});

////////////////////////// Functionality 5: Showing Waitlisted Passengers With Loyalty  //////////////////////////

app.get('/loyalty-waitlist', async (req, res) => {
  const { trainNumber } = req.query;

  if (!trainNumber) {
    console.error('Train number is missing');
    return res.status(400).send('Train number is required');
  }

  try {
    const query = `
      SELECT 
        p.name,
        p.loyalty_class,
        p.email,
        b.number_of_seats,
        b.booking_status,
        b.class_type
      FROM booking b
      JOIN passenger p ON b.email = p.email
      JOIN trip t ON b.trip_id = t.trip_id
      JOIN train tr ON t.train_id = tr.train_id
      WHERE tr.train_id = $1 AND b.booking_status = 'Waitlisted'
      ORDER BY p.loyalty_class DESC, b.class_type ASC;
    `;
    console.log('Executing query with trainNumber:', trainNumber);
    const result = await client.query(query, [trainNumber]);

    console.log('Query result:', result.rows); // Log query results
    if (result.rows.length === 0) {
      console.log('No waitlisted passengers found for this train');
      return res.status(200).json({});
    }

    // Organize data by class type
    const classes = {};
    result.rows.forEach(row => {
      if (!classes[row.class_type]) {
        classes[row.class_type] = [];
      }
      classes[row.class_type].push({
        name: row.name,
        loyalty_class: row.loyalty_class,
        email: row.email,
        number_of_seats: row.number_of_seats,
        booking_status: row.booking_status,
      });
    });

    console.log('Organized data by class:', classes);
    res.status(200).json(classes);
  } catch (error) {
    console.error('Error fetching loyalty waitlist:', error);
    res.status(500).send('Server error while fetching loyalty waitlist');
  }
});


// Endpoint to fetch available trains
app.get('/available-trains', async (req, res) => {
  try {
    const query = `
      SELECT train_id, english_name, arabic_name
      FROM train
      ORDER BY english_name;
    `;
    const result = await client.query(query);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching available trains:', error);
    res.status(500).send('Server error while fetching available trains');
  }
});
/////////////////////////// Functionality 6 (Bonus): Train Load Factor //////////////////////////////
app.get('/load-factors', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).send('Date is required');
  }

  try {
    const query = `
      SELECT 
        train.english_name AS train_name,
        train.arabic_name AS train_name_arabic,
        (train.economy_seats_no + train.business_seats_no) AS total_seats,
        COALESCE(SUM(b.number_of_seats), 0) AS occupied_seats,
        s1.name AS departure_station,
        s2.name AS middle_station,
        s3.name AS destination_station
      FROM train
      LEFT JOIN trip tr ON tr.train_id = train.train_id
      LEFT JOIN station s1 ON tr.departure = s1.sequence_no
      LEFT JOIN station s2 ON tr.middle = s2.sequence_no
      LEFT JOIN station s3 ON tr.arrival = s3.sequence_no
      LEFT JOIN booking b ON b.trip_id = tr.trip_id AND b.booking_status = 'Permanent'
      WHERE tr.trip_date = $1
      GROUP BY train.english_name, train.arabic_name, train.economy_seats_no, train.business_seats_no, 
               s1.name, s2.name, s3.name;
    `;
    const result = await client.query(query, [date]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching load factors:', error);
    res.status(500).send('Server error while fetching load factors');
  }
});


/////////////////////////// Functionality 7 (Bonus): Travelling Dependents //////////////////////////////
app.get('/dependents', async (req, res) => {
  const { date } = req.query;

  if (!date) {
    console.log('No date provided in the request');
    return res.status(400).send('Date is required');
  }

  console.log(`Fetching dependents for date: ${date}`);

  try {
    const query = `
  SELECT 
    p.name AS passenger_name, -- Ensure passenger name is included
    d.name AS dependent_name,
    d.relationship AS relationship,
    d.price AS price,
    train.english_name AS train_name,
    train.arabic_name AS train_name_arabic,
    s1.name AS departure_station,
    s2.name AS middle_station,
    s3.name AS destination_station
  FROM dependent_booking d
  JOIN booking b ON d.booking_id = b.booking_id
  JOIN passenger p ON b.email = p.email -- Join passenger to fetch name
  JOIN trip tr ON b.trip_id = tr.trip_id
  JOIN train ON tr.train_id = train.train_id
  JOIN station s1 ON tr.departure = s1.sequence_no
  LEFT JOIN station s2 ON tr.middle = s2.sequence_no
  JOIN station s3 ON tr.arrival = s3.sequence_no
  WHERE tr.trip_date = $1;
`;
    const result = await client.query(query, [date]);
    console.log(`Query Result: ${JSON.stringify(result.rows)}`);

    if (result.rows.length === 0) {
      console.log('No dependents found for the given date');
      return res.status(404).send('No dependents found for the given date');
    }

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error fetching dependents:', error);
    res.status(500).send('Server error while fetching dependents');
  }
});









// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

