import { schedule } from 'node-cron';
import { createTransport } from 'nodemailer';
import pkg from 'pg'; // PostgreSQL module
const { Client } = pkg;

// Configure Postgres client
const client = new Client({
    user: 'postgres',
    password: '1234',
    host: 'localhost',
    port: 5432,
    database: 'users', // Database containing `users` and `trip` tables
});
client.connect();

// Configure Nodemailer transporter
const transporter = createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: "eng.abddulrhmanammar@gmail.com",
    pass: "zlro qzqj ouhc blym",
  },
});

// Function to send payment reminders
async function sendPaymentReminders() {
  console.log("Running payment reminder job...");

  try {
    // Fetch unpaid bookings with a trip date of tomorrow
    const query = `
      SELECT 
          b.booking_id, 
          b.email, 
          t.departure, 
          t.arrival, 
          t.trip_date
      FROM 
          booking b
      INNER JOIN 
          trip t 
      ON 
          b.trip_id = t.trip_id
      LEFT JOIN 
          payment p 
      ON 
          b.booking_id = p.booking_no
      WHERE 
          p.booking_no IS NULL -- Bookings not paid
      AND 
          t.trip_date = CURRENT_DATE + INTERVAL '1 day' -- Trip is tomorrow
    `;
    const result = await client.query(query);

    if (result.rows.length === 0) {
      console.log("No payment reminders to send.");
      return;
    }

    // Loop through each booking and send a payment reminder email
    for (const booking of result.rows) {
      const { booking_id, email, departure, arrival, trip_date } = booking;

      try {
        // Send email
        await transporter.sendMail({
          from: 'eng.abddulrhmanammar@gmail.com',
          to: email,
          subject: "Payment Reminder: Complete Your Booking",
          html: `
            <h1>Payment Reminder</h1>
            <p>Dear Passenger,</p>
            <p>This is a friendly reminder to complete your payment for the trip:</p>
            <ul>
              <li><strong>Departure:</strong> ${departure}</li>
              <li><strong>Arrival:</strong> ${arrival}</li>
              <li><strong>Trip Date:</strong> ${new Date(trip_date).toLocaleDateString()}</li>
            </ul>
            <p>Please complete your payment as soon as possible to confirm your booking.</p>
            <p>Thank you for choosing our service!</p>
          `,
        });

        console.log(`Payment reminder sent to ${email}`);
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
      }
    }
  } catch (dbError) {
    console.error("Error fetching unpaid bookings:", dbError);
  }
}

// Schedule the payment reminder job to run at 9 PM
schedule('0 21 * * *', sendPaymentReminders); // Adjusted to run at 9:00 PM server time

// Existing notification code
async function sendNotifications() {
  console.log("Running notification job...");

  try {
    // Fetch unsent notifications where send_time <= CURRENT_TIMESTAMP
    const result = await client.query(
      `SELECT * FROM notifications WHERE sent = false AND send_time <= CURRENT_TIMESTAMP;`
    );

    if (result.rows.length === 0) {
      console.log("No notifications to send.");
      return;
    }

    // Loop through each notification and send an email
    for (const notification of result.rows) {
      const { notification_id, email, message } = notification;

      try {
        // Send email
        await transporter.sendMail({
          from: 'eng.abddulrhmanammar@gmail.com',
          to: email,
          subject: "Train Departure Reminder",
          text: message,
        });

        console.log(`Notification sent to ${email}`);

        // Update the sent flag to true in the database
        await client.query(
          `UPDATE notifications SET sent = true WHERE notification_id = $1;`,
          [notification_id]
        );
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
      }
    }
  } catch (dbError) {
    console.error("Error fetching notifications:", dbError);
  }
}

// Schedule the notification job to run every minute
schedule('* * * * *', sendNotifications);
