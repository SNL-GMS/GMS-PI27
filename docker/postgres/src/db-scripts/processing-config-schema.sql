create schema if not exists gms_config;

comment on schema gms_config is 'GMS Processing Configuration Schema';

set search_path to gms_config;

create table if not exists configuration(
    id serial primary key,
    name varchar(100) not null unique
);

create table if not exists configuration_option(
  id serial primary key,
  name varchar(100) not null,
	parameters jsonb not null,
	configuration_id integer constraint configuration_option_configuration_id_fkey references configuration(id) not null
);

create table if not exists configuration_constraint(
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

create table if not exists string_constraint_value(
  constraint_id integer references configuration_constraint(id) not null,
  value varchar(100) not null
);

create table if not exists phase_constraint_value(
  constraint_id integer references configuration_constraint(id) not null,
  value integer not null
);

create sequence if not exists configuration_sequence owned by configuration.id;
create sequence if not exists configuration_option_sequence owned by configuration_option.id;
create sequence if not exists constraint_sequence owned by configuration_constraint.id;

-- set gms_admin user for system to use with database
revoke all on schema gms_config from gms_admin;
grant usage on schema gms_config to gms_admin;
grant usage on sequence configuration_sequence to gms_admin;
grant usage on sequence configuration_option_sequence to gms_admin;
grant usage on sequence constraint_sequence to gms_admin;
grant select, insert, update, delete, truncate on all tables in schema gms_config to gms_admin;

-- set up gms_config_application user for hibernate to use to connect to the config database
create role gms_config_application with noinherit login encrypted password 'GMS_POSTGRES_CONFIG_APPLICATION_PASSWORD';

revoke all on schema gms_config from gms_config_application;
grant usage on schema gms_config to gms_config_application;
grant usage on sequence configuration_sequence to gms_config_application;
grant usage on sequence configuration_option_sequence to gms_config_application;
grant usage on sequence constraint_sequence to gms_config_application;
grant select, insert, update, delete, truncate on all tables in schema gms_config to gms_config_application;

-- set up gms_read_only user for developers to use to connect to the database
revoke all on schema gms_config from gms_read_only;
grant usage on schema gms_config to gms_read_only;
grant select on all tables in schema gms_config to gms_read_only;


alter table configuration owner to gms_admin;
alter table configuration_option owner to gms_admin;
alter table configuration_constraint owner to gms_admin;
alter table string_constraint_value owner to gms_admin;
alter table phase_constraint_value owner to gms_admin;
alter sequence configuration_sequence owner to gms_admin;
alter sequence configuration_option_sequence owner to gms_admin;
alter sequence constraint_sequence owner to gms_admin;
alter schema gms_config owner to gms_admin;

--TODO -tpf - 1/23/20 - from MR: Not critical immediately, but gms_admin should be able to modify the schema, but no drop table/schema.
