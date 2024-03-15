const express = require('express');
const app = express();
const path = require('path');
const fetch = require('node-fetch'); // Make sure you have node-fetch installed
require('dotenv').config();

// Serve static files from the 'public' directory
app.use(express.static('public')); // I suggest placing your static files in a 'public' folder

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/geocode', async (req, res) => {
  const location = req.query.location;
  const geocodeApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_KEY}`;
  
  try {
    const response = await fetch(geocodeApiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error geocoding location:', error);
    res.status(500).json({ error: 'Error geocoding location' });
  }
});

app.get('/weather', async (req, res) => {
  const { lat, lon } = req.query;
  const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPEN_WEATHER_KEY}&units=imperial`;

  try {
    const response = await fetch(weatherUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching weather:', error);
    res.status(500).json({ error: 'Error fetching weather' });
  }
});

app.get('/forecast', async (req, res) => {
  const { lat, lon } = req.query;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${process.env.OPEN_WEATHER_KEY}&units=imperial`;

  try {
    const response = await fetch(forecastUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching forecast:', error);
    res.status(500).json({ error: 'Error fetching forecast' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log(`Server is running on port ${PORT}.`);
});