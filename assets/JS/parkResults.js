// open weather and NPS API keys
const opWeatherKey = process.env.OPEN_WEATHER_KEY;
const npsKey = process.env.NPS_KEY;
// NPS API endpoints
const parkUrl = 'https://developer.nps.gov/api/v1/parks?stateCode=CA'
const passUrl = 'https://developer.nps.gov/api/v1/feespasses?statecode=CA'
// UI elements from the HTML document
const searchBtn = document.getElementById('searchBtn')
const parkList = document.getElementById('parkList')
const parkDetails = document.getElementById('parkDetails')
const passesList = document.getElementById('passesList')
const cardContainer = document.getElementById('cardContainer')
const refreshBtn = document.getElementById('refreshBtn')
const backToTopBtn = document.getElementById('topBtn')
const previousSearchBtn = document.getElementById('previousBtn')
const errorMessageElement = document.getElementById('error-message');

// Initialize the carousel component when the document loads
document.addEventListener('DOMContentLoaded', function () {
  M.AutoInit();
  fetchParkNames();
  var elems = document.querySelectorAll('.carousel');
  var instances = M.Carousel.init(elems, { fullWidth: true, indicators: true });
  setInterval(function () {
    var instance = M.Carousel.getInstance(elems[0]);
    instance.next();
  }, 4000);
});
// Initialize all other Materialize components
M.AutoInit()

// Function to fetch weather information and forecasts using OpenWeather API
function fetchWeatherAndForecast(lat, lon, callback) {
  fetch(`/weather?lat=${lat}&lon=${lon}`)
    .then(response => response.json())
    .then(weatherData => {
      if (weatherData && weatherData.main && weatherData.weather) {
        const temperature = weatherData.main.temp;
        const description = weatherData.weather[0].description;
        const iconCode = weatherData.weather[0].icon;
        const iconUrl = `http://openweathermap.org/img/w/${iconCode}.png`;
        const formattedWeatherInfo = `<strong>Today:</strong><br>Temperature: ${temperature}°F, Condition: ${description} <img src="${iconUrl}" alt="Weather icon"><br>`;
        return Promise.all([fetch(`/forecast?lat=${lat}&lon=${lon}`), formattedWeatherInfo]);
      } else {
        throw new Error('No weather data available.');
      }
    })
    .then(([forecastResponse, formattedWeatherInfo]) => forecastResponse.json().then(forecastData => {
      let forecastHTML = '<br><strong>5-day Forecast:</strong><br>';
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      if (forecastData && forecastData.list) {
        for (let i = 0; i < forecastData.list.length; i += 8) {
          const dayData = forecastData.list[i];
          const dayTemp = dayData.main.temp;
          const dayDescription = dayData.weather[0].description;
          const dayIconCode = dayData.weather[0].icon;
          const dayIconUrl = `https://openweathermap.org/img/w/${dayIconCode}.png`;
          const forecastDate = new Date(dayData.dt * 1000);
          const dayOfWeek = daysOfWeek[forecastDate.getDay()];
          forecastHTML += `<strong>${dayOfWeek}:</strong> Temperature: ${dayTemp}°F, Conditions: ${dayDescription} <img src="${dayIconUrl}" alt="Weather icon"><br>`;
        }
      }
      callback(null, formattedWeatherInfo + forecastHTML);
    }))
    .catch(error => {
      callback(error, null);
    });
}

// Function to create park cards with fetched data
function buildCards(filteredParkList) {
  const selectedActivity = document.getElementById('activity').value;
  parkList.innerHTML = '';
  filteredParkList.forEach(park => {
    if (!selectedActivity || park.activities.some(activity => activity.name === selectedActivity)) {
      const imageUrl = park.images.length > 0 ? park.images[0].url : 'assets/default_park.jpg';
      const parkCard = document.createElement('div');
      parkCard.className = 'col s12 m6 l4';
      parkCard.innerHTML = createParkCardHtml(park, imageUrl);
      fetchWeatherAndForecast(park.latitude, park.longitude, (error, weatherInfo) => {
        if (error) {
          console.error('Weather fetch failed:', error);
        } else {
          const weatherDiv = parkCard.querySelector('.weather-info-placeholder');
          if (weatherDiv) weatherDiv.innerHTML = weatherInfo;
        }
      });
      parkList.appendChild(parkCard);
    }
  });
}


// Function to fetch park names from NPS API
function fetchParkNames() {
  fetch('/parks')
    .then(response => response.json())
    .then(data => searchParksWithinRadius(data.data))
    .catch(error => {
      console.error('Parks fetch failed:', error);
      errorMessageElement.textContent = 'Failed to load park data.';
    });
}

// Attach event listener to fetch park names on document load
document.addEventListener('DOMContentLoaded', function () {
  fetchParkNames()
})
// Function to construct HTML for entrance fees information
function buildFeeInfoHTML(entranceFees) {
  // If there are no entrance fees provided, return a message indicating this.
  if (!entranceFees || entranceFees.length === 0) {
    return '<div class="no-fees-info">No entrance fee information available for this park.</div>'
  }

  let feeInfoHTML = '' // Initialize an empty string to hold the HTML content for entrance fees.
  entranceFees.forEach((entranceFees) => {
    // Loop through each entrance fee item and append its information to the HTML string.
    feeInfoHTML += `
      <div>
        <strong>${entranceFees.title}:</strong> $${entranceFees.cost}<br>
        ${entranceFees.description ? entranceFees.description : ''}
      </div>
    `
  })

  return feeInfoHTML // Return the constructed HTML content for the entrance fees.
}

