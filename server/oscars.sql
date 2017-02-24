
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

begin;


create schema oscars;
create schema oscars_private;

create table oscars.person (
       id           serial primary key,
       name         text not null check (char_length(name) < 80),
       created_at   timestamp default now(),
       tiebreaker   integer
);

comment on table oscars.person is 'A person.';
comment on column oscars.person.id is 'Primary key for a person.';
comment on column oscars.person.name is 'Name of person.';
comment on column oscars.person.id is 'Time this person was created.';

create table oscars_private.person_account (
       person_id        integer primary key references oscars.person(id) on delete cascade,
       email            text not null unique check (email ~* '^.+@.+\..+$'),
       password_hash    text not null
);

comment on table oscars_private.person_account is 'Private information about a person’s account.';
comment on column oscars_private.person_account.person_id is 'The id of the person associated with this account.';
comment on column oscars_private.person_account.email is 'The email address of the person.';
comment on column oscars_private.person_account.password_hash is 'An opaque hash of the person’s password.';


create table oscars.category (
       id       serial primary key,
       name     text not null check (char_length(name) < 200),
       points   integer not null
);

comment on table oscars.category is 'A category of awards.';
comment on column oscars.category.id is 'Primary key for category.';
comment on column oscars.category.name is 'Name of category';
comment on column oscars.category.points is 'Number of points this category is worth.';

create table oscars.nominee (
       id    serial primary key,
       name  text not null check (char_length(name) < 200),
       category_id integer not null references oscars.category(id)
);

comment on table oscars.nominee is 'A nominee for a given category.';
comment on column oscars.nominee.id is 'Primary key.';
comment on column oscars.nominee.name is 'Name of nominee. (Person or Film)';
comment on column oscars.nominee.category_id is 'Category for this nominee.';

create table oscars.prediction (
       id    serial primary key,
       person_id  integer not null references oscars.person(id) on delete cascade,
       category_id integer not null references oscars.category(id) on delete cascade,
       nominee_id integer not null references oscars.nominee(id) on delete cascade,
       unique (person_id, category_id)
);

comment on table oscars.prediction is 'Predictions made by a particular person.';
comment on column oscars.prediction.person_id is 'Person making prediction.';
comment on column oscars.prediction.category_id is 'Category of prediction.';
comment on column oscars.prediction.nominee_id is 'Nominee predicted to win.';

--
-- Authentication/Authorization
--
-- Mostly copied from the postgraphql forum example
--

create extension if not exists "pgcrypto";

create function oscars.register_person(
  name text,
  email text,
  password text
) returns oscars.person as $$
declare
  person oscars.person;
begin
  insert into oscars.person (name) values
    (name)
    returning * into person;

  insert into oscars_private.person_account (person_id, email, password_hash) values
    (person.id, email, crypt(password, gen_salt('bf')));

return person;
end;
$$ language plpgsql strict security definer;

comment on function oscars.register_person(text, text, text) is 'Registers a single user and creates an account.';

create function oscars.nominees_by_category(categoryId integer) returns setof oscars.nominee as $$
select nominee.*
from oscars.nominee as nominee
where nominee.category_id = categoryId
$$ language sql stable;

comment on function oscars.nominees_by_category(integer) is 'Get nominees for a category';

-- postgraphql admin user
DO
$body$
BEGIN
  IF NOT EXISTS (
    SELECT *
    FROM   pg_catalog.pg_user
    WHERE  usename = 'oscars_postgraphql') THEN

    create role oscars_postgraphql login password 'xyz';
   END IF;
END
$body$;


-- anonymous user
-- DO
-- $body$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT *
--     FROM   pg_catalog.pg_user
--     WHERE  usename = 'oscars_anonymous') THEN

--     create role oscars_anonymous;
--   END IF;
-- END
-- $body$;

-- allow admin user to become anonymous user
create role oscars_anonymous;
grant oscars_anonymous to oscars_postgraphql;

-- authenticated user
-- DO
-- $body$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT *
--     FROM pg_catalog.pg_user
--     WHERE usename = 'oscars_person') THEN

--     create role oscars_person;
--   END IF;
-- END
-- $body$;

-- allow admin user to become authenticated user
create role oscars_person;
grant oscars_person to oscars_postgraphql;

create type oscars.jwt_token as (
  role text,
  person_id integer
);

