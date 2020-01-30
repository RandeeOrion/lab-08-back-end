DROP TABLE IF EXISTS locations; 

CREATE TABLE IF NOT EXISTS locations (
  id serial primary key,
  city varchar(255),
  search_query varchar(255),
  formatted_query varchar(255),
  longitude float,
  latitude float
);

SELECT * FROM locations;
