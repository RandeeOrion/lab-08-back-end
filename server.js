'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT;
const app = express();
app.use(cors());
let cache = {};

app.get('/', (request, response) => {
  response.send('This still works!');
});

// Location Route
// app.get('/location', (request, response) => {
//   try {
//     const geoData = require('./data/geo.json');
//     const city = request.query.city;
//     const locationData = new Location (city, geoData);
//     response.send(locationData);
//   }
//   catch(error) {
//     errorHandler('So sorry, something went wrong.', request, response);
//   }
// });
app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/eventful', eventfulHandler)

//Location Handler Function
function locationHandler(request, response){
  let city = request.query.city;
  if(cache.city) {
    let location = cache.city;
    response.send(location);
  } else{
    try{
      let city = request.query.city;
      //console.log('city', request.query, city);
      let key = process.env.GEOCODE_API_KEY;
      const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
      //console.log('hi', url);

      superagent.get(url)
        .then(data => {
        //console.log(data.body[0]);
          const geoData = data.body[0];
          console.log('city and geoData', city, geoData);
          const location = new Location(city, geoData);
          cache.city = location;
          console.log('location', location);
          response.send(location);
        })
        .catch(() => {
          errorHandler('location superagent broke', request, response);
        });
    }
    catch(error){
      errorHandler(error, request, response);
    }
  }
}

// Location Constructor
function Location(city, geoData){
  this.search_query = city;
  this.formatted_query = geoData.display_name;
  this.latitude = geoData.lat;
  this.longitude = geoData.lon;
}

function weatherHandler(request, response) {
  let latitude = request.query.latitude;
  let longitude = request.query.longitude;
  const url = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${latitude},${longitude}`;

  superagent.get(url)
    .then(data => {
      const weatherSummaries = data.body.daily.data.map(day =>{
        return new Weather(day);
      });
      response.status(200).json(weatherSummaries);
    })
    .catch(()=>{
      errorHandler('So sorry, something went wrong. Blame the elves.', request, response);
    });
}

function Weather(day){
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
}





// Weather Route
// app.get('/weather', (request, response) => {
//   try {
//     const forecast = require('./data/darksky.json');
//     const weatherData = [];
//     for (let i = 0; i < forecast.daily.data.length; i++){
//       let dailyForecast = forecast.daily.data[i];
//       weatherData.push(new Weather(dailyForecast.summary, dailyForecast.time));
//     }
//     response.send(weatherData);
//   }
//   catch(error) {
//     errorHandler('So sorry, something went wrong.', request, response);
//   }
// });

// // Weather Constructor
// function Weather(forecast, time){
//   this.forecast = forecast;
//   this.time = new Date(time*1000);
//   console.log(this.time);
// }


client.connect()
  .then( ()=>{
    app.listen(PORT, () => {
      console.log('Server up on: ', PORT);
    });
  })
  .catch(err => {
    console.error('pg connect error', err);
  });



// Error Handler
function errorHandler(error, request, response) {
  response.status(500).send(error);
}



