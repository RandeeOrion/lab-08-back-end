'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT;
const app = express();
app.use(cors());


app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
//app.get('/eventful', eventfulHandler)

//Location Handler Function
function locationHandler(request, response){
  let sql = 'SELECT * FROM location WHERE search_query=$1;';
  // console.log('inside locationHandler');
  client.query(sql,[request.query.city])
    .then(result => {
      console.log('successful query', result.rows);
      if (result.rows.length > 0) {
        response.send(result.rows[0]);
      } else{ console.log('no city in database headed to superLena');
        try{
          let city = request.query.city;
          console.log('city', request.query, city);
          let key = process.env.GEOCODE_API_KEY;
          const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json&limit=1`;
          console.log('hi', url);

          superagent.get(url)
            .then(data => {
              console.log('in superagent');
              const geoData = data.body[0];
              // console.log('city and geoData', city, geoData);
              const location = new Location(city, geoData);
              console.log('location inside superagent: ', location);
              let apiToSql = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
              let safeValues = [location.search_query, location.formatted_query, location.latitude, location.longitude];
              client.query(apiToSql, safeValues);
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
    });
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
//  Weather Constructor
function Weather(day){
  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toString().slice(0,15);
}



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
