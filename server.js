const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());

app.use(express.static(path.join(__dirname, 'assets')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/geocode', async (req, res) => {
  const location = req.query.location;
  const geocodeApiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${process.env.GOOGLE_MAPS_KEY}`;

  try {
    const response = await fetch(geocodeApiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error with geocoding request.');
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
    res.status(500).send('Error with weather request.');
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
    res.status(500).send('Error with forecast request.');
  }
});

app.get('/parks', async (req, res) => {
  const parkUrl = `https://developer.nps.gov/api/v1/parks?stateCode=CA&api_key=${process.env.NPS_KEY}`;

  try {
    const response = await fetch(parkUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error with parks request.');
  }
});

app.get('/feespasses', async (req, res) => {
  const passUrl = `https://developer.nps.gov/api/v1/feespasses?statecode=CA&api_key=${process.env.NPS_KEY}`;

  try {
    const response = await fetch(passUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).send('Error with feespasses request.');
  }
});

const PORT = process.env.PORT || 3011;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
