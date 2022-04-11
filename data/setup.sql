create schema if not exists findnearbyplaces;

drop table if exists findnearbyplaces.review_photo;
drop table if exists findnearbyplaces.place_photo;
drop table if exists findnearbyplaces.reviews;
drop table if exists findnearbyplaces.locations;
drop table if exists findnearbyplaces.reviews;
drop table if exists findnearbyplaces.customer;
drop table if exists findnearbyplaces.category;
drop table if exists findnearbyplaces.photos;

create table findnearbyplaces.category (
	id serial2 primary key,
	name varchar(30) not null
);

create table findnearbyplaces.customer (
	id serial4 primary key,
	email varchar(255),
	password varchar(8)
);

create table findnearbyplaces.locations (
	id serial8 primary key,
	name varchar(256) not null,
	latitude int8 not null,
	longitude int8 not null,
	description varchar(512),
	category_id int2 not null,
	customer_id int4 references findnearbyplaces.customer(id)
);

create table findnearbyplaces.reviews (
	location_id int8 references findnearbyplaces.locations(id),
	customer_id int4 references findnearbyplaces.customer(id),
	id serial4 primary key,
	text varchar(512),
	rating int2 not null
);

create table findnearbyplaces.photo (
	id serial4 primary key,
	file bytea not null
);

create table findnearbyplaces.place_photo (
	location_id int8 references findnearbyplaces.locations(id),
	photo_id int4 references findnearbyplaces.photo(id)
);

create table findnearbyplaces.review_photo (
	review_id int4 references findnearbyplaces.reviews(id),
	photo_id int4 references findnearbyplaces.photo(id)
);