// Event listener for the 'Back to Top' button
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
})

// Function to geocode a location using Google Maps API
function geocodeLocation(location) {
  fetch(`/geocode?location=${encodeURIComponent(location)}`)
    .then(response => response.json())
    .then(data => {
      if (data.results && data.results.length > 0) {
        return data.results[0].geometry.location;
      } else {
        throw new Error('Geocode API returned no results.');
      }
    })
    .catch(error => {
      console.error('Geocoding failed:', error);
      errorMessageElement.textContent = 'Failed to geocode location.';
    });
}

// Function to calculate distance between two points on Earth
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 3958.8 // Radius of the Earth in miles.
  // Convert the differences in latitude and longitude from degrees to radians.
  var dLat = (lat2 - lat1) * (Math.PI / 180)
  var dLon = (lon2 - lon1) * (Math.PI / 180)
  // Apply the Haversine formula to calculate the distance.
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) // Calculate the distance and return it.
  var distance = R * c
  return distance
}
// Function to filter parks within a certain radius from user's location
function searchParksWithinRadius(allParks) {
  var userLocationInput = document.getElementById('find_parks').value // Get the user's location input from an input field.
  var selectedRadius = getSelectedRadius() // Get the selected search radius.
  var errorMessageElement = document.getElementById('error-message') // Get the element where error messages will be displayed.

  // Clear any existing error messages
  errorMessageElement.innerHTML = ''

  if (userLocationInput !== '' && userLocationInput !== null) {
    if (!selectedRadius) {
      // If no search radius is selected, display all parks and exit the function.
      buildCards(allParks)
      return
    }

    // Geocode the user's location input to obtain geographic coordinates.
    geocodeLocation(userLocationInput)
      .then(function (userCoordinates) {
        searchPerformed = true
        // Filter the list of all parks to find those within the selected radius of the user's location.
        var filteredParks = allParks.filter(function (park) {
          var parkCoordinates =
            park.latitude && park.longitude
              ? { lat: park.latitude, lng: park.longitude }
              : null

          if (
            // If the park has coordinates and is within the selected radius of the user's location, include it in the filtered list.
            parkCoordinates &&
            calculateDistance(
              userCoordinates.lat,
              userCoordinates.lng,
              parkCoordinates.lat,
              parkCoordinates.lng
            ) <= selectedRadius
          ) {
            return true
          }
          return false // Otherwise, do not include the park in the filtered list.
        })

        if (filteredParks.length === 0) {
          // If no parks are found within the selected radius, display an error message.
          errorMessageElement.textContent =
            'No parks found within the selected radius.'
        } else {
          // Build UI cards to display the filtered parks.
          buildCards(filteredParks)
        }
      })
      .catch(function () {
        // If an error occurs during the geocoding process or filtering, display an error message.
        errorMessageElement.textContent =
          'Error searching parks. Check your location and try again.'
      })
  } else {
    // If the user hasn't entered a location, display all parks.
    buildCards(allParks)
  }
}

// Function to get the selected radius from the user input
function getSelectedRadius() {
  var selectedRadioBtn = document.querySelector('input[name="group1"]:checked')
  if (selectedRadioBtn) {
    return parseInt(selectedRadioBtn.value, 10)
  }
  return null
}
// Attach event listener to the search button to initiate park name fetch
searchBtn.addEventListener('click', fetchParkNames)

// Event listener to refresh the page when the refresh button is clicked
refreshBtn.addEventListener('click', function () {
  location.reload()
})

function saveSearchCriteria(location, radius, activity) {
  const searchCriteria = {
    location: location,
    radius: radius,
  };

  localStorage.setItem('searchCriteria', JSON.stringify(searchCriteria));
}

searchBtn.addEventListener('click', () => {
  const locationInput = document.getElementById('find_parks').value;
  const selectedRadius = getSelectedRadius();
  saveSearchCriteria(locationInput, selectedRadius);
  fetchParkNames();
});


previousSearchBtn.addEventListener('click', function () {
  const savedSearchCriteria = JSON.parse(localStorage.getItem('searchCriteria'));

  if (savedSearchCriteria) {
    document.getElementById('find_parks').value = savedSearchCriteria.location;

    const selectedRadioBtn = document.querySelector(`input[name="group1"][value="${savedSearchCriteria.radius}"]`);
    if (selectedRadioBtn) {
      selectedRadioBtn.checked = true;
    }

  
    fetchParkNames();
  }
})

function createParkCardHtml(park, imageUrl) {
  return `
    <div class="card large">
      <div class="card-image">
        <img src="${imageUrl}">
      </div>
      <div class="card-content">
        <span class="card-title">${park.fullName}</span>
        <p>${park.description}</p>
      </div>
      <div class="card-action">
        <a href="${park.url}" target="_blank">Visit Park Website</a>
      </div>
    </div>
  `;
}