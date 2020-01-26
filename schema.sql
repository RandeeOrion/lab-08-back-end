DROP TABLE IF EXISTS location, weather, events; 

CREATE TABLE location (
  id serial primary key,
  search_query text,
  formatted_query text,
  longitude float,
  latitude float
);
