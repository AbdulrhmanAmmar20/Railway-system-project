document.getElementById('contact-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get input values
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validate the inputs
    if (!name || !email || !phone || !message) {
        alert('Please fill out all fields.');
        return;
    }

    // Hide the form and show the success message
    document.getElementById('contact-form').style.display = 'none';
    document.getElementById('success-message').style.display = 'block';
});

