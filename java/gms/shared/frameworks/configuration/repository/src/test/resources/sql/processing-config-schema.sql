create schema if not exists gms_config;

comment on schema gms_config is 'GMS Processing Configuration Schema';

create table if not exists gms_config.configuration(
    id serial primary key,
    name varchar(100) not null unique
);

create table if not exists gms_config.configuration_option(
  id serial primary key,
  name varchar(100) not null,
	parameters jsonb not null,
	configuration_id integer constraint configuration_option_configuration_id_fkey references configuration(id) not null
);

create table if not exists gms_config.configuration_constraint(
  id serial primary key,
	constraint_type varchar(100) not null,
  criterion varchar(100) not null,
	priority bigint not null,
	operator_type integer not null,
	negated boolean not null,
	configuration_option_id integer constraint configuration_constraint_configuration_option_id_fkey references configuration_option(id) not null,
	boolean_value boolean,
	numeric_scalar_value double precision,
	numeric_range_min_value double precision,
	numeric_range_max_value double precision,
	time_of_day_range_min_value time,
	time_of_day_range_max_value time,
	time_of_year_range_min_value timestamp,
	time_of_year_range_max_value timestamp
);

create table if not exists gms_config.string_constraint_value(
  constraint_id integer references configuration_constraint(id) not null,
  value varchar(100) not null
);

create table if not exists gms_config.phase_constraint_value(
  constraint_id integer references configuration_constraint(id) not null,
  value integer not null
);

create sequence if not exists gms_config.configuration_sequence;
create sequence if not exists gms_config.configuration_option_sequence;
create sequence if not exists gms_config.constraint_sequence;
