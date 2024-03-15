const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname)));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, function() {
    console.log(`Server is running on port ${PORT}.`);
  });