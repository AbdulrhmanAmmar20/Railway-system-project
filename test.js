import { createTransport } from "nodemailer";

async function main() {
  // Configure transporter with Gmail settings
  let transporter = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: 'eng.abddulrhmanammar@gmail.com', // Your Gmail address
      pass: 'zlro qzqj ouhc blym', // Replace with your App Password
    },

    

  });

  // Define email content
  let info = await transporter.sendMail({
    from: 'eng.abddulrhmanammar@gmail.com', // Sender's name and email
    to: "eng.abdulrhmanammar@hotmail.com", // Recipient's email
    subject: "Test Email from NodeMailer",
    html: `
      <h1>Hi Abdulrhman,</h1>
      <p>This is a test email sent using NodeMailer and Gmail SMTP.</p>
      <p>Have a great day!</p>
    `,
  });

  // Log success message
  console.log("Email sent successfully! Message ID:", info.messageId);
}

// Run the script
main().catch((err) => {
  console.error("Error sending email:", err);
});
/////////////////////////////////////////////

