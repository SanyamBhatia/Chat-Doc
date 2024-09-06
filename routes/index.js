const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointment');
const User = require('../models/user');
const bcrypt = require('bcrypt');

// Show the registration form
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Register route (GET request)
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Register route (POST request)
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Create a new user instance and save it to the database
    const newUser = new User({ name, email, password });
    await newUser.save();

    // Redirect to login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error('Error during registration:', err);
    res.render('register', { error: 'An error occurred during registration. Please try again.' });
  }
});

// Login route (GET request)
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login route (POST request)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    // Check if the password matches
    if (user.password !== password) {
      return res.render('login', { error: 'Invalid email or password.' });
    }

    // Successful login logic (e.g., set session or token)
    res.redirect('/'); // Redirect to homepage or user dashboard after successful login
  } catch (err) {
    console.error('Error during login:', err);
    res.render('login', { error: 'An error occurred during login. Please try again.' });
  }
});

// Handle the registration form submission
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render('register', { error: 'Email already in use' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword
    });

    // Save the user to the database
    await newUser.save();

    // Redirect to the login page after successful registration
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'An error occurred. Please try again.' });
  }
});

module.exports = router;

// Root route (homepage)
router.get('/', (req, res) => {
  res.render('index');
});

// Route to display booking form
router.get('/book', (req, res) => {
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  res.render('book', { error: req.query.error, minDate: today });
});

// Route to handle booking form submission
router.post('/book', async (req, res) => {
  const { name, email, date, time } = req.body;

  // Check if the provided date is in the past
  if (new Date(date) < new Date().setHours(0, 0, 0, 0)) {
    return res.redirect('/book?error=Date cannot be in the past');
  }

  try {
    const newAppointment = new Appointment({
      name,
      email,
      date,
      time,
    });

    await newAppointment.save();
    res.redirect('/appointments');  // Redirect to appointments page after booking
  } catch (err) {
    console.error(err);
    res.redirect('/book?error=An error occurred while booking');
  }
});

// Get appointments with pagination
router.get('/appointments', async (req, res) => {
  const perPage = 5; // Number of appointments per page
  const page = req.query.page || 1;

  try {
    const appointments = await Appointment.find()
      .skip((perPage * page) - perPage)
      .limit(perPage)
      .exec();

    const count = await Appointment.countDocuments();

    res.render('appointments', {
      appointments: appointments,
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / perPage),
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
});

// Edit appointment route (GET request)
router.get('/edit/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    res.render('edit', { appointment: appointment, error: req.query.error });
  } catch (err) {
    console.error(err);
    res.redirect('/appointments');
  }
});

// Edit appointment route (POST request)
router.post('/edit/:id', async (req, res) => {
  const { name, email, date, time } = req.body;
  const appointmentDate = new Date(date); // Convert date string to Date object
  const currentDate = new Date(); // Get the current date

  // Server-side validation: Check if the appointment date is in the past
  if (appointmentDate < currentDate.setHours(0, 0, 0, 0)) {
    // Redirect back to the edit page with an error message
    return res.redirect(`/edit/${req.params.id}?error=Appointment date cannot be in the past. Please select a valid date.`);
  }

  try {
    // Update the appointment details in the database
    await Appointment.findByIdAndUpdate(req.params.id, { name, email, date: appointmentDate, time });

    res.redirect('/appointments'); // Redirect to the appointments list
  } catch (err) {
    console.error(err);
    res.redirect('/appointments');
  }
});

// Delete appointment route (GET request)
router.get('/delete/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndRemove(req.params.id);
    res.redirect('/appointments');
  } catch (err) {
    console.error(err);
    res.redirect('/appointments');
  }
});

// Handle delete appointment route (POST request)
router.post('/delete/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.sendStatus(200); // Send HTTP status 200 OK
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.sendStatus(500); // Send HTTP status 500 Internal Server Error
  }
});

module.exports = router;