create type oscars.authenticate_reply as (
  jwt_token oscars.jwt_token,
  person_id integer,
  name text
);

create function oscars.authenticate(
  email text,
  password text
) returns oscars.authenticate_reply as $$
declare
  account oscars_private.person_account;
  person oscars.person;
begin
  select a.* into account
  from oscars_private.person_account as a
  where a.email = $1;

  select b.* into person
  from oscars.person as b
  where b.id = account.person_id;

  if account.password_hash = crypt(password, account.password_hash) then
    return (('oscars_person', account.person_id)::oscars.jwt_token, person.id, person.name)::oscars.authenticate_reply;
  else
    return null;
  end if;
end;
$$ language plpgsql strict security definer;

comment on function oscars.authenticate(text, text) is 'Creates a JWT token that will securely identify a person and give them certain permissions.';

create function oscars.current_person() returns oscars.person as $$
  select *
  from oscars.person
  where id = current_setting('jwt.claims.person_id', true)::integer
$$ language sql stable;

comment on function oscars.current_person() is 'Gets the person who was identified by our JWT.';

create function oscars.current_person_predictions() returns setof oscars.prediction as $$
  select *
  from oscars.prediction
  where person_id = current_setting('jwt.claims.person_id', true)::integer
$$ language sql stable;

comment on function oscars.current_person_predictions() is 'Gets list of predictions for the current user.';

create or replace function oscars.set_prediction_for_person(
  category_id integer,
  nominee_id integer
) returns oscars.prediction as $$
#variable_conflict use_variable
declare
  prediction oscars.prediction;
  person_id integer;
begin
  person_id := current_setting('jwt.claims.person_id', true)::integer;

  select p.* into prediction
  from oscars.prediction as p
  where p.person_id = person_id
  and p.category_id = category_id;

  if prediction.id is not null then
    update oscars.prediction set nominee_id = nominee_id where id = prediction.id
    returning * into prediction;
  else
    insert into oscars.prediction (person_id, category_id, nominee_id) values (person_id, category_id, nominee_id)
    returning * into prediction;
  end if;

  return prediction;

end;
$$ language plpgsql strict ;

comment on function oscars.set_prediction_for_person(integer, integer) is 'Sets a prediction for the current person.';

create or replace function oscars.set_tiebreaker_for_person(
  tiebreaker integer
) returns oscars.person as $$
#variable_conflict use_variable
declare
  person_id integer;
  person oscars.person;
begin
  update oscars.person set tiebreaker = tiebreaker where person_id = person_id returning * into person;

  return person;
end;
$$ language plpgsql strict;

comment on function oscars.set_tiebreaker_for_person(integer) is 'Sets tiebreaker fro current person.';

grant usage on schema oscars to oscars_anonymous, oscars_person;

grant select on table oscars.person to oscars_anonymous, oscars_person;
grant update, delete on table oscars.person to oscars_person;

grant select on table oscars.prediction to oscars_anonymous, oscars_person;
grant insert, update, delete on table oscars.prediction to oscars_person;
grant usage on sequence oscars.prediction_id_seq to oscars_person;

grant select on table oscars.category to oscars_anonymous, oscars_person;
grant select on table oscars.nominee to oscars_anonymous, oscars_person;

grant execute on function oscars.authenticate(text, text) to oscars_anonymous, oscars_person;
grant execute on function oscars.current_person() to oscars_anonymous, oscars_person;
grant execute on function oscars.register_person(text, text, text) to oscars_anonymous;

alter table oscars.person enable row level security;
alter table oscars.prediction enable row level security;

create policy select_person on oscars.person for select
  using (true);

create policy select_prediction on oscars.prediction for select
  using (true);

create policy update_person on oscars.person for update to oscars_person
  using (id = current_setting('jwt.claims.person_id')::integer);

create policy delete_person on oscars.person for delete to oscars_person
  using (id = current_setting('jwt.claims.person_id')::integer);

create policy insert_prediction on oscars.prediction for insert to oscars_person
  with check (person_id = current_setting('jwt.claims.person_id')::integer);

create policy update_prediction on oscars.prediction for update to oscars_person
  using (person_id = current_setting('jwt.claims.person_id')::integer);

create policy delete_prediction on oscars.prediction for delete to oscars_person
  using (person_id = current_setting('jwt.claims.person_id')::integer);


commit;
