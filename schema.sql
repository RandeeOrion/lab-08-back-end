DROP TABLE IF EXISTS location; 

CREATE TABLE location (
  id serial primary key,
  search_query varchar(255),
  formatted_query varchar(255),
  longitude float,
  latitude float
);

SELECT * FROM location;
