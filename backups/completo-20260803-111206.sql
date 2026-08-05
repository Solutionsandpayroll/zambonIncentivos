--
-- PostgreSQL database dump
--

\restrict BEUlk7n6R0c7ahEydBWMN3cZQRW7aXR90zJJq9HTznBttayMlvZeDJqxkgmaFF0

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: BatchStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."BatchStatus" AS ENUM (
    'PENDING',
    'PROCESSING',
    'IMPORTED',
    'ERROR'
);


--
-- Name: CalculationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CalculationStatus" AS ENUM (
    'DRAFT',
    'CALCULATED',
    'CLOSED'
);


--
-- Name: ComponentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ComponentType" AS ENUM (
    'MEDICINE',
    'ORDER_TAKING',
    'SELL_OUT',
    'INSTALLATION',
    'OTHER'
);


--
-- Name: ConditionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ConditionType" AS ENUM (
    'NEW_HIRE',
    'ZONE_CHANGE',
    'MANUAL_ADJUSTMENT'
);


--
-- Name: PeriodType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PeriodType" AS ENUM (
    'MONTH',
    'CYCLE'
);


--
-- Name: UserStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'BLOCKED'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
begin
    if not exists (
        select 1
        from pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    new.selected_columns = (
        select array_agg(c order by c)
        from unnest(new.selected_columns) c
    );

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: absence_or_novelty; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.absence_or_novelty (
    novelty_id text NOT NULL,
    employee_id text NOT NULL,
    period_id text NOT NULL,
    novelty_type text NOT NULL,
    start_date date,
    end_date date,
    days_affected integer,
    impact_type text,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: admin_audit_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_audit_log (
    audit_log_id text NOT NULL,
    user_id text,
    username text,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    period_id text,
    reason text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: app_user; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.app_user (
    user_id text NOT NULL,
    employee_id text,
    username text NOT NULL,
    password_hash text NOT NULL,
    user_status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    last_login_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    must_change_password boolean DEFAULT false NOT NULL
);


--
-- Name: curve_pay; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.curve_pay (
    curve_pay_id text NOT NULL,
    period_id text NOT NULL,
    component_id text,
    min_compliance_percent numeric(9,6) NOT NULL,
    pay_percent numeric(9,6) NOT NULL,
    is_ceiling boolean DEFAULT false NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee (
    employee_id text NOT NULL,
    person_id text NOT NULL,
    employee_code text NOT NULL,
    hire_date date,
    termination_date date,
    base_salary numeric(14,2) NOT NULL,
    zone_id text,
    position_id text,
    current_team_assignment_id text,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: employee_execution_kpi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_execution_kpi (
    employee_execution_kpi_id text NOT NULL,
    employee_id text NOT NULL,
    period_id text NOT NULL,
    meets_kpi boolean DEFAULT false NOT NULL,
    notes text,
    marked_by_username text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    kpi_count integer DEFAULT 1 NOT NULL,
    meets_kpi_2 boolean DEFAULT false NOT NULL
);


--
-- Name: employee_payment_condition; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_payment_condition (
    employee_payment_condition_id text NOT NULL,
    employee_id text NOT NULL,
    period_id text NOT NULL,
    condition_type public."ConditionType" NOT NULL,
    apply_80_percent boolean DEFAULT false NOT NULL,
    apply_20_percent boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: employee_team_assignment; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_team_assignment (
    employee_team_assignment_id text NOT NULL,
    employee_id text NOT NULL,
    team_id text NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    is_primary boolean DEFAULT true NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: incentive_calculation_detail; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incentive_calculation_detail (
    incentive_calculation_detail_id text NOT NULL,
    incentive_calculation_header_id text NOT NULL,
    component_id text NOT NULL,
    quota_value numeric(14,2) NOT NULL,
    sale_value numeric(14,2) NOT NULL,
    compliance_percent numeric(9,6) NOT NULL,
    curve_pay_percent numeric(9,6) NOT NULL,
    weighted_component_percent numeric(9,6) NOT NULL,
    component_incentive_value numeric(14,2) NOT NULL
);


--
-- Name: incentive_calculation_header; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.incentive_calculation_header (
    incentive_calculation_header_id text NOT NULL,
    employee_id text NOT NULL,
    period_id text NOT NULL,
    team_id text NOT NULL,
    calculation_status public."CalculationStatus" DEFAULT 'DRAFT'::public."CalculationStatus" NOT NULL,
    base_salary numeric(14,2) NOT NULL,
    component_80_theoretical numeric(14,2) NOT NULL,
    component_20_theoretical numeric(14,2) NOT NULL,
    component_80_result numeric(14,2) NOT NULL,
    component_20_result numeric(14,2) NOT NULL,
    total_incentive numeric(14,2) NOT NULL,
    guaranteed_pay_applied boolean DEFAULT false NOT NULL,
    execution_kpi_name text,
    execution_kpi_result boolean,
    execution_compliance_percent numeric(9,6),
    execution_pay_monthly boolean DEFAULT false NOT NULL,
    execution_cycle_multiplier numeric(5,2) DEFAULT 4 NOT NULL,
    calculation_version integer DEFAULT 1 NOT NULL,
    calculated_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    execution_20_mode text DEFAULT 'PAY_MONTHLY'::text NOT NULL
);


--
-- Name: org_hierarchy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.org_hierarchy (
    org_hierarchy_id text NOT NULL,
    manager_employee_id text NOT NULL,
    subordinate_employee_id text NOT NULL,
    valid_from date NOT NULL,
    valid_to date,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: period; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.period (
    period_id text NOT NULL,
    period_year integer NOT NULL,
    period_month integer NOT NULL,
    period_type public."PeriodType" DEFAULT 'MONTH'::public."PeriodType" NOT NULL,
    cycle_number integer,
    start_date date NOT NULL,
    end_date date NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    parent_period_id text
);


--
-- Name: person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person (
    person_id text NOT NULL,
    document_type text,
    document_number text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    full_name text,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: position; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."position" (
    position_id text NOT NULL,
    position_name text NOT NULL,
    description text,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: region; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.region (
    region_id text NOT NULL,
    region_name text NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    role_id text NOT NULL,
    role_name text NOT NULL,
    description text
);


--
-- Name: sales_component; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_component (
    component_id text NOT NULL,
    component_code text NOT NULL,
    component_name text NOT NULL,
    component_type public."ComponentType" NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: sales_transaction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_transaction (
    sales_transaction_id text NOT NULL,
    sales_upload_batch_id text NOT NULL,
    employee_id text NOT NULL,
    component_id text NOT NULL,
    period_id text NOT NULL,
    sale_value numeric(14,2) NOT NULL,
    sale_date date,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sales_upload_batch; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_upload_batch (
    sales_upload_batch_id text NOT NULL,
    period_id text NOT NULL,
    uploaded_by_user_id text NOT NULL,
    file_name text NOT NULL,
    file_hash text NOT NULL,
    source_format text,
    status public."BatchStatus" DEFAULT 'PENDING'::public."BatchStatus" NOT NULL,
    uploaded_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team (
    team_id text NOT NULL,
    team_code text NOT NULL,
    team_name text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    pays_20_monthly boolean DEFAULT false NOT NULL
);


--
-- Name: team_component_target; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_component_target (
    team_component_target_id text NOT NULL,
    employee_id text NOT NULL,
    component_id text NOT NULL,
    period_id text NOT NULL,
    quota_value numeric(14,2) NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: team_component_weight; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.team_component_weight (
    team_component_weight_id text NOT NULL,
    team_id text NOT NULL,
    component_id text NOT NULL,
    period_id text NOT NULL,
    weight_percent numeric(9,6) NOT NULL,
    valid_from date,
    valid_to date
);


--
-- Name: user_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_role (
    user_role_id text NOT NULL,
    user_id text NOT NULL,
    role_id text NOT NULL
);


--
-- Name: zone; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.zone (
    zone_id text NOT NULL,
    zone_name text NOT NULL,
    region_id text NOT NULL,
    active boolean DEFAULT true NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
0990d9c9-7681-4994-88a4-7052206a3be9	af36a0fc5be4d95ea86568582bddc01987053c2781b6038ecbc3d01efa80586a	2026-07-31 19:20:48.384252+00	20260721221302_init		\N	2026-07-31 19:20:48.384252+00	0
7572b163-4abc-4d39-9042-6d8f1823a546	36cc9a4e931fe3a13acda3afbf00873bdcd082723eeacf320d511fd3cfec2588	2026-07-31 19:20:56.630704+00	20260723220308_add_admin_audit_log		\N	2026-07-31 19:20:56.630704+00	0
8d8a0f2b-7228-4a15-b4da-80dfcc154d0a	001bbc69efc89d259df3cf50c2bf9617a2b65afb896bf3459841a38f97b648a9	2026-07-31 19:21:06.671929+00	20260728182817_add_must_change_password		\N	2026-07-31 19:21:06.671929+00	0
cefc6029-d19d-479f-b061-425775b3dea9	3bff576947f180a98b020e30cb503f033cb810de9baf360089c66a507c19c60d	2026-07-31 19:21:15.660268+00	20260730190217_add_employee_execution_kpi		\N	2026-07-31 19:21:15.660268+00	0
71d4eb8a-9567-47f7-a7e6-31beaf218acc	27fcd7510a0046e186c0637c03a7204676cd83edf45db0f2236fd8d0a701901e	2026-07-31 19:21:24.290704+00	20260731144222_add_period_cycle_and_pay20_monthly		\N	2026-07-31 19:21:24.290704+00	0
4b523fe9-4ad7-4e8e-81ad-c82bb81b8374	c45ab69714511628f88c7f2f0f57acc01d8329a22b9a6f3ce5244b013ffdf567	2026-07-31 19:23:57.531699+00	20260731210000_add_dual_kpi_20	\N	\N	2026-07-31 19:23:56.804453+00	1
\.


--
-- Data for Name: absence_or_novelty; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.absence_or_novelty (novelty_id, employee_id, period_id, novelty_type, start_date, end_date, days_affected, impact_type, notes, created_at) FROM stdin;
\.


--
-- Data for Name: admin_audit_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_audit_log (audit_log_id, user_id, username, action, entity_type, entity_id, period_id, reason, metadata, created_at) FROM stdin;
74862a18-98e3-4f31-8de5-40e3520ea792	\N	\N	PERIOD_SEED_YEAR	period	\N	\N	\N	{"linked": 0, "created": 15, "periodYear": 2026}	2026-07-31 20:41:41.384
\.


--
-- Data for Name: app_user; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.app_user (user_id, employee_id, username, password_hash, user_status, last_login_at, created_at, must_change_password) FROM stdin;
93292b94-e9e2-416b-aaeb-9379e1847294	94abc717-7066-43d5-a09a-a1e678e322ea	1015407446	$2a$10$VakZYxBBh1GKdZQjwPpnn.zUQxkxOpUoqtAnYyoL7ViFZXMasWM.K	ACTIVE	\N	2026-07-31 20:42:33.209	t
85e3679d-6164-4389-ba53-6f1ec1f26002	568bd957-caa9-47c9-882f-5abb3eb7b423	1019004326	$2a$10$kiQPC4J3GBmw0C0xo4M/3.dtl1thxqs5CiXCyuiO13PLsSO8lVxD2	ACTIVE	\N	2026-07-31 20:42:34.434	t
70154c5c-44a2-44a4-8fc1-a761af2a9be7	908469d1-1beb-4e2b-ba49-a09e4e290672	1030577286	$2a$10$LTsY2lRpiZiQX04l4NVif.RJCdGfHr1QIHjCgNLzarIllnfe8rNA.	ACTIVE	\N	2026-07-31 20:42:35.657	t
d81a8300-3660-4730-b24b-a693c07b3898	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	1032401557	$2a$10$hEkRjhOA4rsjMrxlGSA0H.4gkaYM05XvJ37MMgcfMXjHRqkXLmn7y	ACTIVE	\N	2026-07-31 20:42:36.875	t
f837f521-16ea-4a47-96a3-a5aa3d36343c	85869d04-2b09-4267-b058-3279c75eaed2	1037610563	$2a$10$1Hk7xYLu2RR626Cow64clugkEyWO8aZb0yULLz7vxqoDhByAKkWHK	ACTIVE	\N	2026-07-31 20:42:38.104	t
28d09722-4f9a-469b-a549-1c72ed0ea2a6	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	1047409019	$2a$10$KXv/dUJJxk5emej90A72vu16R9UBOYIvL1Hmn5flON356H1QK/52G	ACTIVE	\N	2026-07-31 20:42:40.544	t
8c6cee46-b97d-47f0-943d-2e3698610888	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	1067850307	$2a$10$Aq0p6hfvAmrVJVini8arkuxqTPl7wlDkV6AAhLNjXlD0AFM1FC27m	ACTIVE	\N	2026-07-31 20:42:41.762	t
8419806e-65a8-4f92-ab5a-28ecbfa8a689	4af5de73-9cd3-4076-b9ba-916790d2c20d	1073155355	$2a$10$IkyNbP9n71Cq0tB5N45UT.sUPbcvIFtRGco062mKdc2sV5bmufZN6	ACTIVE	\N	2026-07-31 20:42:42.989	t
3714e58e-e684-4887-94c8-f565f2478708	2be116e9-bb78-4f36-b3e8-5cb75febe48c	1088824722	$2a$10$GadXUnTiV3bz1hHLdtiljOEEskBNcRJ8flhMQGG/Zw3cBYJJvoemq	ACTIVE	\N	2026-07-31 20:42:44.208	t
c482d065-ddd9-4717-b32f-db51feaf7499	3281596d-274f-42db-8c78-59b2fcb694fa	1093747284	$2a$10$IAbmlnUTZxfz6LjHpetS.OQ6156JTcci4smtTXWTXrrkWryoNKa6q	ACTIVE	\N	2026-07-31 20:42:45.432	t
d7bb844b-6064-4d0e-b57b-f0d6807fe77d	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	1098622018	$2a$10$cuM3itfYpWYsQChVMC2fL.yzgHnh826uaDOuaSaVuvDM0BMUxxScW	ACTIVE	\N	2026-07-31 20:42:46.659	t
8c3f9427-a772-46f3-9b2b-baf34d30e56d	fdc627f6-ba48-4173-89e8-2f2ac83294c3	1098666680	$2a$10$MzB.Ii0XdXEyV7CH.kOSmetAYuptj8Ei3LI/2MTmOP/t8MgUcHokO	ACTIVE	\N	2026-07-31 20:42:48.01	t
e5b6fc32-6015-439a-933c-3d17fc25048d	7bcd7425-b4d4-427a-b63c-464e239749e9	1110495490	$2a$10$dlJIgXF6437Hstbdy3e9zekozGexbYBF/N8I8Z5M4GTSGpUNwYK9.	ACTIVE	\N	2026-07-31 20:42:49.225	t
b5108bb6-d4a6-4c04-9d6a-f09fe98d06b5	b31cf00e-36aa-4307-8e7e-893bb1261218	1130593528	$2a$10$5p.GTE1e7d.J7QNw5UMjku3Rz6F8oxEp7qh6HjlLtbgy4veAD3qHy	ACTIVE	\N	2026-07-31 20:42:50.449	t
191b05ec-0269-4344-b1cc-fd1b9ef75848	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	1130665764	$2a$10$ez926rm/J.tu69lRHJRLAOnfwxw4TsurDIaogMV6WO/9iE4VkPUz6	ACTIVE	\N	2026-07-31 20:42:51.67	t
f9bee2c9-cb42-4ca3-bf5b-8d9ecec46ea7	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	1140815359	$2a$10$tF7exvHJDwgTPQJjnH/Xs.Oexeq84ZLrl/hSsS.Cv/Elhfk6yrYSu	ACTIVE	\N	2026-07-31 20:42:52.873	t
b9da30b7-0ccd-423d-b1f5-5e2f0bc731e2	08567c88-1fbd-4ce4-b43d-9d431dff232f	1151950260	$2a$10$TkG3Y0.BLOpVehpLmsTNp.DXv6u71Ez7Vv5F2vBvCfoaH/Hn/emuK	ACTIVE	\N	2026-07-31 20:42:54.122	t
d8640901-4335-4b00-9dae-37a5031173d8	f3f64149-89b9-4cdb-a2c2-d544f9bc930c	1233894053	$2a$10$xSZxlHCq3gRBfoM9VPejl.9aseVwIYljjb7qnsmzBm5r3eGNQWPnq	ACTIVE	\N	2026-07-31 20:42:55.327	t
16ba34dd-ad8f-4e1b-8563-90b20e92b721	b1d64090-41a3-466b-9a34-e03d5655a418	16716795	$2a$10$zP3Ge9Eej8hiZJpTQKOl0OLUjQ.UyvoO9jErGl2VbRjPSgc0rjCje	ACTIVE	\N	2026-07-31 20:42:56.555	t
065963c7-b190-4b67-8ca3-a8a4c4475207	328b9de3-a19b-4be0-ac71-140f8fdc1060	22478211	$2a$10$FFaMI/k3U23UPugjp653NeOlkdC/1mOfwpy7Tm2plkBzWUQ8DbtBi	ACTIVE	\N	2026-07-31 20:42:57.771	t
ae2fc1af-1e98-443a-9418-e705033740c2	5f0868d5-bfd2-44e7-93e2-cd92ee065678	22705592	$2a$10$Az91CZSEL0iO11tuh5j4P.Zoim3rGVnJjHo6xZ/V/jjEafsSmtlnS	ACTIVE	\N	2026-07-31 20:42:58.988	t
8248a4cc-2ac9-421b-bbcd-4c202b968e27	4d388595-f713-4573-ad2d-852612de70d2	26946191	$2a$10$rwzYMu2GAhEl553FVNgv6eLxWZAHEDXWSJpgL7hy0eSmINlY37iqm	ACTIVE	\N	2026-07-31 20:43:00.209	t
43c88d62-2a20-4354-a424-b1b6fec7ef17	88a2b56f-c9f6-49f5-8282-e2ac1237661d	27111025	$2a$10$NbydMWLcxsbtc52qZ73e0.5.jTOB2Fx5ZYhQNeTTRjbgCRW18UeLe	ACTIVE	\N	2026-07-31 20:43:01.434	t
cb28b9a6-a3fd-4852-b992-d59dd51f8eb6	96ec8d2e-4828-4c91-916d-f995d755d146	31309556	$2a$10$2A2ORq7zX3m6U4FRyLEdzuNo.Fh8xk7JGqje.DpZd6P04VWO.NSTy	ACTIVE	\N	2026-07-31 20:43:02.642	t
3b204116-82be-44d6-869c-0143650d0c77	298646e0-9b2f-4de1-8626-8274d5f997f1	36285347	$2a$10$LmoKh3wgSYTXJv.7bsNzRO4oo33zrY7zCd6wO1VqJhFCwK1EaJ7Sm	ACTIVE	\N	2026-07-31 20:43:04	t
e83f7be4-f6a0-4d65-bfbb-cbcbbcee45c1	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	39752595	$2a$10$zANFvZByG7WtkhdQ.c/EF.1NHk7kjfRNRRW476eRWJlcD1JCXHpea	ACTIVE	\N	2026-07-31 20:43:05.227	t
1ca46d70-af3a-46b2-b8ee-5deda261083b	b644dfc7-5553-4889-8920-daa15b355715	42150191	$2a$10$hxxLJrhka0ytE273BJSeZeuDK9qRDETqkjahrQ9nCA1Ihzcsw/mP2	ACTIVE	\N	2026-07-31 20:43:06.445	t
19e6bb58-3d52-4bf1-8d53-c1e94dd757aa	4cadfad4-f521-4435-ab0e-76311c4b9928	42163808	$2a$10$51IU6HjaxzfLlLALZb6WaOLfh7wVz0pTJUIwoA4/GoYYXtaOFN976	ACTIVE	\N	2026-07-31 20:43:07.654	t
4bc1ac85-d568-404a-a8d9-02a199fc33f1	06b2473b-4e72-417c-879d-ae9104996738	1045723571	$2a$10$2PqmVVD9QSizVe8Z51dbmeMktDjDuRzGdai.Ad/c8pjiyutrY0j9i	ACTIVE	2026-08-01 00:07:59.544	2026-07-31 20:42:39.324	t
79a29d51-e5a3-4482-97ad-ef541ea762a4	\N	admin	$2a$10$DL0L.WE4gvkjq5pC2HkJM.7hz0qCfpUxR8Tl3KQfaELS50nnMNbaW	ACTIVE	2026-08-03 13:15:44.922	2026-07-31 20:36:06.867	f
6437d73f-c56c-4cc4-a077-ed992f565971	3ab409a6-021a-411f-a0a0-be1bb88d0faa	43455696	$2a$10$Mb8aOO453wnJO1mEgjb/VO29Kjrzt7m6h.sB9SKYjfF9B2gfstfw6	ACTIVE	\N	2026-07-31 20:43:08.869	t
510ad4ea-cb96-4dae-92bc-0397cae696f6	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	52370115	$2a$10$2ghp56scsT/n6xPcVKam.OQ7x0Ye7XVFv6CAyjLDhEC6sueYhN20e	ACTIVE	\N	2026-07-31 20:43:10.085	t
47499212-67d4-4794-9274-cde0d28f393d	913808aa-f12d-4bd1-8009-79f44eb4dd01	52901968	$2a$10$.IfPCGjysybLZCaxNABvjeX4GWvs0Fcg10QZi9ozwdTnEjp14ZK2a	ACTIVE	\N	2026-07-31 20:43:11.299	t
58096d32-8128-4262-b393-6557d089cbea	5c4c9cbc-516d-4db8-b2cb-23f8f697d436	52905378	$2a$10$OUwBzbNaq06nhy2iNuBcBeooc2FFGLjup/m0vj7D95CswXtldkdom	ACTIVE	\N	2026-07-31 20:43:12.516	t
2403fd8d-9266-4c5c-b646-ce82ed76dd7a	d845bba5-0bad-40ff-83af-4be067bcf13b	52957210	$2a$10$1OsQjfT6D3CqwSa8StLC1ehGnn6LvmyxrULGmqXGVqeLaUkSRfgBy	ACTIVE	\N	2026-07-31 20:43:13.724	t
9d379748-e46f-4b7d-926a-20ab70d985f6	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	52965381	$2a$10$d.5kZDIdwSUO2CN1C.x2kuVaXiMRyF.oO1GzNjz5WLGAJo4CFBkbO	ACTIVE	\N	2026-07-31 20:43:14.957	t
4fa016ca-fd9d-4254-9c4a-4e4444982fcd	cbecff4e-5b38-4ab5-8297-8fd9479a668f	53167389	$2a$10$HoEwj4s1Sz1POFi.WNWRUunoO3o8ZThaV13UOg2bMdMjuGNbb.ZU6	ACTIVE	\N	2026-07-31 20:43:16.171	t
3ea05464-afad-4fdc-a3a5-5448c295dd38	4026bca6-7f2f-4e9f-adc1-2027d608a689	67041861	$2a$10$41lxVDX49B6OxG9sTc8WPukta9To6iya6COM7O7gR9bzbas8Fw0SG	ACTIVE	\N	2026-07-31 20:43:17.38	t
d3e0c502-6495-40bf-85df-b9de1d419507	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	71646230	$2a$10$EkXLDC1Qy.aJlaMqc5THRen0lU0hcM8srCU2rc9UvJKszJqY8YyzG	ACTIVE	\N	2026-07-31 20:43:18.576	t
dea72c26-f473-49f9-add0-6fb074004160	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	7169722	$2a$10$8lsIm1OHtWxt45oxQfrpf.IgrreaVxOjPibNlkDFt54gtYlDxWZ26	ACTIVE	\N	2026-07-31 20:43:19.927	t
c66e9f78-cb30-474e-82ff-4a445ca48d55	7991b028-888d-404d-abae-ecf4f479483c	72131017	$2a$10$256oMZo7OJuj2oCir7fuRufQIqiMG6BLdFyc8kjRz.fYxQmuT3Tfm	ACTIVE	\N	2026-07-31 20:43:21.143	t
3de98f38-53c2-4cbc-87a0-cf4d30226b7a	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	72134866	$2a$10$E0kE0S7IG6oDxvz3grCtN.97856tTARTWdn.38NqUeQX60aujq9YG	ACTIVE	\N	2026-07-31 20:43:22.363	t
62a009de-75bb-4900-b990-9944ae743190	09786243-3caa-4d88-ad8c-2dcfbb0db897	72165327	$2a$10$UZ3Q9n5BINFjCNgLs23KPOnt.GJW9FxEUP8QxYMnuJsMHQTVBdvkS	ACTIVE	\N	2026-07-31 20:43:23.6	t
61249960-9a40-4bcc-bff8-226b5dfae65a	62a94640-4e13-466c-a7a9-2e0be0181da8	79302779	$2a$10$glIp2NORzFKYftzZ2vqbluPJ12Lp0BR.L3xYFl3PdT7ByNOLJ/6qq	ACTIVE	\N	2026-07-31 20:43:24.859	t
a52d342d-7354-4d21-8cfd-85f7012459a4	4ad79f15-b0c4-4dad-89ae-5aa82767f698	79395939	$2a$10$jFsIC83nWKQ0LX781Rypp.XhEWiSMKbuDshUwjaSq/cRjx/gg2gf6	ACTIVE	\N	2026-07-31 20:43:26.114	t
93750857-296b-40c1-adc1-a31532674b46	da4c35c9-7e96-480d-9449-3f62853938d4	79435411	$2a$10$8JyAHDjRxcYRDaG3dbwhl.MmtpVsr1jgwv3OiU7X1.8G409HA6HqK	ACTIVE	\N	2026-07-31 20:43:27.347	t
88579549-5132-4ec8-853b-b8dbf337b422	278e2c63-012a-4727-ae52-66cc7adc4aba	79528550	$2a$10$hsDqnH0rKm0K5yvsplcuV.DlBiu3JYOsJfhkqUYWDjNZNHhyr8Lgi	ACTIVE	\N	2026-07-31 20:43:28.571	t
86ad9cd1-6377-4282-86a6-67e49fc7172a	d1186eb3-89fe-4586-b32c-162f332fa732	79791421	$2a$10$mbfyJUuKtQ7kEnjinH6sSuoWJj0kknswdofGMjE36tga0pSVFRH7C	ACTIVE	\N	2026-07-31 20:43:29.783	t
1deb255f-97dd-4122-b5fb-0bdb18713f50	94f089ae-ceb7-4320-a11d-2267e8ba8408	79881218	$2a$10$13Tao9c9KPnU32PZeyLGTevUAO8ilwcd7kFDpjkNjOf.pzH2hr.zi	ACTIVE	\N	2026-07-31 20:43:31.002	t
655d49a3-f35b-44fa-9d65-6f4cf8d70960	93164df6-4a7c-40cc-a047-b5a6ad42843c	80016905	$2a$10$mNzeCRsFc5.oNl2dSCH0qOxNm3LQjwORPjNMmq8eSaeixaoKwHNPa	ACTIVE	\N	2026-07-31 20:43:32.211	t
0aa4c096-cf97-499b-a9a4-b1d734e06ad0	925b97c8-722d-4767-8845-3553e5747fbc	8747836	$2a$10$a0anDWgSrYB3vjYUbvH/A.w4dYGzd6OJmeAIV5tvkhEhmU9W.kILu	ACTIVE	\N	2026-07-31 20:43:33.423	t
5feffdd6-d2af-4fd1-b8f7-f9df3a0f36dd	dac88712-975d-473b-8c88-d44e7c579d23	91270100	$2a$10$mIlJ9TZbVdKztBQltvkOpO44oiy4ixnplmKiiKbehAJtXYH01yWve	ACTIVE	\N	2026-07-31 20:43:34.638	t
8a48962d-1db6-4eb1-82d7-7f6c754d23ac	8c774552-83f9-44bd-8a3b-a3730dad0e22	94071018	$2a$10$Cq8A7nBdGV4WRcTFHkd/VO193S0.aN3yHVceoWLRH36irFJNX0p5m	ACTIVE	\N	2026-07-31 20:43:35.989	t
\.


--
-- Data for Name: curve_pay; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.curve_pay (curve_pay_id, period_id, component_id, min_compliance_percent, pay_percent, is_ceiling, active) FROM stdin;
fd4c9d6e-d09d-4418-b3e5-5cd9228648b3	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.900000	0.500000	f	t
d0e4f190-a646-437a-81bc-a841d3236a96	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.910000	0.550000	f	t
22e99d95-5002-492f-a04e-ade5d0655f81	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.920000	0.600000	f	t
de735cf0-89fd-4d4e-8ef9-341615cb6089	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.930000	0.650000	f	t
526e4219-e9e7-4ab5-853a-ac85207b401d	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.940000	0.700000	f	t
ea87060c-f923-4ec3-9eea-9894f6ccd514	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.950000	0.750000	f	t
53a8c094-f0fd-40f9-9987-83da274f0aa4	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.960000	0.800000	f	t
f4aa5d44-3e6f-4f48-b88a-4c7a37841154	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.970000	0.850000	f	t
38944748-c7a1-4ce2-825f-d35527b37b81	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.980000	0.900000	f	t
a72c140f-a977-4613-bd98-7a0454878b38	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	0.990000	0.950000	f	t
549534f1-d04f-49df-a656-f8f49314f4e0	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.000000	1.000000	f	t
50596cad-2704-434c-9560-3d83ba9d64f0	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.010000	1.030000	f	t
2ed57d99-24b0-4ffe-ab2a-9c49167df914	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.020000	1.050000	f	t
3393a872-e676-46eb-9b93-4b7bd2cdcbf5	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.030000	1.080000	f	t
0b6c9442-8bae-425d-b559-6be6289a2a87	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.040000	1.103333	f	t
ff20da9a-3b26-4d4f-81f9-9d2c39b510ae	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.050000	1.128333	f	t
b2985c6c-72be-43ae-88c4-b2591b08967e	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.060000	1.153333	f	t
2bb3d7c5-9d47-407c-a3b5-111baeed15ab	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.070000	1.178333	f	t
3cae6ad3-8582-46dc-819e-67882ef34869	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.080000	1.203333	f	t
e93a1678-b996-44f1-b685-bb992241b616	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.090000	1.228333	f	t
e6ebfbbc-a6ba-4196-bc2e-c57849ab4c3e	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.100000	1.253333	f	t
8cb300de-0043-4a6b-a0cc-3d8ae05ff90d	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.110000	1.280000	f	t
c9ae159c-bad5-43a0-b242-25d0acdb6d33	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.120000	1.300000	f	t
d4c1ab86-2983-4d11-9f4a-fc9bb5a74c95	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.130000	1.330000	f	t
eb60809d-bc23-49b3-8c97-32d492a1ec8d	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.140000	1.350000	f	t
41ebca79-eb96-44b5-aa51-4991664e00dc	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.150000	1.376667	f	t
27253e7f-ba09-4e4a-b5fc-5658dadc38c9	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.160000	1.401667	f	t
7fdf07de-6283-4b0b-9b56-95858be38ea0	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.170000	1.426667	f	t
cbe3eb51-ba0d-454d-86d9-3893d0c19073	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.180000	1.451667	f	t
aa02e28f-5f2c-4f8e-925e-3dc3fee3a631	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.190000	1.476667	f	t
1e5dfa72-5b23-4ffa-97a5-1ab8da4a5fb7	5e677d8f-5dec-45ba-ae26-c53c55965577	\N	1.200000	1.500000	t	t
\.


--
-- Data for Name: employee; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee (employee_id, person_id, employee_code, hire_date, termination_date, base_salary, zone_id, position_id, current_team_assignment_id, active) FROM stdin;
5f0868d5-bfd2-44e7-93e2-cd92ee065678	05b6c5ba-ce98-409e-9fb1-ca2f12666de3	EMP-22705592	2026-04-06	\N	0.00	74b77bcb-7b56-480c-a59d-af4efc114524	102a2b79-97cd-4daa-b259-b7894b09a58f	\N	t
08567c88-1fbd-4ce4-b43d-9d431dff232f	135fefba-d022-48c0-b1cd-d96ccf54681a	EMP-1151950260	2025-06-05	\N	0.00	b83f34d8-09ab-4210-a266-14f016c68e57	102a2b79-97cd-4daa-b259-b7894b09a58f	\N	t
3281596d-274f-42db-8c78-59b2fcb694fa	ee7cb655-9f28-4e65-bc30-53eafe7f0002	EMP-1093747284	2026-04-06	\N	0.00	97c6cf2e-d3c9-4c0d-a38c-06e93df64b7e	102a2b79-97cd-4daa-b259-b7894b09a58f	\N	t
5c4c9cbc-516d-4db8-b2cb-23f8f697d436	2b696d62-0a34-4ec5-be53-fd71970981ca	EMP-52905378	2026-04-06	\N	0.00	61a1a549-6618-48a6-8c08-19686a0e094a	102a2b79-97cd-4daa-b259-b7894b09a58f	\N	t
7bcd7425-b4d4-427a-b63c-464e239749e9	d1d40a15-b60a-4fcd-b9ff-0fd31cb6b1b6	EMP-1110495490	2021-10-12	\N	930720.00	67a56147-7245-4827-87b1-3378ac64c4c0	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	8aec862e-3999-45ed-b215-8573cf110bd7	EMP-1047409019	2021-09-06	\N	914100.00	d5b7d6ed-616c-4d13-ba10-2cd4bbb4135b	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
b31cf00e-36aa-4307-8e7e-893bb1261218	f96cbe1a-9f42-4171-ba81-7aab44a192ff	EMP-1130593528	2024-10-21	\N	831000.00	b83f34d8-09ab-4210-a266-14f016c68e57	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	d3cdf8a1-8328-4662-9488-17f589b33611	EMP-1098622018	2022-06-01	\N	914100.00	458a2322-3b05-49a1-b581-6945c9edc811	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
4d388595-f713-4573-ad2d-852612de70d2	098f4aab-9e89-44d3-8c8f-1143d1b105f7	EMP-26946191	2017-05-02	\N	914100.00	74b77bcb-7b56-480c-a59d-af4efc114524	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
3ab409a6-021a-411f-a0a0-be1bb88d0faa	667c9894-c33f-4ca8-9498-2d5a4a089cee	EMP-43455696	2023-04-10	\N	930720.00	105dfef4-2a36-4e98-8900-c162d57f842a	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
2be116e9-bb78-4f36-b3e8-5cb75febe48c	884a448f-62e3-4f12-98f5-6235b9d770f2	EMP-1088824722	\N	\N	831000.00	\N	10629b85-1bf8-4912-835e-fc170dbde791	\N	t
e90d4f95-62f7-4dc2-b065-3774cf35d9a4	762e08fc-db1f-40a0-9c99-496edaf669b6	EMP-1067850307	2021-10-12	\N	914100.00	15bb8d60-8371-47a4-98c3-b1400d635373	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
06b2473b-4e72-417c-879d-ae9104996738	79ff9f43-0e42-4567-8917-64494f63fcf3	EMP-1045723571	2021-10-12	\N	914100.00	74b77bcb-7b56-480c-a59d-af4efc114524	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	22b0d45a-7fa3-481f-aa47-1a8186137205	EMP-1032401557	2024-05-20	\N	914100.00	176802d1-7242-46de-aa24-42d8fdfa57da	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
fdc627f6-ba48-4173-89e8-2f2ac83294c3	0496bb28-775f-49dd-9bcb-ad0600490a40	EMP-1098666680	2021-10-11	\N	914100.00	458a2322-3b05-49a1-b581-6945c9edc811	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
85869d04-2b09-4267-b058-3279c75eaed2	9971397c-c374-4bc8-967d-21a9b761cfb9	EMP-1037610563	2021-02-01	\N	930720.00	105dfef4-2a36-4e98-8900-c162d57f842a	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
908469d1-1beb-4e2b-ba49-a09e4e290672	e8ddd786-bf83-4fe1-9ee1-bfd6752d9d66	EMP-1030577286	2021-09-22	\N	914100.00	176802d1-7242-46de-aa24-42d8fdfa57da	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
4af5de73-9cd3-4076-b9ba-916790d2c20d	6277af4d-11f8-4c9f-90f1-fb04e703e256	EMP-1073155355	2021-09-06	\N	914100.00	176802d1-7242-46de-aa24-42d8fdfa57da	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
94abc717-7066-43d5-a09a-a1e678e322ea	1ce14957-855a-4a3b-abbb-55ead34898a8	EMP-1015407446	2024-06-17	\N	914100.00	176802d1-7242-46de-aa24-42d8fdfa57da	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
530246e9-b30b-40cf-a7aa-1c8b3f2e0855	26fe9866-715c-4c77-bdca-27a382ee202f	EMP-52370115	2017-05-02	\N	914100.00	176802d1-7242-46de-aa24-42d8fdfa57da	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
cbecff4e-5b38-4ab5-8297-8fd9479a668f	5153c086-a3ce-49d2-a2cd-d2afead92eab	EMP-53167389	2021-02-01	\N	831000.00	176802d1-7242-46de-aa24-42d8fdfa57da	59240d1d-a408-482e-a4f2-e9269111c91e	\N	t
4cadfad4-f521-4435-ab0e-76311c4b9928	3302b933-3a98-4f41-a50c-4cf4564fae0f	EMP-42163808	2017-05-02	\N	2626250.00	b83f34d8-09ab-4210-a266-14f016c68e57	88d15cf5-b98b-43fe-a6be-af4512dfbd3b	\N	t
93164df6-4a7c-40cc-a047-b5a6ad42843c	24f6f7f9-579a-40cc-a771-aadd82bb3b59	EMP-80016905	2020-02-17	\N	2554625.00	176802d1-7242-46de-aa24-42d8fdfa57da	88d15cf5-b98b-43fe-a6be-af4512dfbd3b	\N	t
b1d64090-41a3-466b-9a34-e03d5655a418	92a26463-40e7-4d86-ac2b-5ab7d32b3cf3	EMP-16716795	2019-04-03	\N	2099097.00	b83f34d8-09ab-4210-a266-14f016c68e57	1e74f6f2-d7fc-4831-ad0f-4cd754643845	\N	t
4ad79f15-b0c4-4dad-89ae-5aa82767f698	d9f6a61b-7813-4d3f-acc3-2e5757f61303	EMP-79395939	2019-04-03	\N	2099097.00	176802d1-7242-46de-aa24-42d8fdfa57da	1e74f6f2-d7fc-4831-ad0f-4cd754643845	\N	t
88a2b56f-c9f6-49f5-8282-e2ac1237661d	e2ccc058-a789-4d95-a86b-977e555cf0a7	EMP-27111025	2017-05-02	\N	1768965.00	19724f15-714d-4f6c-8332-2c31644dcb38	bbd4d2a9-3740-4d03-a35a-837ad7bb669e	\N	t
925b97c8-722d-4767-8845-3553e5747fbc	5f8ddd22-701a-4a02-ac2f-046a233940a9	EMP-8747836	2014-03-30	\N	2504565.00	74b77bcb-7b56-480c-a59d-af4efc114524	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
d845bba5-0bad-40ff-83af-4be067bcf13b	3ebc9a54-a97e-4791-b1da-e2df680d1e90	EMP-52957210	2021-02-10	\N	2528418.00	176802d1-7242-46de-aa24-42d8fdfa57da	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
9273403c-5dd2-4cbd-bef2-9adb1f80cddf	04b103d4-0392-4aa4-8312-9abe12113aea	EMP-52965381	2013-09-16	\N	2504565.00	176802d1-7242-46de-aa24-42d8fdfa57da	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
96bb5d75-fa93-46a1-949f-d50f2c01e4ab	cd9eef46-3341-4a73-96ce-54316e03d5b2	EMP-1140815359	2022-05-09	\N	2576124.00	105dfef4-2a36-4e98-8900-c162d57f842a	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	0e2ba710-50c7-4199-93c1-a047f2b5e92c	EMP-71646230	2022-05-09	\N	2528418.00	105dfef4-2a36-4e98-8900-c162d57f842a	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
d1186eb3-89fe-4586-b32c-162f332fa732	0bb7bb11-f26f-47bc-9edd-c191df2c3ded	EMP-79791421	2017-01-10	\N	2528418.00	b83f34d8-09ab-4210-a266-14f016c68e57	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
278e2c63-012a-4727-ae52-66cc7adc4aba	869e8f76-87b1-434d-9f8f-82538805872b	EMP-79528550	2013-10-07	\N	2528418.00	176802d1-7242-46de-aa24-42d8fdfa57da	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
913808aa-f12d-4bd1-8009-79f44eb4dd01	b669d785-65eb-403a-9bf6-35d9548dc4be	EMP-52901968	2007-05-10	\N	2504565.00	176802d1-7242-46de-aa24-42d8fdfa57da	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
6947f967-a59a-4cdd-b8f4-dcbb8c15272b	c0aa9f4b-fbad-4de6-8dff-f7666bbd003f	EMP-72134866	2013-05-20	\N	2504565.00	74b77bcb-7b56-480c-a59d-af4efc114524	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
b644dfc7-5553-4889-8920-daa15b355715	13add797-f642-4d78-8a1e-b08da8f649b0	EMP-42150191	2007-05-10	\N	2576124.00	61a1a549-6618-48a6-8c08-19686a0e094a	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
298646e0-9b2f-4de1-8626-8274d5f997f1	c278faf5-998d-4834-a370-75211e38b61b	EMP-36285347	2017-05-02	\N	2743095.00	176802d1-7242-46de-aa24-42d8fdfa57da	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
dac88712-975d-473b-8c88-d44e7c579d23	1111a9a6-7e7c-4ea5-b366-cdecbdd5579a	EMP-91270100	2023-06-02	\N	2552271.00	458a2322-3b05-49a1-b581-6945c9edc811	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
328b9de3-a19b-4be0-ac71-140f8fdc1060	60067a8e-9b5c-4e2b-8f09-718a97c446e1	EMP-22478211	2009-07-21	\N	2504565.00	74b77bcb-7b56-480c-a59d-af4efc114524	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
09786243-3caa-4d88-ad8c-2dcfbb0db897	c82d9194-15b0-46ab-9b64-c7d7323001f0	EMP-72165327	2017-05-08	\N	2504565.00	15bb8d60-8371-47a4-98c3-b1400d635373	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
4026bca6-7f2f-4e9f-adc1-2027d608a689	bdd4e03f-55da-4bf9-a1e4-27fac219a1d7	EMP-67041861	2017-05-02	\N	2385300.00	b83f34d8-09ab-4210-a266-14f016c68e57	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
568bd957-caa9-47c9-882f-5abb3eb7b423	623d1002-dab0-485c-bc01-981d32b8ed7c	EMP-1019004326	2023-04-11	\N	2552271.00	176802d1-7242-46de-aa24-42d8fdfa57da	14e86863-eef3-4cfe-85bd-d454ccd29802	\N	t
20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	2daa9d72-4ec8-4ed6-93a6-044dab9a3519	EMP-39752595	1996-01-11	\N	3849325.00	176802d1-7242-46de-aa24-42d8fdfa57da	2df97ea9-b9d8-4518-bb0a-0981c774b8a3	\N	t
8c774552-83f9-44bd-8a3b-a3730dad0e22	7ab9b8ba-a4c9-470b-86f2-c2b772fcbb82	EMP-94071018	2010-01-12	\N	3777375.00	b83f34d8-09ab-4210-a266-14f016c68e57	2df97ea9-b9d8-4518-bb0a-0981c774b8a3	\N	t
7991b028-888d-404d-abae-ecf4f479483c	9cb28911-5fa6-46de-a66b-946c6f5dab35	EMP-72131017	2010-01-12	\N	3597500.00	74b77bcb-7b56-480c-a59d-af4efc114524	2df97ea9-b9d8-4518-bb0a-0981c774b8a3	\N	t
f3f64149-89b9-4cdb-a2c2-d544f9bc930c	5b83400f-2d0d-46e2-b1c0-3bc1de5ace31	EMP-1233894053	2023-08-15	\N	750000.00	176802d1-7242-46de-aa24-42d8fdfa57da	3a522061-c47a-4384-b07a-753cb67e801d	\N	t
da4c35c9-7e96-480d-9449-3f62853938d4	d302cdd9-bd00-4a72-80da-2877a4b2672e	EMP-79435411	2009-05-07	\N	3594250.00	176802d1-7242-46de-aa24-42d8fdfa57da	3a522061-c47a-4384-b07a-753cb67e801d	\N	t
94f089ae-ceb7-4320-a11d-2267e8ba8408	a5d639bb-0256-4118-8588-0524b534480d	EMP-79881218	2026-01-14	\N	3757625.00	176802d1-7242-46de-aa24-42d8fdfa57da	3a522061-c47a-4384-b07a-753cb67e801d	\N	t
54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	3b0030e1-c650-4d14-b40c-7b95642e15e7	EMP-1130665764	2022-09-26	\N	3757625.00	b83f34d8-09ab-4210-a266-14f016c68e57	3a522061-c47a-4384-b07a-753cb67e801d	\N	t
62a94640-4e13-466c-a7a9-2e0be0181da8	67aa198b-8cd1-4a01-86e6-9aa3244af9a7	EMP-79302779	\N	\N	3267500.00	\N	3a522061-c47a-4384-b07a-753cb67e801d	\N	t
c8f2d92c-7662-4b2e-9a08-8c453fb5853d	b5695357-6316-4fab-9aff-bab51cb271f5	EMP-7169722	\N	\N	3300000.00	\N	e7dc3e9c-229b-4952-b39b-970b62543852	\N	t
96ec8d2e-4828-4c91-916d-f995d755d146	1e64f791-80e3-4f35-9083-385d7b7037cf	EMP-31309556	\N	\N	2200000.00	\N	3d83e7b9-8d61-45c8-b4d0-ece17cb46724	\N	t
\.


--
-- Data for Name: employee_execution_kpi; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_execution_kpi (employee_execution_kpi_id, employee_id, period_id, meets_kpi, notes, marked_by_username, created_at, updated_at, kpi_count, meets_kpi_2) FROM stdin;
\.


--
-- Data for Name: employee_payment_condition; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_payment_condition (employee_payment_condition_id, employee_id, period_id, condition_type, apply_80_percent, apply_20_percent, notes, created_at) FROM stdin;
6dd13ad1-7b9f-4a73-8c74-b16c1a9c9e57	328b9de3-a19b-4be0-ac71-140f8fdc1060	ad89f431-8d44-41af-a0ba-fab83b4cf70e	MANUAL_ADJUSTMENT	t	f	Pago garantizado del 80% — calculocomisiones.xlsx, hoja "REP. VM (E+X)", marca *PAGO GARANTIZADO	2026-07-31 20:47:32.581
523e3708-8321-461d-8b31-ec58a01c849b	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	ad89f431-8d44-41af-a0ba-fab83b4cf70e	MANUAL_ADJUSTMENT	t	f	Pago garantizado del 80% — calculocomisiones.xlsx, hoja "REP. VM (E+X)", marca *PAGO GARANTIZADO	2026-07-31 20:47:33.123
\.


--
-- Data for Name: employee_team_assignment; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_team_assignment (employee_team_assignment_id, employee_id, team_id, valid_from, valid_to, is_primary, active) FROM stdin;
6ac76bc5-2db4-4edb-92c0-27dd809354e5	925b97c8-722d-4767-8845-3553e5747fbc	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2014-03-30	\N	t	t
2d04e1c6-6358-4803-8f49-8705de3a6849	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-10-12	\N	t	t
77e4be76-970b-40d2-927e-8f650a5d88ac	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	1996-01-11	\N	t	t
8ce22d13-3386-4d22-8bbb-5f6c4e6a4f43	da4c35c9-7e96-480d-9449-3f62853938d4	205282ef-3374-4d6d-891d-f51a67e2a1f5	2009-05-07	\N	t	t
0ae94c0b-f475-4663-bf74-2f68ce259a5d	d845bba5-0bad-40ff-83af-4be067bcf13b	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2021-02-10	\N	t	t
ca2b2c56-c48c-438b-a207-6602455614dd	06b2473b-4e72-417c-879d-ae9104996738	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-10-12	\N	t	t
dba379fa-7c83-4f7c-8c7e-a31d3889f4fd	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2013-09-16	\N	t	t
c00946ab-b0ff-48cf-8449-14d7f54a567d	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	c4f8fcad-660e-4aee-a188-a7da46ba040f	2024-05-20	\N	t	t
adf8108e-33b9-4a3a-9231-62d89a390ff1	fdc627f6-ba48-4173-89e8-2f2ac83294c3	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-10-11	\N	t	t
66d16bf7-3e03-46b8-8c98-17d56a8a2525	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2022-05-09	\N	t	t
6c8f985d-8334-4d15-b946-5d7b63445fd7	88a2b56f-c9f6-49f5-8282-e2ac1237661d	514e007a-79c7-4e83-be17-6cf95e82cb41	2017-05-02	\N	t	t
280386e6-5242-4410-8cf2-f0f0890cbc96	85869d04-2b09-4267-b058-3279c75eaed2	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-02-01	\N	t	t
572ff353-74eb-48a1-9c91-506650bd11c8	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2022-05-09	\N	t	t
3d11183a-1ae6-4fd7-8a36-24220c23c9dc	d1186eb3-89fe-4586-b32c-162f332fa732	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2017-01-10	\N	t	t
c93a5206-3322-4d99-9156-1f38f58cc27e	278e2c63-012a-4727-ae52-66cc7adc4aba	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2013-10-07	\N	t	t
937aacdc-39ca-4120-b6dc-b3bf94a12958	7bcd7425-b4d4-427a-b63c-464e239749e9	40c03523-202d-4eb3-8c06-011afd8a691c	2021-10-12	\N	t	t
de76d1f5-088b-4e56-8dd0-ccdfe3c1cb3c	908469d1-1beb-4e2b-ba49-a09e4e290672	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-09-22	\N	t	t
a6866221-46a0-47f7-a9c0-d8beb3073bfc	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	40c03523-202d-4eb3-8c06-011afd8a691c	2021-09-06	\N	t	t
04ade760-0d47-4fa2-abed-f4400f22f686	913808aa-f12d-4bd1-8009-79f44eb4dd01	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2007-05-10	\N	t	t
4a1a962a-9482-4240-9c69-72b85538b531	b1d64090-41a3-466b-9a34-e03d5655a418	bff6a01e-9128-487d-9f49-a2929ee5bf3c	2019-04-03	\N	t	t
d7dd46bf-656d-4e1c-914d-e2ed332fe138	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2013-05-20	\N	t	t
54b29443-ee75-4f00-beaf-1d88c48cbad8	b644dfc7-5553-4889-8920-daa15b355715	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2007-05-10	\N	t	t
057704b4-7672-4447-b0c5-82b3d2145fc7	298646e0-9b2f-4de1-8626-8274d5f997f1	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2017-05-02	\N	t	t
832c2c6a-4c8e-4f3d-b775-8c53779176fb	4cadfad4-f521-4435-ab0e-76311c4b9928	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	2017-05-02	\N	t	t
104a54d8-7572-43c9-8016-fd238b975fe8	dac88712-975d-473b-8c88-d44e7c579d23	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2023-06-02	\N	t	t
215e46db-7c21-486d-b55f-3dd2e4ab3746	b31cf00e-36aa-4307-8e7e-893bb1261218	40c03523-202d-4eb3-8c06-011afd8a691c	2024-10-21	\N	t	t
844d61f8-edf0-4d8c-99ad-750b4181fb72	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	40c03523-202d-4eb3-8c06-011afd8a691c	2022-06-01	\N	t	t
02f6c412-bcc7-4c91-a311-895c990900e6	328b9de3-a19b-4be0-ac71-140f8fdc1060	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2009-07-21	\N	t	t
c21d4383-0a7d-4ee1-8f8e-b4da13008fed	94f089ae-ceb7-4320-a11d-2267e8ba8408	205282ef-3374-4d6d-891d-f51a67e2a1f5	2026-01-14	\N	t	t
6d3e78ef-d98a-4f3b-bc6d-2a50c5897f6e	09786243-3caa-4d88-ad8c-2dcfbb0db897	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2017-05-08	\N	t	t
d9f20b36-ec25-414f-b9e7-5fed34eefbea	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	205282ef-3374-4d6d-891d-f51a67e2a1f5	2022-09-26	\N	t	t
9f86b39f-0229-49d9-81ff-90f2bacf4e82	4ad79f15-b0c4-4dad-89ae-5aa82767f698	bff6a01e-9128-487d-9f49-a2929ee5bf3c	2019-04-03	\N	t	t
0b3fe70b-ec46-4165-8f28-b3dd913eab78	8c774552-83f9-44bd-8a3b-a3730dad0e22	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	2010-01-12	\N	t	t
e8066495-3ab4-41bd-8771-529ead808172	4af5de73-9cd3-4076-b9ba-916790d2c20d	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-09-06	\N	t	t
fcdca2e4-4536-417e-b2a8-b934dca75c35	94abc717-7066-43d5-a09a-a1e678e322ea	c4f8fcad-660e-4aee-a188-a7da46ba040f	2024-06-17	\N	t	t
19a2b707-f1f9-4341-af8c-76c2d22e6dc5	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	c4f8fcad-660e-4aee-a188-a7da46ba040f	2017-05-02	\N	t	t
f4a037b6-4449-45ec-be35-1039d4c24677	4d388595-f713-4573-ad2d-852612de70d2	40c03523-202d-4eb3-8c06-011afd8a691c	2017-05-02	\N	t	t
c4332d88-4c0a-4f41-8a37-01dab793ac1b	cbecff4e-5b38-4ab5-8297-8fd9479a668f	c4f8fcad-660e-4aee-a188-a7da46ba040f	2021-02-01	\N	t	t
b7e9f325-595f-4c25-a899-fb39ec5002a7	4026bca6-7f2f-4e9f-adc1-2027d608a689	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2017-05-02	\N	t	t
995c70f6-73ed-42f7-9217-15806e0ece21	3ab409a6-021a-411f-a0a0-be1bb88d0faa	40c03523-202d-4eb3-8c06-011afd8a691c	2023-04-10	\N	t	t
b2256a9c-218e-487a-870c-c36c1e96d914	93164df6-4a7c-40cc-a047-b5a6ad42843c	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	2020-02-17	\N	t	t
408d224d-45a0-4a6c-9a01-980ae00909ed	568bd957-caa9-47c9-882f-5abb3eb7b423	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	2023-04-11	\N	t	t
082ebf60-658c-45a6-a45c-cd50e87ac734	2be116e9-bb78-4f36-b3e8-5cb75febe48c	40c03523-202d-4eb3-8c06-011afd8a691c	2026-07-31	\N	t	t
8458c49a-b2e8-4027-90c6-8039179d6b39	62a94640-4e13-466c-a7a9-2e0be0181da8	205282ef-3374-4d6d-891d-f51a67e2a1f5	2026-07-31	\N	t	t
b622054e-e1b4-4219-93f9-43f5cce91b9b	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	f2f7213a-da5c-488e-925c-cd4849184a7b	2026-07-31	\N	t	t
b89eec2d-6192-4b09-9b1f-51338da23196	96ec8d2e-4828-4c91-916d-f995d755d146	d52f8548-598d-4c19-86cc-aff78b7124e2	2026-07-31	\N	t	t
a77c1357-c55a-4ef8-b2df-9af210a7b7f3	f3f64149-89b9-4cdb-a2c2-d544f9bc930c	205282ef-3374-4d6d-891d-f51a67e2a1f5	2023-08-15	\N	t	t
0cd48cb4-4b07-49b2-8a47-4f4e0fe8adbc	7991b028-888d-404d-abae-ecf4f479483c	bff6a01e-9128-487d-9f49-a2929ee5bf3c	2010-01-12	2026-01-31	t	t
dcab7b4d-123d-4fa1-b266-1fa2d04f0b85	7991b028-888d-404d-abae-ecf4f479483c	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	2026-02-01	\N	t	t
\.


--
-- Data for Name: incentive_calculation_detail; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incentive_calculation_detail (incentive_calculation_detail_id, incentive_calculation_header_id, component_id, quota_value, sale_value, compliance_percent, curve_pay_percent, weighted_component_percent, component_incentive_value) FROM stdin;
07f244c5-01c2-45cf-a02e-b9e6a5bcc520	1978ef83-98d0-4327-b25f-6d17a72f75af	23a6e464-1d48-48cd-9e60-1b92067460e5	16400000.00	26441392.00	1.610000	1.500000	0.600000	446745.60
0224ff7e-dddc-49f4-9c3b-5e2fb31bf777	1978ef83-98d0-4327-b25f-6d17a72f75af	43b23016-5ea6-4d23-91c7-14290a050e32	527.04	679.00	1.290000	1.500000	0.450000	335059.20
3b1b61b8-6a8b-4006-ac6c-6b14ac0d6960	1978ef83-98d0-4327-b25f-6d17a72f75af	951c8c3d-ceb8-4eca-b291-7005443411af	226.80	305.00	1.340000	1.500000	0.450000	335059.20
9708164c-5aee-4d5b-bdc5-a64d6451a682	ee88cad2-1250-40d5-ab7d-b8d3826f3d47	23a6e464-1d48-48cd-9e60-1b92067460e5	15000000.00	23628082.00	1.580000	1.500000	0.900000	658152.00
28480c0d-ec74-4df5-9147-1a638f4636e9	ee88cad2-1250-40d5-ab7d-b8d3826f3d47	43b23016-5ea6-4d23-91c7-14290a050e32	2409.48	2898.00	1.200000	1.500000	0.300000	219384.00
f0b50cd2-f2cc-4ea1-a849-9b94aca60cb9	ee88cad2-1250-40d5-ab7d-b8d3826f3d47	951c8c3d-ceb8-4eca-b291-7005443411af	359.64	399.00	1.110000	1.280000	0.256000	187207.68
6d652bb2-fff9-45d7-bf9f-5f8864e55e43	02f9cf06-17a7-48fe-ad2a-70e0a79c0814	43b23016-5ea6-4d23-91c7-14290a050e32	2181.60	2740.00	1.260000	1.500000	0.300000	219384.00
6bbcf48f-9b8e-4daf-959b-62a3c48705d9	02f9cf06-17a7-48fe-ad2a-70e0a79c0814	951c8c3d-ceb8-4eca-b291-7005443411af	344.52	405.00	1.180000	1.451667	0.290333	212315.01
dc1b59f9-f462-4513-ad9d-02a6f48e6891	02f9cf06-17a7-48fe-ad2a-70e0a79c0814	23a6e464-1d48-48cd-9e60-1b92067460e5	31900000.00	41116232.00	1.290000	1.500000	0.900000	658152.00
a97a9471-2664-41d5-82db-f38f3836f9d0	4b7568e9-fd08-4498-b073-af2ef62218c6	43b23016-5ea6-4d23-91c7-14290a050e32	2918.16	2520.00	0.860000	0.000000	0.000000	0.00
59a864b8-963e-4f46-9812-fe0bf478e1c4	4b7568e9-fd08-4498-b073-af2ef62218c6	951c8c3d-ceb8-4eca-b291-7005443411af	636.12	610.00	0.960000	0.800000	0.240000	178698.24
bd74db06-ca38-43d9-9a63-db6a73366e82	4b7568e9-fd08-4498-b073-af2ef62218c6	23a6e464-1d48-48cd-9e60-1b92067460e5	24100000.00	33593706.00	1.390000	1.500000	0.600000	446745.60
15f5a47b-a077-4e2f-8124-0db409c1a4f3	14360a14-8c6b-492c-baeb-7f0ba6fc1ee8	43b23016-5ea6-4d23-91c7-14290a050e32	1074.60	1334.00	1.240000	1.500000	0.450000	329076.00
2e292683-b059-478e-a4a1-c31b1554346c	14360a14-8c6b-492c-baeb-7f0ba6fc1ee8	951c8c3d-ceb8-4eca-b291-7005443411af	516.24	607.00	1.180000	1.451667	0.435500	318472.51
159d9e3e-bdc4-4f5a-b725-60d43a68655e	14360a14-8c6b-492c-baeb-7f0ba6fc1ee8	23a6e464-1d48-48cd-9e60-1b92067460e5	25000000.00	30629003.00	1.230000	1.500000	0.600000	438768.00
6c0c8cb4-e64c-4bf0-8e2e-fef12e9748dc	b3654223-d85b-44dc-a1ca-839a6eaa4587	43b23016-5ea6-4d23-91c7-14290a050e32	542.16	519.00	0.960000	0.800000	0.160000	117004.80
74101423-4dd4-417f-bfa3-197383c525b0	b3654223-d85b-44dc-a1ca-839a6eaa4587	951c8c3d-ceb8-4eca-b291-7005443411af	200.88	197.00	0.980000	0.900000	0.180000	131630.40
694d2006-7e16-4476-85bf-6bce04ae7bb9	b3654223-d85b-44dc-a1ca-839a6eaa4587	23a6e464-1d48-48cd-9e60-1b92067460e5	20800000.00	25423231.00	1.220000	1.500000	0.900000	658152.00
9fefd677-8299-4e28-a13e-7aaeeea3f859	886e72f4-9e1e-4fe0-aac0-77bae67f96be	43b23016-5ea6-4d23-91c7-14290a050e32	892.08	690.00	0.770000	0.000000	0.000000	0.00
3d5f826b-1c82-4b43-95b2-ac706a80f7ac	886e72f4-9e1e-4fe0-aac0-77bae67f96be	951c8c3d-ceb8-4eca-b291-7005443411af	299.16	270.00	0.900000	0.500000	0.100000	74457.60
511f0930-5903-4077-9556-5eebc6499dac	886e72f4-9e1e-4fe0-aac0-77bae67f96be	23a6e464-1d48-48cd-9e60-1b92067460e5	43000000.00	60731348.00	1.410000	1.500000	0.900000	670118.40
81fca103-627c-469a-aa94-765ba9102ab2	91f59209-7197-4e06-a746-5f66d2977e09	43b23016-5ea6-4d23-91c7-14290a050e32	792.72	975.00	1.230000	1.500000	0.300000	219384.00
b3650055-27de-4e4d-b435-a66aa3699f7c	91f59209-7197-4e06-a746-5f66d2977e09	951c8c3d-ceb8-4eca-b291-7005443411af	294.84	337.00	1.140000	1.350000	0.270000	197445.60
ed97bccb-60cb-447d-bcfb-0b21c260fd3d	91f59209-7197-4e06-a746-5f66d2977e09	23a6e464-1d48-48cd-9e60-1b92067460e5	19800000.00	20275127.00	1.020000	1.050000	0.630000	460706.40
fac41bbf-95a5-4fce-a7df-1c79878829cd	3fb7d1ee-2f5f-4e44-a850-225f835c8e0e	43b23016-5ea6-4d23-91c7-14290a050e32	1284.12	1495.00	1.160000	1.401667	0.280333	186365.64
bae9ad7b-08f6-4d0c-a1c1-7e4377202399	3fb7d1ee-2f5f-4e44-a850-225f835c8e0e	951c8c3d-ceb8-4eca-b291-7005443411af	257.04	299.00	1.160000	1.401667	0.280333	186365.64
2c9cdea2-3121-461d-b18e-ee3e74265abe	3fb7d1ee-2f5f-4e44-a850-225f835c8e0e	23a6e464-1d48-48cd-9e60-1b92067460e5	19500000.00	25458073.00	1.310000	1.500000	0.900000	598320.00
45d915e5-0934-46a0-8f27-07cdcd2653c9	06c8a450-acc2-4c66-8e5e-fce4197087d4	43b23016-5ea6-4d23-91c7-14290a050e32	887.76	1018.00	1.150000	1.376667	0.275333	201345.81
3ff59510-0c56-44e0-869d-7c2bbcc260ac	06c8a450-acc2-4c66-8e5e-fce4197087d4	951c8c3d-ceb8-4eca-b291-7005443411af	304.56	348.00	1.140000	1.350000	0.270000	197445.60
84f0c12d-5391-4171-b42c-9757689f2f65	06c8a450-acc2-4c66-8e5e-fce4197087d4	23a6e464-1d48-48cd-9e60-1b92067460e5	17900000.00	22986809.00	1.280000	1.500000	0.900000	658152.00
40b2ccca-f264-4ac1-bbff-d4ffcafbb7d7	6f31f1e7-6823-4aea-9f01-3ad70463d8fc	43b23016-5ea6-4d23-91c7-14290a050e32	1087.56	1175.00	1.080000	1.203333	0.361000	239992.73
0cf1e027-14d5-4003-8abb-9a5f2b649f4e	6f31f1e7-6823-4aea-9f01-3ad70463d8fc	951c8c3d-ceb8-4eca-b291-7005443411af	333.72	380.00	1.140000	1.350000	0.405000	269244.00
ce77bc1e-3e9a-4704-87c5-581feec453aa	6f31f1e7-6823-4aea-9f01-3ad70463d8fc	23a6e464-1d48-48cd-9e60-1b92067460e5	25400000.00	40728313.00	1.600000	1.500000	0.600000	398880.00
4acd7da0-512e-4fa3-840e-35067001f067	01ac760a-5e68-4dca-af0f-111688cfedfa	43b23016-5ea6-4d23-91c7-14290a050e32	642.60	934.00	1.450000	1.500000	0.300000	219384.00
3484b6d8-4dea-4761-83e9-d2678be20ebf	01ac760a-5e68-4dca-af0f-111688cfedfa	951c8c3d-ceb8-4eca-b291-7005443411af	274.32	279.00	1.020000	1.050000	0.210000	153568.80
2e9624f4-7615-4a5d-8a33-3d86ec8234f4	01ac760a-5e68-4dca-af0f-111688cfedfa	23a6e464-1d48-48cd-9e60-1b92067460e5	26100000.00	32341027.00	1.240000	1.500000	0.900000	658152.00
6e58e416-504d-41b5-8aaa-9a6f9d812e10	5993abfc-c16b-4531-919a-48b80ada0384	43b23016-5ea6-4d23-91c7-14290a050e32	754.92	1076.00	1.430000	1.500000	0.300000	219384.00
45cbeb11-3b71-436a-92ce-d00dc0a85c18	5993abfc-c16b-4531-919a-48b80ada0384	951c8c3d-ceb8-4eca-b291-7005443411af	302.40	366.00	1.210000	1.500000	0.300000	219384.00
73bd077a-60e6-41e0-b114-74c45cc86740	5993abfc-c16b-4531-919a-48b80ada0384	23a6e464-1d48-48cd-9e60-1b92067460e5	23600000.00	29662202.00	1.260000	1.500000	0.900000	658152.00
90fcee92-f60e-421e-b695-9d3f6b5fe9e4	b70b05f6-2522-45bf-8429-3b20069e6052	43b23016-5ea6-4d23-91c7-14290a050e32	1142.64	1567.00	1.370000	1.500000	0.300000	219384.00
14cb68f8-20a1-4af8-a476-a2f2d583c835	b70b05f6-2522-45bf-8429-3b20069e6052	951c8c3d-ceb8-4eca-b291-7005443411af	290.52	340.00	1.170000	1.426667	0.285333	208658.61
0d9e92c6-eccf-40b9-911c-baa8d0e4a3ca	b70b05f6-2522-45bf-8429-3b20069e6052	23a6e464-1d48-48cd-9e60-1b92067460e5	19100000.00	33533765.00	1.760000	1.500000	0.900000	658152.00
601f61cf-a195-406b-bda6-5cf753d7b3de	88f429bf-ed6a-4f59-b15a-37ef48d9bd26	5149a40e-419e-483e-969d-ef642d252c06	14433.12	15798.00	1.090000	1.228333	0.491333	1004137.66
f020c8f9-8897-401d-a580-44d5e66a8b4c	88f429bf-ed6a-4f59-b15a-37ef48d9bd26	15e16108-5021-44f2-b303-04d67f8fac86	3480.84	3738.00	1.070000	1.178333	0.353500	722447.75
4e9f26b9-a152-4d3a-90c6-38d06635111b	88f429bf-ed6a-4f59-b15a-37ef48d9bd26	23a6e464-1d48-48cd-9e60-1b92067460e5	274300000.00	415350560.00	1.510000	1.500000	0.450000	919665.00
c55364bf-dc62-431f-b373-832c509c39ff	54de41b0-772a-4ba9-877a-addffa63b8f0	5149a40e-419e-483e-969d-ef642d252c06	14433.12	15798.00	1.090000	1.228333	0.491333	1032291.05
1347b08f-2ab8-4431-8fe5-a100b3443b84	54de41b0-772a-4ba9-877a-addffa63b8f0	15e16108-5021-44f2-b303-04d67f8fac86	3480.84	3738.00	1.070000	1.178333	0.353500	742703.29
bc3b226b-3ff5-477a-b1e3-28bd71675e74	54de41b0-772a-4ba9-877a-addffa63b8f0	23a6e464-1d48-48cd-9e60-1b92067460e5	274300000.00	415350560.00	1.510000	1.500000	0.450000	945450.00
6e468b73-0051-4e31-b26c-e0d6c4101d66	0e1b19f2-2c1c-40fe-8c6a-f3accc791ebe	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	2279515481.00	2182744995.00	0.960000	0.800000	0.640000	1074737.66
fd3cdb49-fee7-4a96-81ac-2aeb9fb3276d	0e1b19f2-2c1c-40fe-8c6a-f3accc791ebe	ffe5d345-5285-43a3-9a8a-c0495b268812	699164348.00	1256377172.00	1.800000	1.500000	0.300000	503783.28
5f61f649-128d-4317-9b07-4675ca814934	a99853d5-6ccf-4beb-8749-6e0fa9f2c539	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	2279515481.00	2182744995.00	0.960000	0.800000	0.640000	1074737.66
29e0099e-1560-4a79-8e71-2424f743d77a	a99853d5-6ccf-4beb-8749-6e0fa9f2c539	ffe5d345-5285-43a3-9a8a-c0495b268812	699164348.00	1256377172.00	1.800000	1.500000	0.300000	503783.28
4286e9fb-3909-4175-b652-ea289cfb78d2	3294711d-8071-4e10-8f52-3412e84e5f21	1374279b-9ac2-4b1f-9759-e95bccc1e8c3	1036.00	873.00	0.840000	0.000000	0.000000	0.00
f6d3e8ca-4ea0-407d-b480-8c1a6ed26b74	3294711d-8071-4e10-8f52-3412e84e5f21	ca8a72cc-9d9b-4d42-9683-3372c828b2eb	1158.00	1263.00	1.090000	1.228333	0.245667	347660.49
be486ae6-d6b7-4356-9a66-c5899531c127	3294711d-8071-4e10-8f52-3412e84e5f21	23a6e464-1d48-48cd-9e60-1b92067460e5	33600000.00	37905191.00	1.130000	1.330000	0.798000	1129307.26
94543ab4-e2db-489f-b052-44d1314b5d34	df6bee50-a013-418f-8dd8-30541b228893	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	3740879609.00	3012884555.00	0.810000	0.000000	0.000000	0.00
4c2f9ac1-7b54-4543-800f-09a5bf36966b	df6bee50-a013-418f-8dd8-30541b228893	e529c58e-2de2-44ee-b791-a328f8582f27	2279515481.00	2182744995.00	0.960000	0.800000	0.320000	920128.00
14c79c7a-d18f-47f8-8cd9-a014070681b4	df6bee50-a013-418f-8dd8-30541b228893	d7251f14-67d2-4d92-b995-e674971e0f94	804933695.00	652046193.00	0.810000	0.000000	0.000000	0.00
7414850f-9e4c-4936-b1a5-34e43b20bd46	691e7dd7-dee0-4745-9958-e30796c9b76f	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	3740879609.00	3012884555.00	0.810000	0.000000	0.000000	0.00
5a60bb6a-9e06-4c77-a6bd-5703e9d3cd0c	691e7dd7-dee0-4745-9958-e30796c9b76f	e529c58e-2de2-44ee-b791-a328f8582f27	2279515481.00	2182744995.00	0.960000	0.800000	0.320000	961952.00
52f08fc4-0613-4c0b-97e3-cea687995353	691e7dd7-dee0-4745-9958-e30796c9b76f	d7251f14-67d2-4d92-b995-e674971e0f94	804933695.00	652046193.00	0.810000	0.000000	0.000000	0.00
9992706c-2d3a-4d7c-8d02-b28885f88826	edf2315a-80fa-4535-95d0-eafdffb22b09	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	1947.50	2190.00	1.120000	1.300000	0.650000	1302373.80
50dcc62f-8201-4237-b194-85a58dbe33b3	edf2315a-80fa-4535-95d0-eafdffb22b09	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	726.96	991.00	1.360000	1.500000	0.300000	601095.60
cca185e6-7362-48fa-98a5-20bb6624943a	edf2315a-80fa-4535-95d0-eafdffb22b09	326bd585-cf49-4882-9d69-6851958e1424	173.80	101.00	0.580000	0.000000	0.000000	0.00
6cef56d4-7ed0-4c67-9626-3aff5d097bcb	ac93a3e8-0052-4f82-bb70-16f826695c13	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5818.94	6046.00	1.040000	1.103333	0.551667	1210618.89
fccc3ceb-8f37-428d-8875-1e384836d6ff	ac93a3e8-0052-4f82-bb70-16f826695c13	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	2424.24	2786.00	1.150000	1.376667	0.275333	604212.54
52f8231f-b483-4ebd-b0bb-96a9a6c6358e	ac93a3e8-0052-4f82-bb70-16f826695c13	326bd585-cf49-4882-9d69-6851958e1424	625.90	424.00	0.680000	0.000000	0.000000	0.00
d8b3671e-b971-4188-afe6-73621d466d1e	109c0aa0-0453-435d-a67e-a7f61f2c21c3	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	4238.90	3753.00	0.890000	0.000000	0.000000	0.00
ea48f74f-d354-4960-9f6f-be40b6c3f4d0	109c0aa0-0453-435d-a67e-a7f61f2c21c3	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	1784.64	1791.00	1.000000	1.000000	0.200000	408363.36
7f8b612d-0d66-4885-ac8c-ac61d399e4eb	109c0aa0-0453-435d-a67e-a7f61f2c21c3	326bd585-cf49-4882-9d69-6851958e1424	349.80	293.00	0.840000	0.000000	0.000000	0.00
716913c6-24e7-4300-a148-4fd5963c80ac	ffc0e101-9456-4266-863b-0d196fec8243	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5088.58	5277.00	1.040000	1.103333	0.551667	1115874.81
d4b40037-43e3-411b-ad1d-1802bd3248d7	ffc0e101-9456-4266-863b-0d196fec8243	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	2170.48	2473.00	1.140000	1.350000	0.270000	546138.29
e735bf76-a7ef-4929-8fe7-ba2ee1a32dda	ffc0e101-9456-4266-863b-0d196fec8243	326bd585-cf49-4882-9d69-6851958e1424	430.10	316.00	0.730000	0.000000	0.000000	0.00
a2d96c37-8bef-46f5-8104-6ef4b840b404	2ce84957-ce32-4987-aa49-6cfc42a60f76	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	4706.68	5565.00	1.180000	1.451667	0.725834	1468168.39
811a0a16-2da0-4dfc-b015-c97a3cbac6a3	2ce84957-ce32-4987-aa49-6cfc42a60f76	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	2192.32	2589.00	1.180000	1.451667	0.290333	587267.36
361ad35c-a264-4c24-b737-a82312183917	2ce84957-ce32-4987-aa49-6cfc42a60f76	326bd585-cf49-4882-9d69-6851958e1424	397.10	303.00	0.760000	0.000000	0.000000	0.00
9001aa5c-00b0-48d5-9ce7-f2fe4bfd106a	bfc88f5d-c507-403a-953a-df38afd72ef4	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	2565.38	2372.00	0.920000	0.600000	0.300000	601095.60
b25e15ad-776f-4e21-a5ba-86692aa45cb9	bfc88f5d-c507-403a-953a-df38afd72ef4	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	1395.68	1609.00	1.150000	1.376667	0.275333	551672.32
4ee26d70-0f86-463b-8f35-417e212dd730	bfc88f5d-c507-403a-953a-df38afd72ef4	326bd585-cf49-4882-9d69-6851958e1424	294.80	205.00	0.700000	0.000000	0.000000	0.00
6080d70b-055d-4e48-8267-22ddb15c8052	bfaf407f-6343-4bf6-9864-6a54be66e3ca	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	2280.00	1791.00	0.790000	0.000000	0.000000	0.00
5901cb43-311e-4162-9f88-8b540971b1da	bfaf407f-6343-4bf6-9864-6a54be66e3ca	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	1155.44	1756.00	1.520000	1.500000	0.300000	601095.60
aad066f9-6e04-4fad-8ebd-b633d818ddaa	bfaf407f-6343-4bf6-9864-6a54be66e3ca	326bd585-cf49-4882-9d69-6851958e1424	380.60	444.00	1.170000	1.426667	0.428000	857563.26
e353539c-d3a9-49c5-b8c0-2c15850c6105	12a9a3fc-91cb-4a8e-9527-1a0f8b5cbb54	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	2419.08	2746.00	1.140000	1.350000	0.675000	1352465.10
5eca5081-49d0-4e92-8faa-acf56994a865	12a9a3fc-91cb-4a8e-9527-1a0f8b5cbb54	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	1572.48	2029.00	1.290000	1.500000	0.300000	601095.60
c89564e9-5a1c-4b5b-8ecc-b5d27412a1c8	12a9a3fc-91cb-4a8e-9527-1a0f8b5cbb54	326bd585-cf49-4882-9d69-6851958e1424	280.50	362.00	1.290000	1.500000	0.450000	901643.40
4a31c84b-d864-4d24-a96e-b8f95f50a2ab	06fb28c7-7ed2-4064-8e5e-d19fbd40edb3	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	3305.62	3195.00	0.970000	0.850000	0.425000	851552.10
c6d496ed-ff4c-4a01-b6ff-b242e2bc3b88	06fb28c7-7ed2-4064-8e5e-d19fbd40edb3	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	2463.76	2619.00	1.060000	1.153333	0.230667	462175.59
5a1ce276-e1b3-463d-84e9-ad4124b121ce	06fb28c7-7ed2-4064-8e5e-d19fbd40edb3	326bd585-cf49-4882-9d69-6851958e1424	242.00	346.00	1.430000	1.500000	0.450000	901643.40
20b6a5c4-89e5-4584-b83e-0dfb7b8588d4	b98b2903-a48e-488a-b835-e5b49b3dd742	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	3267.24	3427.00	1.050000	1.128333	0.564167	1130393.34
9aea8c9a-bddc-4a21-9acc-780125a8bc86	b98b2903-a48e-488a-b835-e5b49b3dd742	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	1487.20	2009.00	1.350000	1.500000	0.300000	601095.60
58fecafc-2268-4881-a4ef-33b3ffeb1c0b	b98b2903-a48e-488a-b835-e5b49b3dd742	326bd585-cf49-4882-9d69-6851958e1424	231.00	222.00	0.960000	0.800000	0.240000	480876.48
24b8ecf6-154b-43ec-97f9-c7041a2ee64b	8309b542-f8a1-45c5-9a7c-77a0b2e351a5	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	4825.24	3953.00	0.820000	0.000000	0.000000	0.00
dc1b9467-9234-462c-a4e5-9ea9c45fc83f	8309b542-f8a1-45c5-9a7c-77a0b2e351a5	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	0.00	0.00	0.000000	0.000000	0.000000	0.00
43a02d97-4285-407e-a035-be03736864b3	8309b542-f8a1-45c5-9a7c-77a0b2e351a5	326bd585-cf49-4882-9d69-6851958e1424	2279515481.00	2182744995.00	0.960000	0.800000	0.240000	494615.81
06f48a63-45e6-4fdc-a036-e645a29d5ed1	2c12ac0e-ea26-4469-87c7-24e2836d2f7f	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	4180.76	3883.00	0.930000	0.650000	0.325000	657388.68
2c05482f-d6b4-4ca5-8047-dfcb56e2e74a	2c12ac0e-ea26-4469-87c7-24e2836d2f7f	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	2933.84	3383.00	1.150000	1.376667	0.275333	556926.34
abd055c5-4df6-41df-bdce-27a5aa47576f	2c12ac0e-ea26-4469-87c7-24e2836d2f7f	326bd585-cf49-4882-9d69-6851958e1424	630.30	424.00	0.670000	0.000000	0.000000	0.00
4ce99893-40f6-4ded-9ef7-93194ef7d5f2	67e2ec45-fd0b-48c5-8dde-0e3e2f1bf0ff	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	4148.84	6189.00	1.490000	1.500000	0.750000	1531362.60
e2c65cf3-5177-4d57-b9c4-4b0b0a632cbc	67e2ec45-fd0b-48c5-8dde-0e3e2f1bf0ff	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	3400.80	3580.00	1.050000	1.128333	0.225667	460769.86
b43ed676-cbce-47ff-8e93-b483ebb7b980	67e2ec45-fd0b-48c5-8dde-0e3e2f1bf0ff	326bd585-cf49-4882-9d69-6851958e1424	235.40	418.00	1.780000	1.500000	0.450000	918817.56
94a3e544-8b6f-4acb-9277-53ac6bc18014	29f261c7-dd29-4ad8-a4ad-60bf9bc3dca6	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	2852.66	2321.00	0.810000	0.000000	0.000000	0.00
581cba58-6e15-428b-b07e-4fe0d4d0e5e7	29f261c7-dd29-4ad8-a4ad-60bf9bc3dca6	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	2796.56	2953.00	1.060000	1.153333	0.230667	466577.27
81880acf-39bb-4cd4-8093-08b908655096	29f261c7-dd29-4ad8-a4ad-60bf9bc3dca6	326bd585-cf49-4882-9d69-6851958e1424	524.70	347.00	0.660000	0.000000	0.000000	0.00
ac0ca0f2-db41-481f-88df-bd2e369c4c27	e03cbc83-850c-4862-a607-acca6fd71d1b	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	3299.16	2562.00	0.780000	0.000000	0.000000	0.00
99f18635-0dc8-4c48-850e-856b18f17784	e03cbc83-850c-4862-a607-acca6fd71d1b	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	3343.60	3339.00	1.000000	1.000000	0.200000	381648.00
26689039-11e3-46b8-a3f7-75b54daf75a4	e03cbc83-850c-4862-a607-acca6fd71d1b	326bd585-cf49-4882-9d69-6851958e1424	464.20	318.00	0.690000	0.000000	0.000000	0.00
f2061d10-0d9c-4236-9f25-a59d944c06c5	7cac8020-671d-48f5-ac30-6ba09d0cc559	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	3088.26	2463.00	0.800000	0.000000	0.000000	0.00
504a7554-40da-417b-b575-f29313bc108f	7cac8020-671d-48f5-ac30-6ba09d0cc559	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	0.00	0.00	0.000000	0.000000	0.000000	0.00
a4c2745c-42f5-471d-9563-d5df1e0ca64d	7cac8020-671d-48f5-ac30-6ba09d0cc559	326bd585-cf49-4882-9d69-6851958e1424	2279515481.00	2182744995.00	0.960000	0.800000	0.240000	494615.81
eff31573-49a5-4176-8cbd-ee21a0b2241a	d6ae7edc-6b39-46dd-a37d-d18e2e672f6f	3200ec4e-b119-489a-bfe4-5bf30beb9c49	21548.02	19378.00	0.900000	0.500000	0.250000	755475.00
efca8efa-5f2f-4b8e-92c3-b27bfda27bbc	d6ae7edc-6b39-46dd-a37d-d18e2e672f6f	4407a61f-f92c-4c45-aebb-3da2735a8f01	13977.04	15968.00	1.140000	1.350000	0.405000	1223869.50
98d90651-79b7-402c-92e5-82af232891fc	d6ae7edc-6b39-46dd-a37d-d18e2e672f6f	e529c58e-2de2-44ee-b791-a328f8582f27	2279515481.00	2182744995.00	0.960000	0.800000	0.160000	483504.00
63990b9e-cbb4-465f-9afc-86883288c81d	8786626f-9b31-4aa2-955c-b950d461bf3d	3200ec4e-b119-489a-bfe4-5bf30beb9c49	37520.82	39228.00	1.050000	1.128333	0.564167	1737328.17
1e5c9039-3b73-4aa8-b888-cf3c584cc82c	8786626f-9b31-4aa2-955c-b950d461bf3d	4407a61f-f92c-4c45-aebb-3da2735a8f01	17028.96	19202.00	1.130000	1.330000	0.399000	1228704.54
2c5118c9-6de0-4e15-b3d3-f8bc94b6b8a5	8786626f-9b31-4aa2-955c-b950d461bf3d	e529c58e-2de2-44ee-b791-a328f8582f27	2279515481.00	2182744995.00	0.960000	0.800000	0.160000	492713.60
1fe96424-8988-41ce-ae0d-823cc16add0f	2e182dc0-616f-4fb8-bae0-f6e06c1969a1	43b23016-5ea6-4d23-91c7-14290a050e32	855.36	697.00	0.810000	0.000000	0.000000	0.00
d5c27e69-d5d7-4277-9cc5-2377e885c7db	2e182dc0-616f-4fb8-bae0-f6e06c1969a1	951c8c3d-ceb8-4eca-b291-7005443411af	266.76	228.00	0.850000	0.000000	0.000000	0.00
dfd0c515-d07d-4422-abee-c47eee3b4cc5	2e182dc0-616f-4fb8-bae0-f6e06c1969a1	23a6e464-1d48-48cd-9e60-1b92067460e5	31800000.00	41091176.00	1.290000	1.500000	0.600000	438768.00
399f8d6b-501f-42b2-bd48-43f93a4050f3	3549b773-689e-4b44-aaa2-0e83c071e060	43b23016-5ea6-4d23-91c7-14290a050e32	2128.68	2645.00	1.240000	1.500000	0.450000	329076.00
76d25cf4-a31c-4ada-bba3-ea2d7be0569d	3549b773-689e-4b44-aaa2-0e83c071e060	951c8c3d-ceb8-4eca-b291-7005443411af	705.24	814.00	1.150000	1.376667	0.413000	302018.71
e099dd45-009c-45e3-bc54-c7a58cb44403	3549b773-689e-4b44-aaa2-0e83c071e060	23a6e464-1d48-48cd-9e60-1b92067460e5	15000000.00	2975187.00	0.200000	0.000000	0.000000	0.00
d1e2c129-b9b1-4321-a3b0-daa0bef49bb3	2d842362-ba82-4ef9-aac4-801ad98e27b4	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	2279515481.00	2182744995.00	0.960000	0.800000	0.640000	1841920.00
913c908d-1e43-4d84-abb1-07170269a1e0	2d842362-ba82-4ef9-aac4-801ad98e27b4	ffe5d345-5285-43a3-9a8a-c0495b268812	699164348.00	1256377172.00	1.800000	1.500000	0.300000	863400.00
\.


--
-- Data for Name: incentive_calculation_header; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.incentive_calculation_header (incentive_calculation_header_id, employee_id, period_id, team_id, calculation_status, base_salary, component_80_theoretical, component_20_theoretical, component_80_result, component_20_result, total_incentive, guaranteed_pay_applied, execution_kpi_name, execution_kpi_result, execution_compliance_percent, execution_pay_monthly, execution_cycle_multiplier, calculation_version, calculated_at, execution_20_mode) FROM stdin;
1978ef83-98d0-4327-b25f-6d17a72f75af	7bcd7425-b4d4-427a-b63c-464e239749e9	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40c03523-202d-4eb3-8c06-011afd8a691c	CALCULATED	930720.00	744576.00	186144.00	1116864.00	0.00	1116864.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:49:51.443	ACCRUE
ee88cad2-1250-40d5-ab7d-b8d3826f3d47	94abc717-7066-43d5-a09a-a1e678e322ea	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	1064743.68	0.00	1064743.68	f	\N	f	\N	f	0.00	1	2026-07-31 20:49:58.534	ACCRUE
02f9cf06-17a7-48fe-ad2a-70e0a79c0814	4af5de73-9cd3-4076-b9ba-916790d2c20d	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	1089851.01	0.00	1089851.01	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:05.738	ACCRUE
4b7568e9-fd08-4498-b073-af2ef62218c6	3ab409a6-021a-411f-a0a0-be1bb88d0faa	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40c03523-202d-4eb3-8c06-011afd8a691c	CALCULATED	930720.00	744576.00	186144.00	625443.84	0.00	625443.84	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:12.764	ACCRUE
14360a14-8c6b-492c-baeb-7f0ba6fc1ee8	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40c03523-202d-4eb3-8c06-011afd8a691c	CALCULATED	914100.00	731280.00	182820.00	1086316.51	0.00	1086316.51	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:19.931	ACCRUE
b3654223-d85b-44dc-a1ca-839a6eaa4587	fdc627f6-ba48-4173-89e8-2f2ac83294c3	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	906787.20	0.00	906787.20	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:28.575	ACCRUE
886e72f4-9e1e-4fe0-aac0-77bae67f96be	85869d04-2b09-4267-b058-3279c75eaed2	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	930720.00	744576.00	186144.00	744576.00	0.00	744576.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:35.742	ACCRUE
91f59209-7197-4e06-a746-5f66d2977e09	908469d1-1beb-4e2b-ba49-a09e4e290672	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	877536.00	0.00	877536.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:42.796	ACCRUE
3fb7d1ee-2f5f-4e44-a850-225f835c8e0e	cbecff4e-5b38-4ab5-8297-8fd9479a668f	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	831000.00	664800.00	166200.00	971051.28	0.00	971051.28	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:49.986	ACCRUE
06c8a450-acc2-4c66-8e5e-fce4197087d4	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	1056943.41	0.00	1056943.41	f	\N	f	\N	f	0.00	1	2026-07-31 20:50:57.026	ACCRUE
6f31f1e7-6823-4aea-9f01-3ad70463d8fc	b31cf00e-36aa-4307-8e7e-893bb1261218	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40c03523-202d-4eb3-8c06-011afd8a691c	CALCULATED	831000.00	664800.00	166200.00	908116.73	0.00	908116.73	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:04.214	ACCRUE
01ac760a-5e68-4dca-af0f-111688cfedfa	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	1031104.80	0.00	1031104.80	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:11.262	ACCRUE
5993abfc-c16b-4531-919a-48b80ada0384	06b2473b-4e72-417c-879d-ae9104996738	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	1096920.00	0.00	1096920.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:18.461	ACCRUE
b70b05f6-2522-45bf-8429-3b20069e6052	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c4f8fcad-660e-4aee-a188-a7da46ba040f	CALCULATED	914100.00	731280.00	182820.00	1086194.61	0.00	1086194.61	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:25.492	ACCRUE
88f429bf-ed6a-4f59-b15a-37ef48d9bd26	93164df6-4a7c-40cc-a047-b5a6ad42843c	ad89f431-8d44-41af-a0ba-fab83b4cf70e	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	CALCULATED	2554625.00	2043700.00	510925.00	2646250.41	0.00	2646250.41	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:32.59	ACCRUE
54de41b0-772a-4ba9-877a-addffa63b8f0	4cadfad4-f521-4435-ab0e-76311c4b9928	ad89f431-8d44-41af-a0ba-fab83b4cf70e	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	CALCULATED	2626250.00	2101000.00	525250.00	2720444.34	0.00	2720444.34	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:39.874	ACCRUE
0e1b19f2-2c1c-40fe-8c6a-f3accc791ebe	4ad79f15-b0c4-4dad-89ae-5aa82767f698	ad89f431-8d44-41af-a0ba-fab83b4cf70e	bff6a01e-9128-487d-9f49-a2929ee5bf3c	CALCULATED	2099097.00	1679277.60	419819.40	1578520.94	0.00	1578520.94	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:46.928	ACCRUE
a99853d5-6ccf-4beb-8749-6e0fa9f2c539	b1d64090-41a3-466b-9a34-e03d5655a418	ad89f431-8d44-41af-a0ba-fab83b4cf70e	bff6a01e-9128-487d-9f49-a2929ee5bf3c	CALCULATED	2099097.00	1679277.60	419819.40	1578520.94	0.00	1578520.94	f	\N	f	\N	f	0.00	1	2026-07-31 20:51:54.101	ACCRUE
3294711d-8071-4e10-8f52-3412e84e5f21	88a2b56f-c9f6-49f5-8282-e2ac1237661d	ad89f431-8d44-41af-a0ba-fab83b4cf70e	514e007a-79c7-4e83-be17-6cf95e82cb41	CALCULATED	1768965.00	1415172.00	353793.00	1476967.75	0.00	1476967.75	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:01.136	ACCRUE
df6bee50-a013-418f-8dd8-30541b228893	da4c35c9-7e96-480d-9449-3f62853938d4	ad89f431-8d44-41af-a0ba-fab83b4cf70e	205282ef-3374-4d6d-891d-f51a67e2a1f5	CALCULATED	3594250.00	2875400.00	718850.00	920128.00	0.00	920128.00	f	\N	f	\N	t	0.00	1	2026-07-31 20:52:08.321	PAY_MONTHLY
691e7dd7-dee0-4745-9958-e30796c9b76f	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	ad89f431-8d44-41af-a0ba-fab83b4cf70e	205282ef-3374-4d6d-891d-f51a67e2a1f5	CALCULATED	3757625.00	3006100.00	751525.00	961952.00	0.00	961952.00	f	\N	f	\N	t	0.00	1	2026-07-31 20:52:15.374	PAY_MONTHLY
edf2315a-80fa-4535-95d0-eafdffb22b09	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2504565.00	2003652.00	500913.00	1903469.40	0.00	1903469.40	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:22.553	ACCRUE
ac93a3e8-0052-4f82-bb70-16f826695c13	298646e0-9b2f-4de1-8626-8274d5f997f1	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2743095.00	2194476.00	548619.00	1814831.43	0.00	1814831.43	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:29.582	ACCRUE
109c0aa0-0453-435d-a67e-a7f61f2c21c3	568bd957-caa9-47c9-882f-5abb3eb7b423	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2552271.00	2041816.80	510454.20	408363.36	0.00	408363.36	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:36.763	ACCRUE
ffc0e101-9456-4266-863b-0d196fec8243	d845bba5-0bad-40ff-83af-4be067bcf13b	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2528418.00	2022734.40	505683.60	1662013.10	0.00	1662013.10	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:43.801	ACCRUE
2ce84957-ce32-4987-aa49-6cfc42a60f76	278e2c63-012a-4727-ae52-66cc7adc4aba	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2528418.00	2022734.40	505683.60	2055435.75	0.00	2055435.75	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:50.855	ACCRUE
bfc88f5d-c507-403a-953a-df38afd72ef4	913808aa-f12d-4bd1-8009-79f44eb4dd01	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2504565.00	2003652.00	500913.00	1152767.92	0.00	1152767.92	f	\N	f	\N	f	0.00	1	2026-07-31 20:52:58.011	ACCRUE
bfaf407f-6343-4bf6-9864-6a54be66e3ca	925b97c8-722d-4767-8845-3553e5747fbc	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2504565.00	2003652.00	500913.00	1458658.86	0.00	1458658.86	f	\N	f	\N	f	0.00	1	2026-07-31 20:53:05.055	ACCRUE
12a9a3fc-91cb-4a8e-9527-1a0f8b5cbb54	328b9de3-a19b-4be0-ac71-140f8fdc1060	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2504565.00	2003652.00	500913.00	2855204.10	0.00	2855204.10	t	\N	f	\N	f	0.00	1	2026-07-31 20:53:12.252	ACCRUE
06fb28c7-7ed2-4064-8e5e-d19fbd40edb3	09786243-3caa-4d88-ad8c-2dcfbb0db897	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2504565.00	2003652.00	500913.00	2215371.09	0.00	2215371.09	f	\N	f	\N	f	0.00	1	2026-07-31 20:53:19.336	ACCRUE
b98b2903-a48e-488a-b835-e5b49b3dd742	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2504565.00	2003652.00	500913.00	2212365.42	0.00	2212365.42	t	\N	f	\N	f	0.00	1	2026-07-31 20:53:26.513	ACCRUE
8309b542-f8a1-45c5-9a7c-77a0b2e351a5	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2576124.00	2060899.20	515224.80	494615.81	0.00	494615.81	f	\N	f	\N	f	0.00	1	2026-07-31 20:53:33.561	ACCRUE
2c12ac0e-ea26-4469-87c7-24e2836d2f7f	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2528418.00	2022734.40	505683.60	1214315.02	0.00	1214315.02	f	\N	f	\N	f	0.00	1	2026-07-31 20:53:40.741	ACCRUE
67e2ec45-fd0b-48c5-8dde-0e3e2f1bf0ff	dac88712-975d-473b-8c88-d44e7c579d23	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2552271.00	2041816.80	510454.20	2910950.02	0.00	2910950.02	f	\N	f	\N	f	0.00	1	2026-07-31 20:53:47.795	ACCRUE
29f261c7-dd29-4ad8-a4ad-60bf9bc3dca6	d1186eb3-89fe-4586-b32c-162f332fa732	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2528418.00	2022734.40	505683.60	466577.27	0.00	466577.27	f	\N	f	\N	f	0.00	1	2026-07-31 20:53:54.985	ACCRUE
e03cbc83-850c-4862-a607-acca6fd71d1b	4026bca6-7f2f-4e9f-adc1-2027d608a689	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2385300.00	1908240.00	477060.00	381648.00	0.00	381648.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:02.047	ACCRUE
7cac8020-671d-48f5-ac30-6ba09d0cc559	b644dfc7-5553-4889-8920-daa15b355715	ad89f431-8d44-41af-a0ba-fab83b4cf70e	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	CALCULATED	2576124.00	2060899.20	515224.80	494615.81	0.00	494615.81	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:09.113	ACCRUE
d6ae7edc-6b39-46dd-a37d-d18e2e672f6f	8c774552-83f9-44bd-8a3b-a3730dad0e22	ad89f431-8d44-41af-a0ba-fab83b4cf70e	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	CALCULATED	3777375.00	3021900.00	755475.00	2462848.50	0.00	2462848.50	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:16.315	ACCRUE
8786626f-9b31-4aa2-955c-b950d461bf3d	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	ad89f431-8d44-41af-a0ba-fab83b4cf70e	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	CALCULATED	3849325.00	3079460.00	769865.00	3458746.31	0.00	3458746.31	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:23.368	ACCRUE
2e182dc0-616f-4fb8-bae0-f6e06c1969a1	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40c03523-202d-4eb3-8c06-011afd8a691c	CALCULATED	914100.00	731280.00	182820.00	438768.00	0.00	438768.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:33.726	ACCRUE
3549b773-689e-4b44-aaa2-0e83c071e060	4d388595-f713-4573-ad2d-852612de70d2	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40c03523-202d-4eb3-8c06-011afd8a691c	CALCULATED	914100.00	731280.00	182820.00	631094.71	0.00	631094.71	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:40.901	ACCRUE
2d842362-ba82-4ef9-aac4-801ad98e27b4	7991b028-888d-404d-abae-ecf4f479483c	ad89f431-8d44-41af-a0ba-fab83b4cf70e	bff6a01e-9128-487d-9f49-a2929ee5bf3c	CALCULATED	3597500.00	2878000.00	719500.00	2705320.00	0.00	2705320.00	f	\N	f	\N	f	0.00	1	2026-07-31 20:54:48.928	ACCRUE
\.


--
-- Data for Name: org_hierarchy; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.org_hierarchy (org_hierarchy_id, manager_employee_id, subordinate_employee_id, valid_from, valid_to, active) FROM stdin;
e866bd92-1e82-46d5-aae4-dfc589383b2a	8c774552-83f9-44bd-8a3b-a3730dad0e22	925b97c8-722d-4767-8845-3553e5747fbc	2025-01-01	\N	t
be117e16-7ba6-4bc3-8d0c-2211e4acf6a8	4cadfad4-f521-4435-ab0e-76311c4b9928	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	2025-01-01	\N	t
d9aa121f-ff3e-4e58-9835-05dab072b5d2	4cadfad4-f521-4435-ab0e-76311c4b9928	5f0868d5-bfd2-44e7-93e2-cd92ee065678	2025-01-01	\N	t
dc12cda9-756a-4933-9220-1635c4de21e8	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	d845bba5-0bad-40ff-83af-4be067bcf13b	2025-01-01	\N	t
c385bebb-a088-45e7-a70c-ce052f3b091f	4cadfad4-f521-4435-ab0e-76311c4b9928	06b2473b-4e72-417c-879d-ae9104996738	2025-01-01	\N	t
bd89253b-1fad-4b01-8dc5-87145773a7b6	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	2025-01-01	\N	t
adf041ba-ef6e-4cdf-a924-65e170bcdfaf	93164df6-4a7c-40cc-a047-b5a6ad42843c	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	2025-01-01	\N	t
6a71f5ed-8939-4147-93cb-bb0153c0e05a	93164df6-4a7c-40cc-a047-b5a6ad42843c	fdc627f6-ba48-4173-89e8-2f2ac83294c3	2025-01-01	\N	t
563c22b2-bb6e-4aa7-bb8f-3931d4c89d30	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	2025-01-01	\N	t
4bb3d3cf-ac49-44e9-b0a2-f151db0bd5f3	8c774552-83f9-44bd-8a3b-a3730dad0e22	88a2b56f-c9f6-49f5-8282-e2ac1237661d	2025-01-01	\N	t
134a033b-9adc-4efa-bbfa-6ac85075a3a7	93164df6-4a7c-40cc-a047-b5a6ad42843c	85869d04-2b09-4267-b058-3279c75eaed2	2025-01-01	\N	t
5aee7baf-3de6-40b8-96a6-c32768ec82cd	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	2025-01-01	\N	t
b0934718-5c8e-4fa5-b5a8-8397dd0f4973	4cadfad4-f521-4435-ab0e-76311c4b9928	08567c88-1fbd-4ce4-b43d-9d431dff232f	2025-01-01	\N	t
a1218d1e-acad-4111-bb63-6e9186d33a51	8c774552-83f9-44bd-8a3b-a3730dad0e22	d1186eb3-89fe-4586-b32c-162f332fa732	2025-01-01	\N	t
c409b698-3822-4941-8768-a1c071c40f45	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	278e2c63-012a-4727-ae52-66cc7adc4aba	2025-01-01	\N	t
f6cb5431-3cd1-421c-bae7-50ceb325f2aa	4cadfad4-f521-4435-ab0e-76311c4b9928	7bcd7425-b4d4-427a-b63c-464e239749e9	2025-01-01	\N	t
627bf173-0b32-4038-822f-e94de0278b5d	93164df6-4a7c-40cc-a047-b5a6ad42843c	908469d1-1beb-4e2b-ba49-a09e4e290672	2025-01-01	\N	t
9783248d-28ce-4be0-9047-640bb261480f	4cadfad4-f521-4435-ab0e-76311c4b9928	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	2025-01-01	\N	t
e99f0658-6924-4b01-9418-37a843d0d82f	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	913808aa-f12d-4bd1-8009-79f44eb4dd01	2025-01-01	\N	t
b7a99eef-d4c5-4d30-90af-960e8a800078	8c774552-83f9-44bd-8a3b-a3730dad0e22	b1d64090-41a3-466b-9a34-e03d5655a418	2025-01-01	\N	t
7b8ae669-0a31-4601-8b8b-80835a8c6953	93164df6-4a7c-40cc-a047-b5a6ad42843c	3281596d-274f-42db-8c78-59b2fcb694fa	2025-01-01	\N	t
31af153a-46b7-4054-9ec8-65c78f3a880b	8c774552-83f9-44bd-8a3b-a3730dad0e22	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	2025-01-01	\N	t
d408d3aa-8ba5-411f-859e-5d90b0e79f05	4cadfad4-f521-4435-ab0e-76311c4b9928	5c4c9cbc-516d-4db8-b2cb-23f8f697d436	2025-01-01	\N	t
4dd0a17f-806d-4618-944d-4e1006ac27af	8c774552-83f9-44bd-8a3b-a3730dad0e22	b644dfc7-5553-4889-8920-daa15b355715	2025-01-01	\N	t
b6c73c55-ee83-4544-93ef-450a8efb5672	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	298646e0-9b2f-4de1-8626-8274d5f997f1	2025-01-01	\N	t
4e46c861-8064-451d-af73-8a17512a7e38	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	dac88712-975d-473b-8c88-d44e7c579d23	2025-01-01	\N	t
7da021d1-8cc0-4aca-9c2d-597365da46fa	4cadfad4-f521-4435-ab0e-76311c4b9928	b31cf00e-36aa-4307-8e7e-893bb1261218	2025-01-01	\N	t
de240b0f-f99d-4dbf-8913-73cb1b80a6ff	93164df6-4a7c-40cc-a047-b5a6ad42843c	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	2025-01-01	\N	t
3fc4e186-9efc-43fd-bf19-6e67314fd072	8c774552-83f9-44bd-8a3b-a3730dad0e22	328b9de3-a19b-4be0-ac71-140f8fdc1060	2025-01-01	\N	t
791b993b-632f-4c7b-b167-c945da87eb86	8c774552-83f9-44bd-8a3b-a3730dad0e22	09786243-3caa-4d88-ad8c-2dcfbb0db897	2025-01-01	\N	t
e54caef5-8eab-404f-8a2c-c83bcf7a1db8	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	4ad79f15-b0c4-4dad-89ae-5aa82767f698	2025-01-01	\N	t
d6892957-687f-4291-af50-42c2973423c6	8c774552-83f9-44bd-8a3b-a3730dad0e22	7991b028-888d-404d-abae-ecf4f479483c	2025-01-01	\N	t
96f0517f-8881-4874-ab99-29cbd8af25a0	93164df6-4a7c-40cc-a047-b5a6ad42843c	4af5de73-9cd3-4076-b9ba-916790d2c20d	2025-01-01	\N	t
5fec4481-1b41-4b84-8235-80dc0312a91a	93164df6-4a7c-40cc-a047-b5a6ad42843c	94abc717-7066-43d5-a09a-a1e678e322ea	2025-01-01	\N	t
d248d188-e587-4566-8f4e-b25e26bb01f2	93164df6-4a7c-40cc-a047-b5a6ad42843c	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	2025-01-01	\N	t
1e85d26e-67c3-4d89-a2f3-7f2f5c9ed9ec	4cadfad4-f521-4435-ab0e-76311c4b9928	4d388595-f713-4573-ad2d-852612de70d2	2025-01-01	\N	t
462cf579-a892-4790-be5e-ea7e2c629146	93164df6-4a7c-40cc-a047-b5a6ad42843c	cbecff4e-5b38-4ab5-8297-8fd9479a668f	2025-01-01	\N	t
c671766e-f665-4da5-a92e-7a446dc9529b	8c774552-83f9-44bd-8a3b-a3730dad0e22	4026bca6-7f2f-4e9f-adc1-2027d608a689	2025-01-01	\N	t
c7e96b99-6e85-464d-af1c-f16c7f424b7c	93164df6-4a7c-40cc-a047-b5a6ad42843c	3ab409a6-021a-411f-a0a0-be1bb88d0faa	2025-01-01	\N	t
1b179050-c697-40d0-aa6e-bdec5ad1107f	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	568bd957-caa9-47c9-882f-5abb3eb7b423	2025-01-01	\N	t
\.


--
-- Data for Name: period; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.period (period_id, period_year, period_month, period_type, cycle_number, start_date, end_date, is_closed, parent_period_id) FROM stdin;
5e677d8f-5dec-45ba-ae26-c53c55965577	2026	4	CYCLE	1	2026-01-01	2026-04-30	f	\N
773466e8-00ea-48b4-bfc6-596544d54b8b	2026	8	CYCLE	2	2026-05-01	2026-08-31	f	\N
787a1d5e-2943-469d-a390-285071ecb800	2026	12	CYCLE	3	2026-09-01	2026-12-31	f	\N
ad89f431-8d44-41af-a0ba-fab83b4cf70e	2026	1	MONTH	\N	2026-01-01	2026-01-31	f	5e677d8f-5dec-45ba-ae26-c53c55965577
747e6c8d-420f-4e7a-b470-2d88505d3876	2026	2	MONTH	\N	2026-02-01	2026-02-28	f	5e677d8f-5dec-45ba-ae26-c53c55965577
88f08899-105e-4a05-8191-3cc2d8e73e7b	2026	3	MONTH	\N	2026-03-01	2026-03-31	f	5e677d8f-5dec-45ba-ae26-c53c55965577
a98493a4-acc1-4127-8ebb-02dca4698b47	2026	4	MONTH	\N	2026-04-01	2026-04-30	f	5e677d8f-5dec-45ba-ae26-c53c55965577
d498436d-c7e2-4f39-989b-a4928f3949f5	2026	5	MONTH	\N	2026-05-01	2026-05-31	f	773466e8-00ea-48b4-bfc6-596544d54b8b
3b166926-d61c-44e4-a30e-225ef33eaf12	2026	6	MONTH	\N	2026-06-01	2026-06-30	f	773466e8-00ea-48b4-bfc6-596544d54b8b
6f850717-674a-4fe3-b993-db9feb0cd22d	2026	7	MONTH	\N	2026-07-01	2026-07-31	f	773466e8-00ea-48b4-bfc6-596544d54b8b
57807e7f-35bc-4fdc-b96f-17ca0720cee7	2026	8	MONTH	\N	2026-08-01	2026-08-31	f	773466e8-00ea-48b4-bfc6-596544d54b8b
ea077ab1-bb50-4b6d-b965-c97549e1dfd7	2026	9	MONTH	\N	2026-09-01	2026-09-30	f	787a1d5e-2943-469d-a390-285071ecb800
ca6570ae-2c8c-4d6d-b5e0-c3c3296f0828	2026	10	MONTH	\N	2026-10-01	2026-10-31	f	787a1d5e-2943-469d-a390-285071ecb800
59547049-39a2-43e7-b841-e50cd93b8d50	2026	11	MONTH	\N	2026-11-01	2026-11-30	f	787a1d5e-2943-469d-a390-285071ecb800
6d358bdf-ff1e-4cab-a194-b5872c02f432	2026	12	MONTH	\N	2026-12-01	2026-12-31	f	787a1d5e-2943-469d-a390-285071ecb800
\.


--
-- Data for Name: person; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.person (person_id, document_type, document_number, first_name, last_name, full_name, active, created_at, updated_at) FROM stdin;
5f8ddd22-701a-4a02-ac2f-046a233940a9	CC	8747836	ALDO JOSE	ALBARRACIN MACKENZIE	ALBARRACIN MACKENZIE ALDO JOSE	t	2026-07-31 20:36:54.584	2026-07-31 20:36:54.584
762e08fc-db1f-40a0-9c99-496edaf669b6	CC	1067850307	YAJAIRA ANDREA	ALVAREZ BUELVAS	ALVAREZ BUELVAS YAJAIRA ANDREA	t	2026-07-31 20:36:57.92	2026-07-31 20:36:57.92
2daa9d72-4ec8-4ed6-93a6-044dab9a3519	CC	39752595	CLAUDIA PATRICIA	ARIAS PIRAGUA	ARIAS PIRAGUA CLAUDIA PATRICIA	t	2026-07-31 20:37:01.241	2026-07-31 20:37:01.241
5b83400f-2d0d-46e2-b1c0-3bc1de5ace31	CC	1233894053	JUAN ESTEBAN	ARISTIZABAL MORENO	ARISTIZABAL MORENO JUAN ESTEBAN	t	2026-07-31 20:37:04.714	2026-07-31 20:37:04.714
05b6c5ba-ce98-409e-9fb1-ca2f12666de3	CC	22705592	INES PATRICIA	ARIZA PEREZ	ARIZA PEREZ INES PATRICIA	t	2026-07-31 20:37:08.149	2026-07-31 20:37:08.149
d302cdd9-bd00-4a72-80da-2877a4b2672e	CC	79435411	JUAN CARLOS	BERNAL ARDILA	BERNAL ARDILA JUAN CARLOS	t	2026-07-31 20:37:10.128	2026-07-31 20:37:10.128
3ebc9a54-a97e-4791-b1da-e2df680d1e90	CC	52957210	MARIA ELSY	BUSTOS TENORIO	BUSTOS TENORIO MARIA ELSY	t	2026-07-31 20:37:13.431	2026-07-31 20:37:13.431
79ff9f43-0e42-4567-8917-64494f63fcf3	CC	1045723571	ZULINEY	CANTILLO BATISTA	CANTILLO BATISTA ZULINEY	t	2026-07-31 20:37:16.728	2026-07-31 20:37:16.728
04b103d4-0392-4aa4-8312-9abe12113aea	CC	52965381	IVONNE LILIANA	CANTURA BELTRAN	CANTURA BELTRAN IVONNE LILIANA	t	2026-07-31 20:37:20.025	2026-07-31 20:37:20.025
22b0d45a-7fa3-481f-aa47-1a8186137205	CC	1032401557	JOHANNA PAOLA	CONDE ZAPATA	CONDE ZAPATA JOHANNA PAOLA	t	2026-07-31 20:37:23.456	2026-07-31 20:37:23.456
0496bb28-775f-49dd-9bcb-ad0600490a40	CC	1098666680	AIDA LUZ	CONTRERAS MORENO	CONTRERAS MORENO AIDA LUZ	t	2026-07-31 20:37:26.753	2026-07-31 20:37:26.753
cd9eef46-3341-4a73-96ce-54316e03d5b2	CC	1140815359	DIANA MARIA	CORTES PARDO	CORTES PARDO DIANA MARIA	t	2026-07-31 20:37:30.055	2026-07-31 20:37:30.055
e2ccc058-a789-4d95-a86b-977e555cf0a7	CC	27111025	AMANDA RUBIELA	DIAZ NARVAEZ	DIAZ NARVAEZ AMANDA RUBIELA	t	2026-07-31 20:37:33.354	2026-07-31 20:37:33.354
9971397c-c374-4bc8-967d-21a9b761cfb9	CC	1037610563	JESSICA	ECHAVARRIA LONDOÑO	ECHAVARRIA LONDOÑO JESSICA	t	2026-07-31 20:37:36.789	2026-07-31 20:37:36.789
0e2ba710-50c7-4199-93c1-a047f2b5e92c	CC	71646230	MAURICIO	ECHEVERRI VILLA	ECHEVERRI VILLA MAURICIO	t	2026-07-31 20:37:40.09	2026-07-31 20:37:40.09
135fefba-d022-48c0-b1cd-d96ccf54681a	CC	1151950260	LUIS FELIPE	GARCIA PAREDES	GARCIA PAREDES LUIS FELIPE	t	2026-07-31 20:37:43.388	2026-07-31 20:37:43.388
0bb7bb11-f26f-47bc-9edd-c191df2c3ded	CC	79791421	CARLOS ANDRES	GERENA BALLEN	GERENA BALLEN CARLOS ANDRES	t	2026-07-31 20:37:45.369	2026-07-31 20:37:45.369
869e8f76-87b1-434d-9f8f-82538805872b	CC	79528550	JHONY ANGEL	GONZALEZ SUAREZ	GONZALEZ SUAREZ JHONY ANGEL	t	2026-07-31 20:37:48.669	2026-07-31 20:37:48.669
d1d40a15-b60a-4fcd-b9ff-0fd31cb6b1b6	CC	1110495490	ANA MARIA	GUZMAN SUAREZ	GUZMAN SUAREZ ANA MARIA	t	2026-07-31 20:37:52.098	2026-07-31 20:37:52.098
e8ddd786-bf83-4fe1-9ee1-bfd6752d9d66	CC	1030577286	JESSICA ANDREA	HUERTAS GOMEZ	HUERTAS GOMEZ JESSICA ANDREA	t	2026-07-31 20:37:55.4	2026-07-31 20:37:55.4
8aec862e-3999-45ed-b215-8573cf110bd7	CC	1047409019	ROSMERY	JIMENEZ TORRES	JIMENEZ TORRES ROSMERY	t	2026-07-31 20:37:58.697	2026-07-31 20:37:58.697
b669d785-65eb-403a-9bf6-35d9548dc4be	CC	52901968	SANDRA MILENA	LA ROTTA ESQUIVEL	LA ROTTA ESQUIVEL SANDRA MILENA	t	2026-07-31 20:38:01.99	2026-07-31 20:38:01.99
92a26463-40e7-4d86-ac2b-5ab7d32b3cf3	CC	16716795	WILSON	LANDYS GALEANO	LANDYS GALEANO WILSON	t	2026-07-31 20:38:05.295	2026-07-31 20:38:05.295
ee7cb655-9f28-4e65-bc30-53eafe7f0002	CC	1093747284	ASTRID JOHANNA	LEAL BASTOS	LEAL BASTOS ASTRID JOHANNA	t	2026-07-31 20:38:08.719	2026-07-31 20:38:08.719
c0aa9f4b-fbad-4de6-8dff-f7666bbd003f	CC	72134866	RENATO ANTONIO	MARTINEZ NARVAEZ	MARTINEZ NARVAEZ RENATO ANTONIO	t	2026-07-31 20:38:10.707	2026-07-31 20:38:10.707
2b696d62-0a34-4ec5-be53-fd71970981ca	CC	52905378	MARIA YAQUELINE	MARTINEZ VALENCIA	MARTINEZ VALENCIA MARIA YAQUELINE	t	2026-07-31 20:38:14.01	2026-07-31 20:38:14.01
13add797-f642-4d78-8a1e-b08da8f649b0	CC	42150191	CLAUDIA VIVIANA	MATTA BALLESTEROS	MATTA BALLESTEROS CLAUDIA VIVIANA	t	2026-07-31 20:38:15.99	2026-07-31 20:38:15.99
c278faf5-998d-4834-a370-75211e38b61b	CC	36285347	SANDRA PATRICIA	MEDINA CLAVIJO	MEDINA CLAVIJO SANDRA PATRICIA	t	2026-07-31 20:38:19.287	2026-07-31 20:38:19.287
3302b933-3a98-4f41-a50c-4cf4564fae0f	CC	42163808	LEANDRA MANDALLELY	MORALES AGUDELO	MORALES AGUDELO LEANDRA MANDALLELY	t	2026-07-31 20:38:22.737	2026-07-31 20:38:22.737
1111a9a6-7e7c-4ea5-b366-cdecbdd5579a	CC	91270100	ENRIQUE	MUÑOZ MEDINA	MUÑOZ MEDINA ENRIQUE	t	2026-07-31 20:38:26.063	2026-07-31 20:38:26.063
f96cbe1a-9f42-4171-ba81-7aab44a192ff	CC	1130593528	VIRGINIA	NAVARRETE BOLAÑOS	NAVARRETE BOLAÑOS VIRGINIA	t	2026-07-31 20:38:29.358	2026-07-31 20:38:29.358
d3cdf8a1-8328-4662-9488-17f589b33611	CC	1098622018	LISETH KARINA	NAVARRO DIAZ	NAVARRO DIAZ LISETH KARINA	t	2026-07-31 20:38:32.756	2026-07-31 20:38:32.756
60067a8e-9b5c-4e2b-8f09-718a97c446e1	CC	22478211	LILIANA PATRICIA	ONORO OSPINO	ONORO OSPINO LILIANA PATRICIA	t	2026-07-31 20:38:36.102	2026-07-31 20:38:36.102
a5d639bb-0256-4118-8588-0524b534480d	CC	79881218	JOLMANTH JOSE	POVEDA DIAZ	POVEDA DIAZ JOLMANTH JOSE	t	2026-07-31 20:38:39.555	2026-07-31 20:38:39.555
c82d9194-15b0-46ab-9b64-c7d7323001f0	CC	72165327	MARIO GIOVANNI	QUIÑONES TAFUR	QUIÑONES TAFUR MARIO GIOVANNI	t	2026-07-31 20:38:42.864	2026-07-31 20:38:42.864
3b0030e1-c650-4d14-b40c-7b95642e15e7	CC	1130665764	JUAN MANUEL	QUIÑONEZ SÁNCHEZ	QUIÑONEZ SÁNCHEZ JUAN MANUEL	t	2026-07-31 20:38:46.159	2026-07-31 20:38:46.159
d9f6a61b-7813-4d3f-acc3-2e5757f61303	CC	79395939	ORLANDO ANGEL	RAMOS BARRERO	RAMOS BARRERO ORLANDO ANGEL	t	2026-07-31 20:38:49.497	2026-07-31 20:38:49.497
7ab9b8ba-a4c9-470b-86f2-c2b772fcbb82	CC	94071018	DIEGO MAURICIO	RIVERA PERDOMO	RIVERA PERDOMO DIEGO MAURICIO	t	2026-07-31 20:38:52.942	2026-07-31 20:38:52.942
9cb28911-5fa6-46de-a66b-946c6f5dab35	CC	72131017	PABLO EMILIO	RODRIGUEZ OSORIO	RODRIGUEZ OSORIO PABLO EMILIO	t	2026-07-31 20:38:56.254	2026-07-31 20:38:56.254
6277af4d-11f8-4c9f-90f1-fb04e703e256	CC	1073155355	YESICA MILENA	RODRIGUEZ PUERTO	RODRIGUEZ PUERTO YESICA MILENA	t	2026-07-31 20:38:59.569	2026-07-31 20:38:59.569
1ce14957-855a-4a3b-abbb-55ead34898a8	CC	1015407446	RUBY NATALY	RODRIGUEZ REYES	RODRIGUEZ REYES RUBY NATALY	t	2026-07-31 20:39:02.868	2026-07-31 20:39:02.868
26fe9866-715c-4c77-bdca-27a382ee202f	CC	52370115	ROCIO	RODRIGUEZ RODRIGUEZ	RODRIGUEZ RODRIGUEZ ROCIO	t	2026-07-31 20:39:06.163	2026-07-31 20:39:06.163
098f4aab-9e89-44d3-8c8f-1143d1b105f7	CC	26946191	NORMA PATRICIA	SALAZAR CARDENAS	SALAZAR CARDENAS NORMA PATRICIA	t	2026-07-31 20:39:09.596	2026-07-31 20:39:09.596
5153c086-a3ce-49d2-a2cd-d2afead92eab	CC	53167389	PATRICIA	SALGUERO JOHANNA	SALGUERO JOHANNA PATRICIA	t	2026-07-31 20:39:12.895	2026-07-31 20:39:12.895
bdd4e03f-55da-4bf9-a1e4-27fac219a1d7	CC	67041861	SAKURA	SANABRIA QUIQUE	SANABRIA QUIQUE SAKURA	t	2026-07-31 20:39:16.2	2026-07-31 20:39:16.2
667c9894-c33f-4ca8-9498-2d5a4a089cee	CC	43455696	ANDREA	SOTO CATALINA	SOTO CATALINA ANDREA	t	2026-07-31 20:39:19.507	2026-07-31 20:39:19.507
24f6f7f9-579a-40cc-a771-aadd82bb3b59	CC	80016905	ARTURO	VARGAS CASTRO	VARGAS CASTRO ARTURO	t	2026-07-31 20:39:22.81	2026-07-31 20:39:22.81
623d1002-dab0-485c-bc01-981d32b8ed7c	CC	1019004326	SUSANA MILDREY	ZAPATA PALACIO	ZAPATA PALACIO SUSANA MILDREY	t	2026-07-31 20:39:26.246	2026-07-31 20:39:26.246
884a448f-62e3-4f12-98f5-6235b9d770f2	CC	1088824722	SEPULVEDA	SAMUEL	SAMUEL SEPULVEDA	t	2026-07-31 20:39:29.549	2026-07-31 20:39:29.549
67aa198b-8cd1-4a01-86e6-9aa3244af9a7	CC	79302779	ABRIL	ROBERTO	ROBERTO ABRIL	t	2026-07-31 20:39:32.874	2026-07-31 20:39:32.874
b5695357-6316-4fab-9aff-bab51cb271f5	CC	7169722	MORALES MONTAÑA	JAVIER ALBERTO	JAVIER ALBERTO MORALES MONTAÑA	t	2026-07-31 20:39:36.167	2026-07-31 20:39:36.167
1e64f791-80e3-4f35-9083-385d7b7037cf	CC	31309556	ARISTIZABAL	FABIANA	FABIANA ARISTIZABAL	t	2026-07-31 20:39:39.59	2026-07-31 20:39:39.59
\.


--
-- Data for Name: position; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."position" (position_id, position_name, description, active) FROM stdin;
10629b85-1bf8-4912-835e-fc170dbde791	Pharmacy Rep Chains	\N	t
59240d1d-a408-482e-a4f2-e9269111c91e	Pharmacy Rep Indep	\N	t
88d15cf5-b98b-43fe-a6be-af4512dfbd3b	National Pharmacy Coordinator	\N	t
1e74f6f2-d7fc-4831-ad0f-4cd754643845	Medical Sales Rep Xadago	\N	t
bbd4d2a9-3740-4d03-a35a-837ad7bb669e	Rep Mixta	\N	t
14e86863-eef3-4cfe-85bd-d454ccd29802	Rep VM (E+X)	\N	t
2df97ea9-b9d8-4518-bb0a-0981c774b8a3	GD (District Manager)	\N	t
3a522061-c47a-4384-b07a-753cb67e801d	KAM (Regional Sales Manager)	\N	t
e7dc3e9c-229b-4952-b39b-970b62543852	Commercial Director	\N	t
3d83e7b9-8d61-45c8-b4d0-ece17cb46724	Sell-Out Director	\N	t
ddcc3dca-ab28-4d84-8e91-913dedb840e2	Medical Rep Senior (E+X)	\N	f
102a2b79-97cd-4daa-b259-b7894b09a58f	Pharmacy Rep (Independet)	\N	f
f6395a57-e006-452b-ae33-2fed7c40c53b	District Manager	\N	f
9b088312-ff8f-45f8-afb9-1577b5081d8a	Commercial Junior Specialist	\N	f
a1304025-2939-4e46-96d4-8286dc4e3576	Regional Sales Manager (KAM)	\N	f
c346f24a-dc21-4e47-ab78-5d3569e08887	Pharmacy Rep and medical promotion	\N	f
ae3c689f-d851-4ddf-8b50-b06e3e921218	Pharmacy Rep (Chains)	\N	f
\.


--
-- Data for Name: region; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.region (region_id, region_name, active) FROM stdin;
8a603ede-a45c-499e-adc8-96411966a525	Colombia	t
\.


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role (role_id, role_name, description) FROM stdin;
315ad4fb-f109-44e5-8cdc-16d4eb240a69	ADMIN	Administra todo el sistema: parámetros, usuarios, reprocesos y cierres
da24dc50-c091-4c36-bdbf-b762f116e293	NOMINA	Consulta y exporta todos los resultados
2c8c8be8-7e37-401b-801c-8a43c63d35cb	GERENTE	Ve su árbol jerárquico (subordinados directos e indirectos)
b9c9bf5d-853a-4979-816c-73c31c6fe9d4	COORDINADOR	Ve su equipo
b1dc3461-d01f-482d-91ff-1ead787063b6	EMPLEADO	Ve únicamente su propia liquidación
\.


--
-- Data for Name: sales_component; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_component (component_id, component_code, component_name, component_type, active) FROM stdin;
43b23016-5ea6-4d23-91c7-14290a050e32	SELL_OUT_TOTAL_FLUIMUCIL	SELL OUT TOTAL FLUIMUCIL	SELL_OUT	t
951c8c3d-ceb8-4eca-b291-7005443411af	SELL_OUT_TOTAL_PANOTIL	SELL OUT TOTAL PANOTIL	SELL_OUT	t
23a6e464-1d48-48cd-9e60-1b92067460e5	ORDER_TAKING	Order Taking	ORDER_TAKING	t
5149a40e-419e-483e-969d-ef642d252c06	FLUIMUCIL_FMLIA_SELL_OUT	Fluimucil Fmlia. (Sell Out)	SELL_OUT	t
15e16108-5021-44f2-b303-04d67f8fac86	PANOTIL_SELL_OUT	Panotil (Sell Out)	SELL_OUT	t
da1956b8-f186-4d2e-86b4-50cd3f5b54c9	XADAGO_COM_INST	XADAGO (COM + INST))	OTHER	t
ffe5d345-5285-43a3-9a8a-c0495b268812	URSACOL	URSACOL	OTHER	t
1374279b-9ac2-4b1f-9759-e95bccc1e8c3	FLUIMUCIL_SELL_OUT	Fluimucil (Sell Out)	SELL_OUT	t
ca8a72cc-9d9b-4d42-9683-3372c828b2eb	MONURIL_SELL_OUT	Monuril (Sell Out)	SELL_OUT	t
883b6a4f-c67b-4b3b-a0db-fbac992a64aa	FLUIMUCIL_FMLIA	Fluimucil Fmlia.	OTHER	t
e529c58e-2de2-44ee-b791-a328f8582f27	XADAGO	Xadago ®	OTHER	t
d7251f14-67d2-4d92-b995-e674971e0f94	PANOTIL	Panotil ®	OTHER	t
c4b3341e-c5d5-40c8-a690-685b0ed9ae20	FLUIMUCIL_VM	Fluimucil (Rep VM)	OTHER	t
72c6c853-5c4f-4af0-85ab-7ab236ea6d54	MONURIL_VM	Monuril (Rep VM)	OTHER	t
326bd585-cf49-4882-9d69-6851958e1424	FLUTOX	Flutox	OTHER	t
3200ec4e-b119-489a-bfe4-5bf30beb9c49	FLUIMUCIL_PH360	Fluimucil (PH360)	OTHER	t
4407a61f-f92c-4c45-aebb-3da2735a8f01	MONURIL_PH360	Monuril (PH360)	OTHER	t
\.


--
-- Data for Name: sales_transaction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_transaction (sales_transaction_id, sales_upload_batch_id, employee_id, component_id, period_id, sale_value, sale_date, created_at) FROM stdin;
10f0efa3-54f0-41da-9d8a-867c56b71948	9c19995e-7abc-492b-9895-b4f7268bf58b	7bcd7425-b4d4-427a-b63c-464e239749e9	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	679.00	\N	2026-07-31 20:44:42.972
21587a82-e5a7-4877-b96d-7a36fc99c41a	9c19995e-7abc-492b-9895-b4f7268bf58b	94abc717-7066-43d5-a09a-a1e678e322ea	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2898.00	\N	2026-07-31 20:44:42.972
418fa923-0f1b-4f5c-9bd5-f62eaba30738	9c19995e-7abc-492b-9895-b4f7268bf58b	4af5de73-9cd3-4076-b9ba-916790d2c20d	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2740.00	\N	2026-07-31 20:44:42.972
045382e8-075b-44d7-a635-7642be14daf7	9c19995e-7abc-492b-9895-b4f7268bf58b	3ab409a6-021a-411f-a0a0-be1bb88d0faa	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2520.00	\N	2026-07-31 20:44:42.972
19639e79-64bd-473e-9fbb-974b91c1d23e	9c19995e-7abc-492b-9895-b4f7268bf58b	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1334.00	\N	2026-07-31 20:44:42.972
d5986790-2926-4d58-9e7c-00df39430fbb	9c19995e-7abc-492b-9895-b4f7268bf58b	08567c88-1fbd-4ce4-b43d-9d431dff232f	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1534.00	\N	2026-07-31 20:44:42.972
46d1f239-9136-419e-a0a4-bb757a81e005	9c19995e-7abc-492b-9895-b4f7268bf58b	7bcd7425-b4d4-427a-b63c-464e239749e9	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	305.00	\N	2026-07-31 20:44:42.972
3e1b1b5e-e64b-4405-982c-bc5e4fc675a9	9c19995e-7abc-492b-9895-b4f7268bf58b	94abc717-7066-43d5-a09a-a1e678e322ea	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	399.00	\N	2026-07-31 20:44:42.972
7b10e860-0868-40f2-9c7f-c4a6e7bc5cd7	9c19995e-7abc-492b-9895-b4f7268bf58b	4af5de73-9cd3-4076-b9ba-916790d2c20d	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	405.00	\N	2026-07-31 20:44:42.972
1aeb578a-6d21-4af6-89fc-7fea85b59a96	9c19995e-7abc-492b-9895-b4f7268bf58b	3ab409a6-021a-411f-a0a0-be1bb88d0faa	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	610.00	\N	2026-07-31 20:44:42.972
ca85d466-bce0-4aa5-a7aa-dd172cd3c1f0	9c19995e-7abc-492b-9895-b4f7268bf58b	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	607.00	\N	2026-07-31 20:44:42.972
179abd48-33df-46ef-a30b-96b8e95a3309	9c19995e-7abc-492b-9895-b4f7268bf58b	08567c88-1fbd-4ce4-b43d-9d431dff232f	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	512.00	\N	2026-07-31 20:44:42.972
4166adb0-22bf-4882-99b3-f62880c8a399	9c19995e-7abc-492b-9895-b4f7268bf58b	7bcd7425-b4d4-427a-b63c-464e239749e9	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	26441392.00	\N	2026-07-31 20:44:42.972
e7d09a61-07b2-40be-a49b-90b37453cc63	9c19995e-7abc-492b-9895-b4f7268bf58b	94abc717-7066-43d5-a09a-a1e678e322ea	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	23628082.00	\N	2026-07-31 20:44:42.972
eacb777a-c43e-4fa6-b655-6567390979db	9c19995e-7abc-492b-9895-b4f7268bf58b	4af5de73-9cd3-4076-b9ba-916790d2c20d	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	41116232.00	\N	2026-07-31 20:44:42.972
53782667-2611-44ff-8003-a4ad66e99758	9c19995e-7abc-492b-9895-b4f7268bf58b	3ab409a6-021a-411f-a0a0-be1bb88d0faa	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	33593706.00	\N	2026-07-31 20:44:42.972
47cee9ee-a4ae-472b-b27e-51cad77c1e3d	9c19995e-7abc-492b-9895-b4f7268bf58b	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	30629003.00	\N	2026-07-31 20:44:42.972
28a4c190-2851-43e3-85fc-057b51ffb940	9c19995e-7abc-492b-9895-b4f7268bf58b	08567c88-1fbd-4ce4-b43d-9d431dff232f	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	25256397.00	\N	2026-07-31 20:44:42.972
200f5565-7ab9-4b8f-bdec-12065cfe5de5	9c19995e-7abc-492b-9895-b4f7268bf58b	fdc627f6-ba48-4173-89e8-2f2ac83294c3	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	519.00	\N	2026-07-31 20:44:42.972
981218c4-49bb-46f9-b6cc-b8f36894b801	9c19995e-7abc-492b-9895-b4f7268bf58b	85869d04-2b09-4267-b058-3279c75eaed2	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	690.00	\N	2026-07-31 20:44:42.972
b69ab750-81fa-4e16-9230-e70c2377dccb	9c19995e-7abc-492b-9895-b4f7268bf58b	908469d1-1beb-4e2b-ba49-a09e4e290672	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	975.00	\N	2026-07-31 20:44:42.972
7a5730e9-c07f-4f9f-9978-c88564069e28	9c19995e-7abc-492b-9895-b4f7268bf58b	cbecff4e-5b38-4ab5-8297-8fd9479a668f	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1495.00	\N	2026-07-31 20:44:42.972
3d23ee4c-0bf5-4e9f-9eb8-f2d5f3a35242	9c19995e-7abc-492b-9895-b4f7268bf58b	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1018.00	\N	2026-07-31 20:44:42.972
717e62e8-f793-43fd-a0b1-a73bf2db0078	9c19995e-7abc-492b-9895-b4f7268bf58b	b31cf00e-36aa-4307-8e7e-893bb1261218	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1175.00	\N	2026-07-31 20:44:42.972
32a7ea9d-7fc4-4de0-810c-8d5b3b156d96	9c19995e-7abc-492b-9895-b4f7268bf58b	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	934.00	\N	2026-07-31 20:44:42.972
2887f020-1d87-4827-b415-397bfe57321b	9c19995e-7abc-492b-9895-b4f7268bf58b	06b2473b-4e72-417c-879d-ae9104996738	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1076.00	\N	2026-07-31 20:44:42.972
b11d8964-fc43-408c-975b-20e23be0a0f5	9c19995e-7abc-492b-9895-b4f7268bf58b	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1567.00	\N	2026-07-31 20:44:42.972
44d6146d-1218-4c58-a35e-aa751d57724e	9c19995e-7abc-492b-9895-b4f7268bf58b	fdc627f6-ba48-4173-89e8-2f2ac83294c3	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	197.00	\N	2026-07-31 20:44:42.972
f3e471fb-cfa9-41a3-992b-611295991c1a	9c19995e-7abc-492b-9895-b4f7268bf58b	85869d04-2b09-4267-b058-3279c75eaed2	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	270.00	\N	2026-07-31 20:44:42.972
d6bede6f-8dc6-46f3-8099-26f599dc4ffe	9c19995e-7abc-492b-9895-b4f7268bf58b	908469d1-1beb-4e2b-ba49-a09e4e290672	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	337.00	\N	2026-07-31 20:44:42.972
470e4ffc-5e3a-430b-9928-28f401f0041f	9c19995e-7abc-492b-9895-b4f7268bf58b	cbecff4e-5b38-4ab5-8297-8fd9479a668f	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	299.00	\N	2026-07-31 20:44:42.972
f60a02b5-f130-43ff-bb96-25e9bcde7464	9c19995e-7abc-492b-9895-b4f7268bf58b	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	348.00	\N	2026-07-31 20:44:42.972
85a55d4c-3098-4f1b-99ab-571ee4727b36	9c19995e-7abc-492b-9895-b4f7268bf58b	b31cf00e-36aa-4307-8e7e-893bb1261218	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	380.00	\N	2026-07-31 20:44:42.972
d1d89d04-96b4-4d26-a320-3e6251c5c66d	9c19995e-7abc-492b-9895-b4f7268bf58b	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	279.00	\N	2026-07-31 20:44:42.972
2ed0c294-f3f9-4f06-91ae-6e3c0e5cc5ef	9c19995e-7abc-492b-9895-b4f7268bf58b	06b2473b-4e72-417c-879d-ae9104996738	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	366.00	\N	2026-07-31 20:44:42.972
35805022-90b2-4dec-983d-8b8a615f1d88	9c19995e-7abc-492b-9895-b4f7268bf58b	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	340.00	\N	2026-07-31 20:44:42.972
c7aba2ec-4715-4a7a-b914-96259e2074ba	9c19995e-7abc-492b-9895-b4f7268bf58b	fdc627f6-ba48-4173-89e8-2f2ac83294c3	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	25423231.00	\N	2026-07-31 20:44:42.972
6a235b52-c3f4-4881-b98c-21dee473d641	9c19995e-7abc-492b-9895-b4f7268bf58b	85869d04-2b09-4267-b058-3279c75eaed2	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	60731348.00	\N	2026-07-31 20:44:42.972
8b0d6fcb-d316-4d1d-9195-af42fa0ca2ef	9c19995e-7abc-492b-9895-b4f7268bf58b	908469d1-1beb-4e2b-ba49-a09e4e290672	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	20275127.00	\N	2026-07-31 20:44:42.972
189cb0dc-a5da-44a5-833b-fa720d8e6fa5	9c19995e-7abc-492b-9895-b4f7268bf58b	cbecff4e-5b38-4ab5-8297-8fd9479a668f	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	25458073.00	\N	2026-07-31 20:44:42.972
f395136d-d0a2-4ef8-9c90-84388456ce96	9c19995e-7abc-492b-9895-b4f7268bf58b	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	22986809.00	\N	2026-07-31 20:44:42.972
965d5aec-dec6-42d6-9cdb-b871df577331	9c19995e-7abc-492b-9895-b4f7268bf58b	b31cf00e-36aa-4307-8e7e-893bb1261218	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	40728313.00	\N	2026-07-31 20:44:42.972
1f266db3-dce1-4ce1-9fc0-1e790dad0064	9c19995e-7abc-492b-9895-b4f7268bf58b	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	32341027.00	\N	2026-07-31 20:44:42.972
fcf459fd-5fdd-44fa-bade-cdaedee7f11f	9c19995e-7abc-492b-9895-b4f7268bf58b	06b2473b-4e72-417c-879d-ae9104996738	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	29662202.00	\N	2026-07-31 20:44:42.972
1b0d604d-57a6-47fe-b576-b4194abc8875	9c19995e-7abc-492b-9895-b4f7268bf58b	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	33533765.00	\N	2026-07-31 20:44:42.972
6a288fcc-ba39-4890-b0b8-512ce44484e8	9c19995e-7abc-492b-9895-b4f7268bf58b	93164df6-4a7c-40cc-a047-b5a6ad42843c	5149a40e-419e-483e-969d-ef642d252c06	ad89f431-8d44-41af-a0ba-fab83b4cf70e	15798.00	\N	2026-07-31 20:44:42.972
0f4618fc-9a0c-4567-a4ce-e8ef863130cb	9c19995e-7abc-492b-9895-b4f7268bf58b	4cadfad4-f521-4435-ab0e-76311c4b9928	5149a40e-419e-483e-969d-ef642d252c06	ad89f431-8d44-41af-a0ba-fab83b4cf70e	15798.00	\N	2026-07-31 20:44:42.972
f07587b0-5ea1-4d58-a21a-56cd7e7fbfe5	9c19995e-7abc-492b-9895-b4f7268bf58b	93164df6-4a7c-40cc-a047-b5a6ad42843c	15e16108-5021-44f2-b303-04d67f8fac86	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3738.00	\N	2026-07-31 20:44:42.972
b3a2ed32-ddd5-4f23-aeb1-fb66649bbc41	9c19995e-7abc-492b-9895-b4f7268bf58b	4cadfad4-f521-4435-ab0e-76311c4b9928	15e16108-5021-44f2-b303-04d67f8fac86	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3738.00	\N	2026-07-31 20:44:42.972
cb9f1bab-4b68-4423-8f0b-1d587a880844	9c19995e-7abc-492b-9895-b4f7268bf58b	93164df6-4a7c-40cc-a047-b5a6ad42843c	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	415350560.00	\N	2026-07-31 20:44:42.972
8175f7f1-d0b8-4304-9b1f-f8e0b3519540	9c19995e-7abc-492b-9895-b4f7268bf58b	4cadfad4-f521-4435-ab0e-76311c4b9928	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	415350560.00	\N	2026-07-31 20:44:42.972
898291c9-729d-4acc-85a8-2dbbdc97fca5	9c19995e-7abc-492b-9895-b4f7268bf58b	4ad79f15-b0c4-4dad-89ae-5aa82767f698	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:44:42.972
51275fa8-a332-433f-9559-f6f9e1339511	9c19995e-7abc-492b-9895-b4f7268bf58b	b1d64090-41a3-466b-9a34-e03d5655a418	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:44:42.972
c6f62d8b-cd25-40e9-ba3c-019fe735d82a	9c19995e-7abc-492b-9895-b4f7268bf58b	4ad79f15-b0c4-4dad-89ae-5aa82767f698	ffe5d345-5285-43a3-9a8a-c0495b268812	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1256377172.00	\N	2026-07-31 20:44:42.972
f38f90ad-6a55-46fc-83e4-83d43055e8c6	9c19995e-7abc-492b-9895-b4f7268bf58b	b1d64090-41a3-466b-9a34-e03d5655a418	ffe5d345-5285-43a3-9a8a-c0495b268812	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1256377172.00	\N	2026-07-31 20:44:42.972
ea3d5a6c-82d9-427c-9965-f841cfc005b5	9c19995e-7abc-492b-9895-b4f7268bf58b	88a2b56f-c9f6-49f5-8282-e2ac1237661d	1374279b-9ac2-4b1f-9759-e95bccc1e8c3	ad89f431-8d44-41af-a0ba-fab83b4cf70e	873.00	\N	2026-07-31 20:44:42.972
63b16a48-7025-4c57-b7c5-bee61e72724a	9c19995e-7abc-492b-9895-b4f7268bf58b	88a2b56f-c9f6-49f5-8282-e2ac1237661d	ca8a72cc-9d9b-4d42-9683-3372c828b2eb	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1263.00	\N	2026-07-31 20:44:42.972
6ac8f71e-ab9e-4b90-8f24-9789aae0a287	9c19995e-7abc-492b-9895-b4f7268bf58b	88a2b56f-c9f6-49f5-8282-e2ac1237661d	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	37905191.00	\N	2026-07-31 20:44:42.972
0d9ce5c4-2546-40a9-923c-09dc36704db4	9c19995e-7abc-492b-9895-b4f7268bf58b	da4c35c9-7e96-480d-9449-3f62853938d4	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3012884555.00	\N	2026-07-31 20:44:42.972
4654a235-e993-4525-81fa-5522d8fd3652	9c19995e-7abc-492b-9895-b4f7268bf58b	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3012884555.00	\N	2026-07-31 20:44:42.972
6ede25a4-7c5c-4528-a84f-10410de4170a	9c19995e-7abc-492b-9895-b4f7268bf58b	da4c35c9-7e96-480d-9449-3f62853938d4	e529c58e-2de2-44ee-b791-a328f8582f27	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:44:42.972
2f3008fe-8802-4a6b-8b1d-256c93306f73	9c19995e-7abc-492b-9895-b4f7268bf58b	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	e529c58e-2de2-44ee-b791-a328f8582f27	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:44:42.972
c1c112cc-1972-42ef-b9d1-be34c993c94c	9c19995e-7abc-492b-9895-b4f7268bf58b	da4c35c9-7e96-480d-9449-3f62853938d4	d7251f14-67d2-4d92-b995-e674971e0f94	ad89f431-8d44-41af-a0ba-fab83b4cf70e	652046193.00	\N	2026-07-31 20:44:42.972
645258fb-5288-41c5-8c76-c5dd43d156a1	9c19995e-7abc-492b-9895-b4f7268bf58b	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	d7251f14-67d2-4d92-b995-e674971e0f94	ad89f431-8d44-41af-a0ba-fab83b4cf70e	652046193.00	\N	2026-07-31 20:44:42.972
d0df784c-ddd3-46f3-b428-2738c834caf2	d524b5db-f197-41ad-82c8-80e8a2e42d41	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2190.00	\N	2026-07-31 20:46:19.416
487268ff-dc2f-43ef-8da6-76dbabdfd9de	d524b5db-f197-41ad-82c8-80e8a2e42d41	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	991.00	\N	2026-07-31 20:46:19.416
3b8354df-b876-4289-a48c-3cb5d08442c9	d524b5db-f197-41ad-82c8-80e8a2e42d41	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	101.00	\N	2026-07-31 20:46:19.416
10b8e2c1-5af7-48d5-810c-deb882cd2b34	d524b5db-f197-41ad-82c8-80e8a2e42d41	298646e0-9b2f-4de1-8626-8274d5f997f1	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	6046.00	\N	2026-07-31 20:46:19.416
0fe85496-e3f6-45cd-82f4-d5f84ce46280	d524b5db-f197-41ad-82c8-80e8a2e42d41	298646e0-9b2f-4de1-8626-8274d5f997f1	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2786.00	\N	2026-07-31 20:46:19.416
738d4289-c057-4f12-a0a4-29b09f4e7bf8	d524b5db-f197-41ad-82c8-80e8a2e42d41	298646e0-9b2f-4de1-8626-8274d5f997f1	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	424.00	\N	2026-07-31 20:46:19.416
f3b5a2fe-f072-44c7-a894-1336a16dcf26	d524b5db-f197-41ad-82c8-80e8a2e42d41	568bd957-caa9-47c9-882f-5abb3eb7b423	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3753.00	\N	2026-07-31 20:46:19.416
18de64bb-2cb4-477d-97e1-f2f1040d9137	d524b5db-f197-41ad-82c8-80e8a2e42d41	568bd957-caa9-47c9-882f-5abb3eb7b423	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1791.00	\N	2026-07-31 20:46:19.416
30c2aa5e-84cd-4718-8ab9-44bf5cd0b320	d524b5db-f197-41ad-82c8-80e8a2e42d41	568bd957-caa9-47c9-882f-5abb3eb7b423	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	293.00	\N	2026-07-31 20:46:19.416
8cd333c5-1c4d-470e-b3dc-c29e00789170	d524b5db-f197-41ad-82c8-80e8a2e42d41	d845bba5-0bad-40ff-83af-4be067bcf13b	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	5277.00	\N	2026-07-31 20:46:19.416
198f6605-36c1-4f03-ab37-af2b5a7a3cf8	d524b5db-f197-41ad-82c8-80e8a2e42d41	d845bba5-0bad-40ff-83af-4be067bcf13b	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2473.00	\N	2026-07-31 20:46:19.416
42e51501-fb1c-49e7-84ef-d9a46dc45f20	d524b5db-f197-41ad-82c8-80e8a2e42d41	d845bba5-0bad-40ff-83af-4be067bcf13b	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	316.00	\N	2026-07-31 20:46:19.416
afed1d5c-2a30-47fb-99c0-dd4035177850	d524b5db-f197-41ad-82c8-80e8a2e42d41	278e2c63-012a-4727-ae52-66cc7adc4aba	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	5565.00	\N	2026-07-31 20:46:19.416
b9d6c42c-08d1-4565-801e-1e710250da59	d524b5db-f197-41ad-82c8-80e8a2e42d41	278e2c63-012a-4727-ae52-66cc7adc4aba	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2589.00	\N	2026-07-31 20:46:19.416
5f6b4d62-ff3b-4ffd-8d81-917a1271c587	d524b5db-f197-41ad-82c8-80e8a2e42d41	278e2c63-012a-4727-ae52-66cc7adc4aba	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	303.00	\N	2026-07-31 20:46:19.416
f57170c9-2c76-4034-983f-a7b925ab66e0	d524b5db-f197-41ad-82c8-80e8a2e42d41	913808aa-f12d-4bd1-8009-79f44eb4dd01	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2372.00	\N	2026-07-31 20:46:19.416
28e03a9e-8a38-4605-98ab-238d096cc6e8	d524b5db-f197-41ad-82c8-80e8a2e42d41	913808aa-f12d-4bd1-8009-79f44eb4dd01	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1609.00	\N	2026-07-31 20:46:19.416
de82766a-054f-449e-a915-9a59786b7f62	d524b5db-f197-41ad-82c8-80e8a2e42d41	913808aa-f12d-4bd1-8009-79f44eb4dd01	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	205.00	\N	2026-07-31 20:46:19.416
f4c96b3a-c33f-4875-8e7a-25899defe44e	d524b5db-f197-41ad-82c8-80e8a2e42d41	925b97c8-722d-4767-8845-3553e5747fbc	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1791.00	\N	2026-07-31 20:46:19.416
01765800-f269-44b8-8cc1-2e25a8a01f19	d524b5db-f197-41ad-82c8-80e8a2e42d41	925b97c8-722d-4767-8845-3553e5747fbc	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1756.00	\N	2026-07-31 20:46:19.416
7214881d-35fd-4e0a-9021-6684eb16be9e	d524b5db-f197-41ad-82c8-80e8a2e42d41	925b97c8-722d-4767-8845-3553e5747fbc	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	444.00	\N	2026-07-31 20:46:19.416
f6122c9b-8327-41a0-ade8-b89ce8616293	d524b5db-f197-41ad-82c8-80e8a2e42d41	328b9de3-a19b-4be0-ac71-140f8fdc1060	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2746.00	\N	2026-07-31 20:46:19.416
72d01fb0-671a-4327-a519-8fb8c539ad2e	d524b5db-f197-41ad-82c8-80e8a2e42d41	328b9de3-a19b-4be0-ac71-140f8fdc1060	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2029.00	\N	2026-07-31 20:46:19.416
7151c4c2-97ca-4ca5-af2c-4a4b43ab79fe	d524b5db-f197-41ad-82c8-80e8a2e42d41	328b9de3-a19b-4be0-ac71-140f8fdc1060	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	362.00	\N	2026-07-31 20:46:19.416
e395a41c-c98a-4152-be4b-ac683a99ead4	d524b5db-f197-41ad-82c8-80e8a2e42d41	09786243-3caa-4d88-ad8c-2dcfbb0db897	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3195.00	\N	2026-07-31 20:46:19.416
c87da253-1ebd-431b-a24e-4c9a0e65ad5b	d524b5db-f197-41ad-82c8-80e8a2e42d41	09786243-3caa-4d88-ad8c-2dcfbb0db897	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2619.00	\N	2026-07-31 20:46:19.416
01ee7bb0-286a-4cdb-aafa-a4e335d5a4bf	d524b5db-f197-41ad-82c8-80e8a2e42d41	09786243-3caa-4d88-ad8c-2dcfbb0db897	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	346.00	\N	2026-07-31 20:46:19.416
3c51ba2f-d979-4327-9a8f-874eae136a88	d524b5db-f197-41ad-82c8-80e8a2e42d41	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3427.00	\N	2026-07-31 20:46:19.416
59fc7636-537a-44ed-9265-56e188dfe975	d524b5db-f197-41ad-82c8-80e8a2e42d41	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2009.00	\N	2026-07-31 20:46:19.416
a5ca1525-04c5-4c2e-86e0-c3aa75c345e4	d524b5db-f197-41ad-82c8-80e8a2e42d41	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	222.00	\N	2026-07-31 20:46:19.416
6f2f8a81-214d-4eeb-b142-16f1830ca048	d524b5db-f197-41ad-82c8-80e8a2e42d41	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3953.00	\N	2026-07-31 20:46:19.416
76f66a9a-d710-4925-8a29-0e31f0f208d3	d524b5db-f197-41ad-82c8-80e8a2e42d41	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	0.00	\N	2026-07-31 20:46:19.416
ec4866f0-eef5-4068-a548-d77611b83d13	d524b5db-f197-41ad-82c8-80e8a2e42d41	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:46:19.416
aab2569c-b440-49b0-91c3-695233bc3b8f	d524b5db-f197-41ad-82c8-80e8a2e42d41	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3883.00	\N	2026-07-31 20:46:19.416
fa114bd6-90c4-4f2b-8fe5-2a852e6cc8aa	d524b5db-f197-41ad-82c8-80e8a2e42d41	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3383.00	\N	2026-07-31 20:46:19.416
46182519-7581-436d-9df3-27346140a709	d524b5db-f197-41ad-82c8-80e8a2e42d41	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	424.00	\N	2026-07-31 20:46:19.416
e8993627-0b94-4c3e-ae3f-1e0cc28a9892	d524b5db-f197-41ad-82c8-80e8a2e42d41	dac88712-975d-473b-8c88-d44e7c579d23	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	6189.00	\N	2026-07-31 20:46:19.416
0400d73b-e0d8-4804-ab62-ccd3313c0e40	d524b5db-f197-41ad-82c8-80e8a2e42d41	dac88712-975d-473b-8c88-d44e7c579d23	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3580.00	\N	2026-07-31 20:46:19.416
837afb42-5877-4608-a6e7-93a3f7a17c12	d524b5db-f197-41ad-82c8-80e8a2e42d41	dac88712-975d-473b-8c88-d44e7c579d23	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	418.00	\N	2026-07-31 20:46:19.416
e28d3c45-8eb3-4c60-9f97-746bac9f45b4	d524b5db-f197-41ad-82c8-80e8a2e42d41	d1186eb3-89fe-4586-b32c-162f332fa732	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2321.00	\N	2026-07-31 20:46:19.416
bc3e262a-ae49-487f-82b8-33eda0d041b7	d524b5db-f197-41ad-82c8-80e8a2e42d41	d1186eb3-89fe-4586-b32c-162f332fa732	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2953.00	\N	2026-07-31 20:46:19.416
4f9a4ae7-76dc-40b3-9c5d-5685828bec3c	d524b5db-f197-41ad-82c8-80e8a2e42d41	d1186eb3-89fe-4586-b32c-162f332fa732	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	347.00	\N	2026-07-31 20:46:19.416
74d7d1e6-7778-4321-a44d-b32dba6e9b22	d524b5db-f197-41ad-82c8-80e8a2e42d41	4026bca6-7f2f-4e9f-adc1-2027d608a689	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2562.00	\N	2026-07-31 20:46:19.416
b3909c42-36dd-4d32-abb4-8be7625f8d04	d524b5db-f197-41ad-82c8-80e8a2e42d41	4026bca6-7f2f-4e9f-adc1-2027d608a689	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3339.00	\N	2026-07-31 20:46:19.416
c82a2edd-a90f-48a1-9df3-ad55266f0760	d524b5db-f197-41ad-82c8-80e8a2e42d41	4026bca6-7f2f-4e9f-adc1-2027d608a689	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	318.00	\N	2026-07-31 20:46:19.416
b689eb88-847c-41bb-897c-9eea6aee4f77	d524b5db-f197-41ad-82c8-80e8a2e42d41	b644dfc7-5553-4889-8920-daa15b355715	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2463.00	\N	2026-07-31 20:46:19.416
9eb6a370-c0c4-4daa-8613-6300ef4bfea0	d524b5db-f197-41ad-82c8-80e8a2e42d41	b644dfc7-5553-4889-8920-daa15b355715	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	ad89f431-8d44-41af-a0ba-fab83b4cf70e	0.00	\N	2026-07-31 20:46:19.416
f21beed1-5bc5-41d5-a488-70b997a76ed6	d524b5db-f197-41ad-82c8-80e8a2e42d41	b644dfc7-5553-4889-8920-daa15b355715	326bd585-cf49-4882-9d69-6851958e1424	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:46:19.416
cd2873e7-3a57-49d8-b278-4af670fd364c	d524b5db-f197-41ad-82c8-80e8a2e42d41	8c774552-83f9-44bd-8a3b-a3730dad0e22	3200ec4e-b119-489a-bfe4-5bf30beb9c49	ad89f431-8d44-41af-a0ba-fab83b4cf70e	19378.00	\N	2026-07-31 20:46:19.416
bcdd7bd5-432f-45d3-87f8-e83853071f1a	d524b5db-f197-41ad-82c8-80e8a2e42d41	8c774552-83f9-44bd-8a3b-a3730dad0e22	4407a61f-f92c-4c45-aebb-3da2735a8f01	ad89f431-8d44-41af-a0ba-fab83b4cf70e	15968.00	\N	2026-07-31 20:46:19.416
4f997756-50bb-4a39-8ea9-af0e6831c102	d524b5db-f197-41ad-82c8-80e8a2e42d41	8c774552-83f9-44bd-8a3b-a3730dad0e22	e529c58e-2de2-44ee-b791-a328f8582f27	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:46:19.416
350352ae-f826-4c8b-af3b-69730433e3ad	d524b5db-f197-41ad-82c8-80e8a2e42d41	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	3200ec4e-b119-489a-bfe4-5bf30beb9c49	ad89f431-8d44-41af-a0ba-fab83b4cf70e	39228.00	\N	2026-07-31 20:46:19.416
435ccf44-44e9-4ae7-8c6e-02aed11ea9a8	d524b5db-f197-41ad-82c8-80e8a2e42d41	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	4407a61f-f92c-4c45-aebb-3da2735a8f01	ad89f431-8d44-41af-a0ba-fab83b4cf70e	19202.00	\N	2026-07-31 20:46:19.416
61e21818-5b40-4763-9f70-3509787e30c5	d524b5db-f197-41ad-82c8-80e8a2e42d41	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	e529c58e-2de2-44ee-b791-a328f8582f27	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:46:19.416
117787df-c4be-4f1e-a44c-2c1fda430ef8	f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3012884555.00	\N	2026-07-31 20:47:06.152
ead4cf23-f5eb-44e8-bf64-98b8dd648e93	f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	e529c58e-2de2-44ee-b791-a328f8582f27	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:47:06.152
0c0b9688-ee64-4038-9eb4-8379532db58d	f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	d7251f14-67d2-4d92-b995-e674971e0f94	ad89f431-8d44-41af-a0ba-fab83b4cf70e	652046193.00	\N	2026-07-31 20:47:06.152
74cf1f70-6a34-4eda-b672-444e63a4017b	f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	96ec8d2e-4828-4c91-916d-f995d755d146	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	ad89f431-8d44-41af-a0ba-fab83b4cf70e	3012884555.00	\N	2026-07-31 20:47:06.152
65b3558a-5809-492f-8374-4e88a580c51f	f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	96ec8d2e-4828-4c91-916d-f995d755d146	e529c58e-2de2-44ee-b791-a328f8582f27	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:47:06.152
a1cd06dd-9a57-4451-937e-168446e977ee	f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	96ec8d2e-4828-4c91-916d-f995d755d146	d7251f14-67d2-4d92-b995-e674971e0f94	ad89f431-8d44-41af-a0ba-fab83b4cf70e	652046193.00	\N	2026-07-31 20:47:06.152
f73d3071-ab35-4bc2-9060-bb112283030c	3b67df62-740b-4ae4-8374-2c3f8d029d5f	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	697.00	\N	2026-07-31 20:47:32.027
f4be146c-7830-4a43-8098-a5c80c92df66	3b67df62-740b-4ae4-8374-2c3f8d029d5f	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	228.00	\N	2026-07-31 20:47:32.027
932f3e3d-7d67-4490-89a8-98c982c74c16	3b67df62-740b-4ae4-8374-2c3f8d029d5f	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	41091176.00	\N	2026-07-31 20:47:32.027
8a9ddaa0-9d85-4801-a3e2-67e6c70495b2	3b67df62-740b-4ae4-8374-2c3f8d029d5f	4d388595-f713-4573-ad2d-852612de70d2	43b23016-5ea6-4d23-91c7-14290a050e32	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2645.00	\N	2026-07-31 20:47:32.027
d72d1559-22b5-4483-b305-c3ac1464c8aa	3b67df62-740b-4ae4-8374-2c3f8d029d5f	4d388595-f713-4573-ad2d-852612de70d2	951c8c3d-ceb8-4eca-b291-7005443411af	ad89f431-8d44-41af-a0ba-fab83b4cf70e	814.00	\N	2026-07-31 20:47:32.027
4ff6ea4e-fded-411d-9c99-03891cf503fe	3b67df62-740b-4ae4-8374-2c3f8d029d5f	4d388595-f713-4573-ad2d-852612de70d2	23a6e464-1d48-48cd-9e60-1b92067460e5	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2975187.00	\N	2026-07-31 20:47:32.027
b23b1839-bcaf-44c2-a840-c6e5b5fed2d5	efa35da2-7258-4f0e-9edf-eb94c40d83bf	7991b028-888d-404d-abae-ecf4f479483c	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	ad89f431-8d44-41af-a0ba-fab83b4cf70e	2182744995.00	\N	2026-07-31 20:47:48.099
029b3a6d-c8a2-4054-93b0-5bff6d0482f6	efa35da2-7258-4f0e-9edf-eb94c40d83bf	7991b028-888d-404d-abae-ecf4f479483c	ffe5d345-5285-43a3-9a8a-c0495b268812	ad89f431-8d44-41af-a0ba-fab83b4cf70e	1256377172.00	\N	2026-07-31 20:47:48.099
\.


--
-- Data for Name: sales_upload_batch; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_upload_batch (sales_upload_batch_id, period_id, uploaded_by_user_id, file_name, file_hash, source_format, status, uploaded_at) FROM stdin;
9c19995e-7abc-492b-9895-b4f7268bf58b	ad89f431-8d44-41af-a0ba-fab83b4cf70e	79a29d51-e5a3-4482-97ad-ef541ea762a4	calculocomisiones.xlsx	371c677cdded567ed906705823c403bf2520fbd8467e65f9949cb16e1cf421c7	XLSX	IMPORTED	2026-07-31 20:44:42.415
d524b5db-f197-41ad-82c8-80e8a2e42d41	ad89f431-8d44-41af-a0ba-fab83b4cf70e	79a29d51-e5a3-4482-97ad-ef541ea762a4	calculocomisiones.xlsx	371c677cdded567ed906705823c403bf2520fbd8467e65f9949cb16e1cf421c7	XLSX	IMPORTED	2026-07-31 20:46:18.869
f76478ab-0a0f-4fe5-9944-f6ac9cac0bae	ad89f431-8d44-41af-a0ba-fab83b4cf70e	79a29d51-e5a3-4482-97ad-ef541ea762a4	calculocomisiones.xlsx	371c677cdded567ed906705823c403bf2520fbd8467e65f9949cb16e1cf421c7	XLSX	IMPORTED	2026-07-31 20:47:05.61
3b67df62-740b-4ae4-8374-2c3f8d029d5f	ad89f431-8d44-41af-a0ba-fab83b4cf70e	79a29d51-e5a3-4482-97ad-ef541ea762a4	calculocomisiones.xlsx	371c677cdded567ed906705823c403bf2520fbd8467e65f9949cb16e1cf421c7	XLSX	IMPORTED	2026-07-31 20:47:31.492
efa35da2-7258-4f0e-9edf-eb94c40d83bf	ad89f431-8d44-41af-a0ba-fab83b4cf70e	79a29d51-e5a3-4482-97ad-ef541ea762a4	calculocomisiones.xlsx	371c677cdded567ed906705823c403bf2520fbd8467e65f9949cb16e1cf421c7	XLSX	IMPORTED	2026-07-31 20:47:47.552
\.


--
-- Data for Name: team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team (team_id, team_code, team_name, active, pays_20_monthly) FROM stdin;
205282ef-3374-4d6d-891d-f51a67e2a1f5	REGIONAL_SALES_MANAGER_KAM	KAM (Regional Sales Manager)	t	t
f2f7213a-da5c-488e-925c-cd4849184a7b	COMMERCIAL_MARKET_ACCESS_DIRECTOR	Commercial Director	t	t
d52f8548-598d-4c19-86cc-aff78b7124e2	DIRECTORA_DBDT_SELL_OUT	Sell-Out Director	t	t
40c03523-202d-4eb3-8c06-011afd8a691c	PHARMACY_REP_CHAINS	Pharmacy Rep Chains	t	f
c4f8fcad-660e-4aee-a188-a7da46ba040f	PHARMACY_REP_INDEPENDET	Pharmacy Rep Indep	t	f
9e992b2a-f38b-47f2-9bac-a32294a5bc8b	NATIONAL_PHARMACY_COORDINATOR	National Pharmacy Coordinator	t	f
bff6a01e-9128-487d-9f49-a2929ee5bf3c	MEDICAL_SALES_REP_XADAGO	Medical Sales Rep Xadago	t	f
514e007a-79c7-4e83-be17-6cf95e82cb41	MEDICAL_REP_MIXTA_INDEPENDET	Rep Mixta	t	f
c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	MEDICAL_REP_SENIOR_E_X	Rep VM (E+X)	t	f
a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	DISTRICT_MANAGER	GD (District Manager)	t	f
bf39379b-11ca-482e-9297-c26d1e0dd84d	COMMERCIAL_JUNIOR_SPECIALIST	Commercial Junior Specialist	f	f
\.


--
-- Data for Name: team_component_target; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_component_target (team_component_target_id, employee_id, component_id, period_id, quota_value, created_at) FROM stdin;
d1615d18-e825-47c5-b11b-15da10d64805	7bcd7425-b4d4-427a-b63c-464e239749e9	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	527.04	2026-07-31 20:49:08.244
09892584-816c-413e-ac6b-d6c3b0177618	94abc717-7066-43d5-a09a-a1e678e322ea	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	2409.48	2026-07-31 20:49:08.244
d8596004-c071-4d2a-bdc3-8bbeee94762b	4af5de73-9cd3-4076-b9ba-916790d2c20d	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	2181.60	2026-07-31 20:49:08.244
03975d6a-e343-477a-b0d7-155110ce2b52	3ab409a6-021a-411f-a0a0-be1bb88d0faa	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	2918.16	2026-07-31 20:49:08.244
2e57a80a-e3e4-4844-9b44-52462e3983de	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	1074.60	2026-07-31 20:49:08.244
890d166d-9cfd-40ca-8c53-aedcdc6ef548	08567c88-1fbd-4ce4-b43d-9d431dff232f	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	1419.12	2026-07-31 20:49:08.244
7bf215d1-666f-430c-8616-5894adf32f24	7bcd7425-b4d4-427a-b63c-464e239749e9	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	226.80	2026-07-31 20:49:08.244
db70afff-774d-40ab-950c-1a41b2f3633b	94abc717-7066-43d5-a09a-a1e678e322ea	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	359.64	2026-07-31 20:49:08.244
32fb87b5-f36e-44bb-a3b1-4cb1ebaff610	4af5de73-9cd3-4076-b9ba-916790d2c20d	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	344.52	2026-07-31 20:49:08.244
824e6ac1-ddfe-4945-a567-bf1240ac5a3e	3ab409a6-021a-411f-a0a0-be1bb88d0faa	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	636.12	2026-07-31 20:49:08.244
e73fe813-b32c-4a53-ad44-50b09dfb95b1	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	516.24	2026-07-31 20:49:08.244
74ca03fe-f56b-490b-995f-0c2bf1396791	08567c88-1fbd-4ce4-b43d-9d431dff232f	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	518.40	2026-07-31 20:49:08.244
33712f05-9bc4-40b4-a964-f3f143289520	7bcd7425-b4d4-427a-b63c-464e239749e9	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	16400000.00	2026-07-31 20:49:08.244
db9c6a39-6be8-4ab3-96f4-f1dde998c70b	94abc717-7066-43d5-a09a-a1e678e322ea	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	15000000.00	2026-07-31 20:49:08.244
a412e581-1241-432b-8601-1e61ed6fab91	4af5de73-9cd3-4076-b9ba-916790d2c20d	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	31900000.00	2026-07-31 20:49:08.244
82356f3c-313d-4566-a80d-4addd62f6739	3ab409a6-021a-411f-a0a0-be1bb88d0faa	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	24100000.00	2026-07-31 20:49:08.244
4079dd23-2345-489c-badc-78a4d3344365	5b7120d6-fb93-44f9-a7a0-98e1f3c67edf	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	25000000.00	2026-07-31 20:49:08.244
767816d2-a158-4d64-9fe9-227c69ad9f4a	08567c88-1fbd-4ce4-b43d-9d431dff232f	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	18200000.00	2026-07-31 20:49:08.244
ade2cea0-6f1e-400a-804c-0accbe7055f6	fdc627f6-ba48-4173-89e8-2f2ac83294c3	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	542.16	2026-07-31 20:49:08.244
210c9f6a-7995-4f3c-a812-0ab7f36401ec	85869d04-2b09-4267-b058-3279c75eaed2	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	892.08	2026-07-31 20:49:08.244
43258817-737e-4cc3-9192-3d125860158d	908469d1-1beb-4e2b-ba49-a09e4e290672	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	792.72	2026-07-31 20:49:08.244
575d9039-3fad-47c1-bc6b-fac65faa2514	cbecff4e-5b38-4ab5-8297-8fd9479a668f	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	1284.12	2026-07-31 20:49:08.244
589644c7-a2b5-49f5-91ff-d402faf6d5f6	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	887.76	2026-07-31 20:49:08.244
4af6f811-62a7-4817-be95-2f1fa7525eed	b31cf00e-36aa-4307-8e7e-893bb1261218	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	1087.56	2026-07-31 20:49:08.244
4ab9e40e-f977-4ed7-b0a8-c8f75a6ff21c	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	642.60	2026-07-31 20:49:08.244
fcaf2247-8843-4be5-80bd-4a18b5163743	06b2473b-4e72-417c-879d-ae9104996738	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	754.92	2026-07-31 20:49:08.244
2f156393-8b2e-4fbe-bb70-6cc7bbb078de	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	1142.64	2026-07-31 20:49:08.244
9a6cca08-81d6-4372-af52-c67729e00278	fdc627f6-ba48-4173-89e8-2f2ac83294c3	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	200.88	2026-07-31 20:49:08.244
85a7ae1b-d145-4b5b-83a0-a21f1b635e86	85869d04-2b09-4267-b058-3279c75eaed2	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	299.16	2026-07-31 20:49:08.244
0d331b5c-e9ff-4947-a773-bf9f4241726d	908469d1-1beb-4e2b-ba49-a09e4e290672	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	294.84	2026-07-31 20:49:08.244
c309af94-de0e-4837-a25f-a5c634906a73	cbecff4e-5b38-4ab5-8297-8fd9479a668f	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	257.04	2026-07-31 20:49:08.244
1f072c98-10bd-467c-81ea-14ed39e8c915	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	304.56	2026-07-31 20:49:08.244
083780a6-d136-47ce-b97f-f0e209a7ca61	b31cf00e-36aa-4307-8e7e-893bb1261218	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	333.72	2026-07-31 20:49:08.244
2c75099d-bd1d-4317-8e57-4d4313be1a74	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	274.32	2026-07-31 20:49:08.244
b9aeb928-dbe0-4c8a-ab91-1285b6f81e4f	06b2473b-4e72-417c-879d-ae9104996738	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	302.40	2026-07-31 20:49:08.244
de644978-fa72-4979-bd27-99227d773d06	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	290.52	2026-07-31 20:49:08.244
d0e4b47e-90b4-4f6a-86ef-368398a74f32	fdc627f6-ba48-4173-89e8-2f2ac83294c3	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	20800000.00	2026-07-31 20:49:08.244
94ccfe04-a4e9-45dc-a04a-819879830bc8	85869d04-2b09-4267-b058-3279c75eaed2	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	43000000.00	2026-07-31 20:49:08.244
ca8bdbb4-1ec9-4682-ad58-211554c70303	908469d1-1beb-4e2b-ba49-a09e4e290672	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	19800000.00	2026-07-31 20:49:08.244
ec611939-5d6f-4d3f-bdad-64125892d189	cbecff4e-5b38-4ab5-8297-8fd9479a668f	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	19500000.00	2026-07-31 20:49:08.244
4493a9e8-8124-480b-970e-a73781256844	530246e9-b30b-40cf-a7aa-1c8b3f2e0855	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	17900000.00	2026-07-31 20:49:08.244
8b97c85b-f40a-4866-bc52-dabdc24994ff	b31cf00e-36aa-4307-8e7e-893bb1261218	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	25400000.00	2026-07-31 20:49:08.244
6835dd97-1f1b-463a-aead-410d6818493d	e90d4f95-62f7-4dc2-b065-3774cf35d9a4	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	26100000.00	2026-07-31 20:49:08.244
975485b5-f95f-4ac3-93fe-f99f8cbc980a	06b2473b-4e72-417c-879d-ae9104996738	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	23600000.00	2026-07-31 20:49:08.244
4d2d2f9e-2fbc-40b6-a6ae-bf7b5e77ad93	c50096de-1c4f-4ef7-9dc1-396ef99cd8a4	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	19100000.00	2026-07-31 20:49:08.244
0890b515-0517-437a-bf62-60fc58b1da52	93164df6-4a7c-40cc-a047-b5a6ad42843c	5149a40e-419e-483e-969d-ef642d252c06	5e677d8f-5dec-45ba-ae26-c53c55965577	14433.12	2026-07-31 20:49:08.244
db9a734d-1c8a-45f2-a4c5-fdc74072e62a	4cadfad4-f521-4435-ab0e-76311c4b9928	5149a40e-419e-483e-969d-ef642d252c06	5e677d8f-5dec-45ba-ae26-c53c55965577	14433.12	2026-07-31 20:49:08.244
070d117c-ac3a-40d6-8d4d-23fad1d4c4a0	93164df6-4a7c-40cc-a047-b5a6ad42843c	15e16108-5021-44f2-b303-04d67f8fac86	5e677d8f-5dec-45ba-ae26-c53c55965577	3480.84	2026-07-31 20:49:08.244
5cb02826-1bb4-4231-a3d5-8b5409fb8099	4cadfad4-f521-4435-ab0e-76311c4b9928	15e16108-5021-44f2-b303-04d67f8fac86	5e677d8f-5dec-45ba-ae26-c53c55965577	3480.84	2026-07-31 20:49:08.244
f7320eb4-6f12-4bdd-9361-4075f857c8d3	93164df6-4a7c-40cc-a047-b5a6ad42843c	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	274300000.00	2026-07-31 20:49:08.244
f431ba33-00cd-45a2-b276-e3f381085351	4cadfad4-f521-4435-ab0e-76311c4b9928	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	274300000.00	2026-07-31 20:49:08.244
daf9ff40-651a-4bf4-8aa0-cc394f88d07a	4ad79f15-b0c4-4dad-89ae-5aa82767f698	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
8b44be7b-7f9f-4144-9bab-10af0bf881e9	b1d64090-41a3-466b-9a34-e03d5655a418	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
86fedeed-f8ac-47d6-b255-8205fb3304eb	4ad79f15-b0c4-4dad-89ae-5aa82767f698	ffe5d345-5285-43a3-9a8a-c0495b268812	5e677d8f-5dec-45ba-ae26-c53c55965577	699164348.00	2026-07-31 20:49:08.244
1817e8fa-aa47-4b10-9380-f5d63763ecba	b1d64090-41a3-466b-9a34-e03d5655a418	ffe5d345-5285-43a3-9a8a-c0495b268812	5e677d8f-5dec-45ba-ae26-c53c55965577	699164348.00	2026-07-31 20:49:08.244
4c8dfb02-7011-4369-a935-0161601728aa	88a2b56f-c9f6-49f5-8282-e2ac1237661d	1374279b-9ac2-4b1f-9759-e95bccc1e8c3	5e677d8f-5dec-45ba-ae26-c53c55965577	1036.00	2026-07-31 20:49:08.244
b0481c6e-d0f1-4cea-aef2-3efe9ad5a5d4	88a2b56f-c9f6-49f5-8282-e2ac1237661d	ca8a72cc-9d9b-4d42-9683-3372c828b2eb	5e677d8f-5dec-45ba-ae26-c53c55965577	1158.00	2026-07-31 20:49:08.244
66bc60ed-905a-4bfa-afd7-0fa83aa6f5ef	88a2b56f-c9f6-49f5-8282-e2ac1237661d	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	33600000.00	2026-07-31 20:49:08.244
17e733b9-1b9c-4064-b6a7-b7581539b37d	da4c35c9-7e96-480d-9449-3f62853938d4	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	5e677d8f-5dec-45ba-ae26-c53c55965577	3740879609.00	2026-07-31 20:49:08.244
a74f2a13-3c3f-4dd0-9d97-a6aae5455f08	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	5e677d8f-5dec-45ba-ae26-c53c55965577	3740879609.00	2026-07-31 20:49:08.244
72a2ca33-8d0f-4dea-9bb2-3e57126f6deb	da4c35c9-7e96-480d-9449-3f62853938d4	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
80a24993-07df-4d60-bfce-d5074dade669	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
ca226729-9139-4422-8f42-c938228c22f3	da4c35c9-7e96-480d-9449-3f62853938d4	d7251f14-67d2-4d92-b995-e674971e0f94	5e677d8f-5dec-45ba-ae26-c53c55965577	804933695.00	2026-07-31 20:49:08.244
4a34929a-6013-43b7-b3ab-4d4bed679344	54ac0d3e-5009-4a77-a39b-d1fb1b43e54c	d7251f14-67d2-4d92-b995-e674971e0f94	5e677d8f-5dec-45ba-ae26-c53c55965577	804933695.00	2026-07-31 20:49:08.244
6ee89238-df27-4f72-ac83-15794786230e	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	1947.50	2026-07-31 20:49:08.244
4008ca53-f71d-460c-90c4-4655737f6e83	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	726.96	2026-07-31 20:49:08.244
35756c58-58a2-4ebe-81d6-5c867a984426	9273403c-5dd2-4cbd-bef2-9adb1f80cddf	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	173.80	2026-07-31 20:49:08.244
10b6a81c-094a-409a-a7ea-43619602c5eb	298646e0-9b2f-4de1-8626-8274d5f997f1	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	5818.94	2026-07-31 20:49:08.244
83252d3e-2af9-452d-85ac-c09dc3b3fb66	298646e0-9b2f-4de1-8626-8274d5f997f1	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	2424.24	2026-07-31 20:49:08.244
e55d0ff6-22f4-4fa6-97e2-98f1f731c593	298646e0-9b2f-4de1-8626-8274d5f997f1	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	625.90	2026-07-31 20:49:08.244
566e7c99-74d0-491a-bde7-553027395d05	568bd957-caa9-47c9-882f-5abb3eb7b423	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	4238.90	2026-07-31 20:49:08.244
0ebeba6e-a7d4-47da-beee-d914169f44bd	568bd957-caa9-47c9-882f-5abb3eb7b423	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	1784.64	2026-07-31 20:49:08.244
57569891-91e2-47ee-b5f2-efdba3dd8a88	568bd957-caa9-47c9-882f-5abb3eb7b423	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	349.80	2026-07-31 20:49:08.244
948da4f9-6b92-4191-99e0-8ac5bb145b9b	d845bba5-0bad-40ff-83af-4be067bcf13b	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	5088.58	2026-07-31 20:49:08.244
b80d784c-38f7-4134-a7a9-271988b083d7	d845bba5-0bad-40ff-83af-4be067bcf13b	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	2170.48	2026-07-31 20:49:08.244
621e2715-1722-42f5-87fc-037e8097e4c3	d845bba5-0bad-40ff-83af-4be067bcf13b	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	430.10	2026-07-31 20:49:08.244
c1c9a956-f0c4-4f67-8376-e51316cc1560	278e2c63-012a-4727-ae52-66cc7adc4aba	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	4706.68	2026-07-31 20:49:08.244
633e60bf-4d8d-49b3-9a9e-af0c2a41da83	278e2c63-012a-4727-ae52-66cc7adc4aba	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	2192.32	2026-07-31 20:49:08.244
f1e79458-ff22-465b-b77f-06215705c512	278e2c63-012a-4727-ae52-66cc7adc4aba	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	397.10	2026-07-31 20:49:08.244
3cb9c2a9-ec35-4de5-9901-22b957671898	913808aa-f12d-4bd1-8009-79f44eb4dd01	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	2565.38	2026-07-31 20:49:08.244
070f6bb4-4ad1-455b-8d9d-ba828f8a353e	913808aa-f12d-4bd1-8009-79f44eb4dd01	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	1395.68	2026-07-31 20:49:08.244
72bc3dd6-bf63-4a0f-9a57-1985a286b3a4	913808aa-f12d-4bd1-8009-79f44eb4dd01	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	294.80	2026-07-31 20:49:08.244
c039c9c9-cff3-4f4e-884c-5dfae78e571c	925b97c8-722d-4767-8845-3553e5747fbc	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	2280.00	2026-07-31 20:49:08.244
d55e6416-f8ce-4b5c-a9d4-3952fb8c31ae	925b97c8-722d-4767-8845-3553e5747fbc	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	1155.44	2026-07-31 20:49:08.244
3eb81ea3-8877-44c0-b525-4710601ba9a2	925b97c8-722d-4767-8845-3553e5747fbc	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	380.60	2026-07-31 20:49:08.244
a7affbd5-19b2-498c-a8dd-338c3fccaec4	328b9de3-a19b-4be0-ac71-140f8fdc1060	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	2419.08	2026-07-31 20:49:08.244
022727a1-de5d-4023-8cfb-efcdfea8d811	328b9de3-a19b-4be0-ac71-140f8fdc1060	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	1572.48	2026-07-31 20:49:08.244
98591184-12d6-4e92-8699-3bcba54e963f	328b9de3-a19b-4be0-ac71-140f8fdc1060	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	280.50	2026-07-31 20:49:08.244
f73a2c3b-f598-47f2-aa01-2d41001fa28b	09786243-3caa-4d88-ad8c-2dcfbb0db897	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	3305.62	2026-07-31 20:49:08.244
be7a4d23-27ba-4f39-aa1c-6dc52638ab3d	09786243-3caa-4d88-ad8c-2dcfbb0db897	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	2463.76	2026-07-31 20:49:08.244
28a466a2-8e78-467b-956c-a76ea0d7a0a8	09786243-3caa-4d88-ad8c-2dcfbb0db897	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	242.00	2026-07-31 20:49:08.244
05f338b3-a98d-40aa-a016-07b1a43d9a19	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	3267.24	2026-07-31 20:49:08.244
d86eca82-05be-46b1-bb70-1b4d5710663d	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	1487.20	2026-07-31 20:49:08.244
ba835240-12ed-4180-bfaa-76ccb4351660	6947f967-a59a-4cdd-b8f4-dcbb8c15272b	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	231.00	2026-07-31 20:49:08.244
1350db35-fca9-4b26-b494-ce2c0d035e4f	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	4825.24	2026-07-31 20:49:08.244
d6d9d9ac-7edc-4f2c-bd20-7c7ad4d37277	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	0.00	2026-07-31 20:49:08.244
091b3cc0-cc5d-4803-8001-38fe7cac8e70	96bb5d75-fa93-46a1-949f-d50f2c01e4ab	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
501031e6-1c5f-4eff-853a-9c6d3f8ee299	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	4180.76	2026-07-31 20:49:08.244
d07ff5f6-af70-428a-be5c-0cce2393acfa	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	2933.84	2026-07-31 20:49:08.244
44280aed-bd5b-40b7-80b0-f0d72d56809c	1fe05e03-ec7e-4787-81d5-f0ddde83fd1a	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	630.30	2026-07-31 20:49:08.244
10109fbf-7e05-403c-9d9f-6f776435f961	dac88712-975d-473b-8c88-d44e7c579d23	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	4148.84	2026-07-31 20:49:08.244
ed668eeb-e09f-4517-b670-ac0bffa67540	dac88712-975d-473b-8c88-d44e7c579d23	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	3400.80	2026-07-31 20:49:08.244
7b407620-fecb-4768-9be9-27b34f832ea6	dac88712-975d-473b-8c88-d44e7c579d23	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	235.40	2026-07-31 20:49:08.244
95ef5fb8-4b05-40c0-beec-da496659efb9	d1186eb3-89fe-4586-b32c-162f332fa732	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	2852.66	2026-07-31 20:49:08.244
b3b7987a-d56f-4af0-9c71-827d774f3d5d	d1186eb3-89fe-4586-b32c-162f332fa732	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	2796.56	2026-07-31 20:49:08.244
9bde33df-3b47-485b-8297-3dfb7f5faf93	d1186eb3-89fe-4586-b32c-162f332fa732	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	524.70	2026-07-31 20:49:08.244
5151ad1d-39e1-48fc-8cb6-7b3faeecb314	4026bca6-7f2f-4e9f-adc1-2027d608a689	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	3299.16	2026-07-31 20:49:08.244
6300d2a1-229a-4029-98a5-9742317b9f7a	4026bca6-7f2f-4e9f-adc1-2027d608a689	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	3343.60	2026-07-31 20:49:08.244
d848cd4b-6878-4f13-91ce-aa3359b640ab	4026bca6-7f2f-4e9f-adc1-2027d608a689	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	464.20	2026-07-31 20:49:08.244
f0372153-5023-49b8-b3c6-582401425c8c	b644dfc7-5553-4889-8920-daa15b355715	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	3088.26	2026-07-31 20:49:08.244
becb3d9a-9455-4908-a8fb-231284778b91	b644dfc7-5553-4889-8920-daa15b355715	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	0.00	2026-07-31 20:49:08.244
46e26866-08a9-48d0-9191-fdb5007b4ab8	b644dfc7-5553-4889-8920-daa15b355715	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
3ae9d148-129e-4a7d-88cc-aa59ee787d8d	8c774552-83f9-44bd-8a3b-a3730dad0e22	3200ec4e-b119-489a-bfe4-5bf30beb9c49	5e677d8f-5dec-45ba-ae26-c53c55965577	21548.02	2026-07-31 20:49:08.244
d79ea69f-6d48-4da6-81ba-9ca27b6bc337	8c774552-83f9-44bd-8a3b-a3730dad0e22	4407a61f-f92c-4c45-aebb-3da2735a8f01	5e677d8f-5dec-45ba-ae26-c53c55965577	13977.04	2026-07-31 20:49:08.244
d843ad0a-c029-4e14-abc2-4e1b400e795e	8c774552-83f9-44bd-8a3b-a3730dad0e22	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
b78f8365-0129-45e9-af7f-756534fa06d2	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	3200ec4e-b119-489a-bfe4-5bf30beb9c49	5e677d8f-5dec-45ba-ae26-c53c55965577	37520.82	2026-07-31 20:49:08.244
9606e0b2-9c73-4e17-8c9b-541d94068f5c	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	4407a61f-f92c-4c45-aebb-3da2735a8f01	5e677d8f-5dec-45ba-ae26-c53c55965577	17028.96	2026-07-31 20:49:08.244
3a524fce-c050-4e0a-ab0a-fb6fefdb6d54	20e83a8f-c7b1-43cc-a2e4-6db3dbdf8781	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
93011732-6620-41fc-9733-1bc89602901f	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	5e677d8f-5dec-45ba-ae26-c53c55965577	3740879609.00	2026-07-31 20:49:08.244
c1c0bec5-e4e1-4db3-8709-410dad7de598	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
4ec0de32-3081-4c79-a755-9295a0e886a4	c8f2d92c-7662-4b2e-9a08-8c453fb5853d	d7251f14-67d2-4d92-b995-e674971e0f94	5e677d8f-5dec-45ba-ae26-c53c55965577	804933695.00	2026-07-31 20:49:08.244
bdcd523d-4dc5-4680-ac95-2cd581a7f21f	96ec8d2e-4828-4c91-916d-f995d755d146	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	5e677d8f-5dec-45ba-ae26-c53c55965577	3740879609.00	2026-07-31 20:49:08.244
4b856b40-4704-4ca0-9baa-44e1b5194855	96ec8d2e-4828-4c91-916d-f995d755d146	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
15c37169-8ad5-4dde-81e7-d9be69f53742	96ec8d2e-4828-4c91-916d-f995d755d146	d7251f14-67d2-4d92-b995-e674971e0f94	5e677d8f-5dec-45ba-ae26-c53c55965577	804933695.00	2026-07-31 20:49:08.244
d0120a53-ee71-4e3a-b3d0-23236393ea6e	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	855.36	2026-07-31 20:49:08.244
c0d5fe6b-d2a9-4cb4-98aa-a146c533c7b0	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	266.76	2026-07-31 20:49:08.244
72ca173e-c5cf-4a33-b5b5-5fa1732d4634	d3c0dd5a-ea65-4b3e-86ee-f6cc13d41a08	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	31800000.00	2026-07-31 20:49:08.244
83274cc5-1547-4201-956e-1a61213be3f8	4d388595-f713-4573-ad2d-852612de70d2	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	2128.68	2026-07-31 20:49:08.244
d5436f5a-1a2d-4b92-8a1c-b983ed6fbfc6	4d388595-f713-4573-ad2d-852612de70d2	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	705.24	2026-07-31 20:49:08.244
6bfffcab-eddf-4006-8c8e-34ceb40fd318	4d388595-f713-4573-ad2d-852612de70d2	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	15000000.00	2026-07-31 20:49:08.244
bb211040-a592-4c1c-8109-f2e66c4ea03f	7991b028-888d-404d-abae-ecf4f479483c	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	5e677d8f-5dec-45ba-ae26-c53c55965577	2279515481.00	2026-07-31 20:49:08.244
413d235d-019d-4918-971b-48972e471703	7991b028-888d-404d-abae-ecf4f479483c	ffe5d345-5285-43a3-9a8a-c0495b268812	5e677d8f-5dec-45ba-ae26-c53c55965577	699164348.00	2026-07-31 20:49:08.244
\.


--
-- Data for Name: team_component_weight; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.team_component_weight (team_component_weight_id, team_id, component_id, period_id, weight_percent, valid_from, valid_to) FROM stdin;
218e8983-549c-4bf9-8667-2968c7835706	40c03523-202d-4eb3-8c06-011afd8a691c	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	0.300000	\N	\N
ddbcf143-e70d-46e2-a241-81a298b6396b	40c03523-202d-4eb3-8c06-011afd8a691c	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	0.300000	\N	\N
05e6021a-7bd4-4218-8251-c5816db8c22d	40c03523-202d-4eb3-8c06-011afd8a691c	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	0.400000	\N	\N
84c140d2-e9f2-46d3-a5fa-71ea02fe78d3	c4f8fcad-660e-4aee-a188-a7da46ba040f	43b23016-5ea6-4d23-91c7-14290a050e32	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
8afda6a3-458e-40b8-b99e-c48c6201dec9	c4f8fcad-660e-4aee-a188-a7da46ba040f	951c8c3d-ceb8-4eca-b291-7005443411af	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
0920d309-8185-489b-b252-c2b43ae0d9da	c4f8fcad-660e-4aee-a188-a7da46ba040f	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	0.600000	\N	\N
e4ea4f81-61c9-48cf-9d48-fa6dfe35966b	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	5149a40e-419e-483e-969d-ef642d252c06	5e677d8f-5dec-45ba-ae26-c53c55965577	0.400000	\N	\N
e22bd6cb-6907-466e-b4e6-8ed14cd568a6	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	15e16108-5021-44f2-b303-04d67f8fac86	5e677d8f-5dec-45ba-ae26-c53c55965577	0.300000	\N	\N
05899371-1c1c-42f6-b5ab-b8619aec695d	9e992b2a-f38b-47f2-9bac-a32294a5bc8b	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	0.300000	\N	\N
8a8268e8-d854-47c5-8b06-345a7e9db6f9	bff6a01e-9128-487d-9f49-a2929ee5bf3c	da1956b8-f186-4d2e-86b4-50cd3f5b54c9	5e677d8f-5dec-45ba-ae26-c53c55965577	0.800000	\N	\N
a4ba5e08-1eb0-4516-b13a-3dd885f47cd4	bff6a01e-9128-487d-9f49-a2929ee5bf3c	ffe5d345-5285-43a3-9a8a-c0495b268812	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
70531e79-04e8-453f-8840-88955312c7b5	514e007a-79c7-4e83-be17-6cf95e82cb41	1374279b-9ac2-4b1f-9759-e95bccc1e8c3	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
d1a6299e-1d53-4fdd-8377-8fe2fe7cb531	514e007a-79c7-4e83-be17-6cf95e82cb41	ca8a72cc-9d9b-4d42-9683-3372c828b2eb	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
0db01c94-da93-48fb-814a-91855086633b	514e007a-79c7-4e83-be17-6cf95e82cb41	23a6e464-1d48-48cd-9e60-1b92067460e5	5e677d8f-5dec-45ba-ae26-c53c55965577	0.600000	\N	\N
ce4720f9-549e-4abd-926e-8533b3f9d1eb	205282ef-3374-4d6d-891d-f51a67e2a1f5	883b6a4f-c67b-4b3b-a0db-fbac992a64aa	5e677d8f-5dec-45ba-ae26-c53c55965577	0.400000	\N	\N
fd744860-b6b7-447f-9f2b-42b77d348fb1	205282ef-3374-4d6d-891d-f51a67e2a1f5	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	0.400000	\N	\N
cf21243e-b13c-47a1-9850-e92fa5780865	205282ef-3374-4d6d-891d-f51a67e2a1f5	d7251f14-67d2-4d92-b995-e674971e0f94	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
8984083f-aa80-4ab7-8669-639f687cec06	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	c4b3341e-c5d5-40c8-a690-685b0ed9ae20	5e677d8f-5dec-45ba-ae26-c53c55965577	0.500000	\N	\N
bd3b9afb-06dc-424b-af14-ef1b081aa4cd	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	72c6c853-5c4f-4af0-85ab-7ab236ea6d54	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
9a6ed893-29e0-414f-b792-37d4fd204068	c2f1bbfc-ce44-4cba-abfd-6d297b6731ca	326bd585-cf49-4882-9d69-6851958e1424	5e677d8f-5dec-45ba-ae26-c53c55965577	0.300000	\N	\N
29e3693b-7309-4fb1-b5f0-615aefae2e85	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	3200ec4e-b119-489a-bfe4-5bf30beb9c49	5e677d8f-5dec-45ba-ae26-c53c55965577	0.500000	\N	\N
aec4dd75-69b9-4eed-94ac-a21ff9fd7fb0	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	4407a61f-f92c-4c45-aebb-3da2735a8f01	5e677d8f-5dec-45ba-ae26-c53c55965577	0.300000	\N	\N
d8f38866-d8e0-4ca6-bdc1-d5b2c2314d63	a5c0e452-3b83-4cf7-a456-b918e3dc3eeb	e529c58e-2de2-44ee-b791-a328f8582f27	5e677d8f-5dec-45ba-ae26-c53c55965577	0.200000	\N	\N
\.


--
-- Data for Name: user_role; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_role (user_role_id, user_id, role_id) FROM stdin;
d837e0ba-c1d3-441d-88d5-f09b0e7e90ca	79a29d51-e5a3-4482-97ad-ef541ea762a4	315ad4fb-f109-44e5-8cdc-16d4eb240a69
a7b2adfa-335b-4afc-b94f-db2a08fea303	93292b94-e9e2-416b-aaeb-9379e1847294	b1dc3461-d01f-482d-91ff-1ead787063b6
0889046d-e7e3-4ae8-a6ff-083cd9dc65e2	85e3679d-6164-4389-ba53-6f1ec1f26002	b1dc3461-d01f-482d-91ff-1ead787063b6
dfcc854d-39cf-472f-baae-cb26a0a7d8dc	70154c5c-44a2-44a4-8fc1-a761af2a9be7	b1dc3461-d01f-482d-91ff-1ead787063b6
46546e23-2bf7-420a-ab9e-d5aea4e06e07	d81a8300-3660-4730-b24b-a693c07b3898	b1dc3461-d01f-482d-91ff-1ead787063b6
ea429876-ae34-4980-be40-ab79b70184a3	f837f521-16ea-4a47-96a3-a5aa3d36343c	b1dc3461-d01f-482d-91ff-1ead787063b6
2486fd66-9ff2-4105-b57e-6865f520904b	4bc1ac85-d568-404a-a8d9-02a199fc33f1	b1dc3461-d01f-482d-91ff-1ead787063b6
eff8e176-6a6b-4441-ac82-0b593e7de5cd	28d09722-4f9a-469b-a549-1c72ed0ea2a6	b1dc3461-d01f-482d-91ff-1ead787063b6
255855f8-15eb-4b8c-b93d-f43f2c502dd9	8c6cee46-b97d-47f0-943d-2e3698610888	b1dc3461-d01f-482d-91ff-1ead787063b6
f6d0310f-9ce2-472f-b60e-c0b413f81d27	8419806e-65a8-4f92-ab5a-28ecbfa8a689	b1dc3461-d01f-482d-91ff-1ead787063b6
94b1bc8a-91cf-4369-a440-41395741d41b	3714e58e-e684-4887-94c8-f565f2478708	b1dc3461-d01f-482d-91ff-1ead787063b6
a46bc703-ccd5-42de-a0ff-7ff1f061b61c	c482d065-ddd9-4717-b32f-db51feaf7499	b1dc3461-d01f-482d-91ff-1ead787063b6
5823a6c6-6713-4519-a682-9dda3a764584	d7bb844b-6064-4d0e-b57b-f0d6807fe77d	b1dc3461-d01f-482d-91ff-1ead787063b6
29758c93-e275-48eb-b0af-daf9a8b23f72	8c3f9427-a772-46f3-9b2b-baf34d30e56d	b1dc3461-d01f-482d-91ff-1ead787063b6
c4408636-9678-4c2a-9f5b-d4357b280bf2	e5b6fc32-6015-439a-933c-3d17fc25048d	b1dc3461-d01f-482d-91ff-1ead787063b6
d69568cf-5bdd-425c-bfe3-bf6a2fadfd02	b5108bb6-d4a6-4c04-9d6a-f09fe98d06b5	b1dc3461-d01f-482d-91ff-1ead787063b6
c81dac4f-2cc8-4390-a89b-014d9c15495a	191b05ec-0269-4344-b1cc-fd1b9ef75848	b1dc3461-d01f-482d-91ff-1ead787063b6
d87d31a4-c186-440f-8cb8-4814bffba0ed	f9bee2c9-cb42-4ca3-bf5b-8d9ecec46ea7	b1dc3461-d01f-482d-91ff-1ead787063b6
661e6f04-4cb1-4539-86af-97cc21332231	b9da30b7-0ccd-423d-b1f5-5e2f0bc731e2	b1dc3461-d01f-482d-91ff-1ead787063b6
298671f9-57e3-411f-93a3-1bd15e7ce8d0	d8640901-4335-4b00-9dae-37a5031173d8	b1dc3461-d01f-482d-91ff-1ead787063b6
e4b1bd93-d71f-4740-b729-6df9d260855f	16ba34dd-ad8f-4e1b-8563-90b20e92b721	b1dc3461-d01f-482d-91ff-1ead787063b6
5a03159a-f6c5-4aa9-a9aa-866f4419cd26	065963c7-b190-4b67-8ca3-a8a4c4475207	b1dc3461-d01f-482d-91ff-1ead787063b6
56c6189c-423a-4738-b92b-74b976bd9e09	ae2fc1af-1e98-443a-9418-e705033740c2	b1dc3461-d01f-482d-91ff-1ead787063b6
2ab654cd-867f-405c-b415-73f71b6b364d	8248a4cc-2ac9-421b-bbcd-4c202b968e27	b1dc3461-d01f-482d-91ff-1ead787063b6
66cfbd5f-5a72-47e6-a7b8-160f96c3cfab	43c88d62-2a20-4354-a424-b1b6fec7ef17	b1dc3461-d01f-482d-91ff-1ead787063b6
845c1cb1-7cdd-45d5-875d-243aeaa2698f	cb28b9a6-a3fd-4852-b992-d59dd51f8eb6	2c8c8be8-7e37-401b-801c-8a43c63d35cb
898843cd-8142-4def-ac31-108ddfee6e8d	3b204116-82be-44d6-869c-0143650d0c77	b1dc3461-d01f-482d-91ff-1ead787063b6
87dc1f32-6188-49d7-969b-39106359670d	e83f7be4-f6a0-4d65-bfbb-cbcbbcee45c1	b1dc3461-d01f-482d-91ff-1ead787063b6
624e302a-9c71-4971-ba9b-9463afdd09bb	1ca46d70-af3a-46b2-b8ee-5deda261083b	b1dc3461-d01f-482d-91ff-1ead787063b6
486b3edf-9641-40b2-a756-38931dcdcc4d	19e6bb58-3d52-4bf1-8d53-c1e94dd757aa	b1dc3461-d01f-482d-91ff-1ead787063b6
8dd00ca6-65d3-44a5-a4ab-9e0991f0c8a4	6437d73f-c56c-4cc4-a077-ed992f565971	b1dc3461-d01f-482d-91ff-1ead787063b6
72d1778d-b551-45a3-856f-199cf16d1cf2	510ad4ea-cb96-4dae-92bc-0397cae696f6	b1dc3461-d01f-482d-91ff-1ead787063b6
f8f6b5be-71b4-42f3-91e8-f1555e9e9d55	47499212-67d4-4794-9274-cde0d28f393d	b1dc3461-d01f-482d-91ff-1ead787063b6
3348e0fa-f4db-4d89-8581-20d8ebbda1c3	58096d32-8128-4262-b393-6557d089cbea	b1dc3461-d01f-482d-91ff-1ead787063b6
7ddc8884-e316-4457-a08c-1bda0d9e806b	2403fd8d-9266-4c5c-b646-ce82ed76dd7a	b1dc3461-d01f-482d-91ff-1ead787063b6
90cc693d-a6d0-4e75-bdb9-43d58d522db2	9d379748-e46f-4b7d-926a-20ab70d985f6	b1dc3461-d01f-482d-91ff-1ead787063b6
7c51c276-22ab-49ca-93b9-a9a36a303b25	4fa016ca-fd9d-4254-9c4a-4e4444982fcd	b1dc3461-d01f-482d-91ff-1ead787063b6
7d9fdb51-d439-4487-8d66-f2bef5aa4d7d	3ea05464-afad-4fdc-a3a5-5448c295dd38	b1dc3461-d01f-482d-91ff-1ead787063b6
d256dbe3-de41-4228-aadc-a952ba42e2bf	d3e0c502-6495-40bf-85df-b9de1d419507	b1dc3461-d01f-482d-91ff-1ead787063b6
d92502ee-14d7-4f12-a852-5b137856d510	dea72c26-f473-49f9-add0-6fb074004160	2c8c8be8-7e37-401b-801c-8a43c63d35cb
a4fce7a7-af5e-4b0c-93cf-e51bd91e0887	c66e9f78-cb30-474e-82ff-4a445ca48d55	b1dc3461-d01f-482d-91ff-1ead787063b6
b5c90b67-fa35-4f81-9f2f-7a0673317ac3	3de98f38-53c2-4cbc-87a0-cf4d30226b7a	b1dc3461-d01f-482d-91ff-1ead787063b6
777e8c43-c4da-43c3-b318-1388c511634e	62a009de-75bb-4900-b990-9944ae743190	b1dc3461-d01f-482d-91ff-1ead787063b6
36c81c25-e39d-48ef-b8d2-628cbc180d63	61249960-9a40-4bcc-bff8-226b5dfae65a	b1dc3461-d01f-482d-91ff-1ead787063b6
1817edd2-a35a-4500-9ba8-fc30c0575fbc	a52d342d-7354-4d21-8cfd-85f7012459a4	b1dc3461-d01f-482d-91ff-1ead787063b6
3ccfdd36-224c-47dc-89c7-f2f9a72d6f3c	93750857-296b-40c1-adc1-a31532674b46	b1dc3461-d01f-482d-91ff-1ead787063b6
7ab6962a-c144-486f-8480-7bafb34b5e90	88579549-5132-4ec8-853b-b8dbf337b422	b1dc3461-d01f-482d-91ff-1ead787063b6
9ef2f691-31a3-4ad9-b0f6-83022edcba25	86ad9cd1-6377-4282-86a6-67e49fc7172a	b1dc3461-d01f-482d-91ff-1ead787063b6
7b91b097-5fe1-447a-bc64-a8b75bfff3ce	1deb255f-97dd-4122-b5fb-0bdb18713f50	b1dc3461-d01f-482d-91ff-1ead787063b6
a3d81f92-f207-47a9-b198-41a4c381750d	655d49a3-f35b-44fa-9d65-6f4cf8d70960	b1dc3461-d01f-482d-91ff-1ead787063b6
e0d4f4f8-4b23-41bc-9496-4d4fb0ea920f	0aa4c096-cf97-499b-a9a4-b1d734e06ad0	b1dc3461-d01f-482d-91ff-1ead787063b6
e7b8ca38-db0b-4566-b8e9-232581b931e0	5feffdd6-d2af-4fd1-b8f7-f9df3a0f36dd	b1dc3461-d01f-482d-91ff-1ead787063b6
cdc8159c-cc25-4e64-b192-0497e55fb933	8a48962d-1db6-4eb1-82d7-7f6c754d23ac	b1dc3461-d01f-482d-91ff-1ead787063b6
\.


--
-- Data for Name: zone; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.zone (zone_id, zone_name, region_id, active) FROM stdin;
74b77bcb-7b56-480c-a59d-af4efc114524	Barranquilla	8a603ede-a45c-499e-adc8-96411966a525	t
15bb8d60-8371-47a4-98c3-b1400d635373	Montería	8a603ede-a45c-499e-adc8-96411966a525	t
176802d1-7242-46de-aa24-42d8fdfa57da	Bogotá	8a603ede-a45c-499e-adc8-96411966a525	t
458a2322-3b05-49a1-b581-6945c9edc811	Bucaramanga	8a603ede-a45c-499e-adc8-96411966a525	t
105dfef4-2a36-4e98-8900-c162d57f842a	Medellin	8a603ede-a45c-499e-adc8-96411966a525	t
19724f15-714d-4f6c-8332-2c31644dcb38	Pasto	8a603ede-a45c-499e-adc8-96411966a525	t
b83f34d8-09ab-4210-a266-14f016c68e57	Cali	8a603ede-a45c-499e-adc8-96411966a525	t
67a56147-7245-4827-87b1-3378ac64c4c0	Ibagué	8a603ede-a45c-499e-adc8-96411966a525	t
d5b7d6ed-616c-4d13-ba10-2cd4bbb4135b	Cartagena	8a603ede-a45c-499e-adc8-96411966a525	t
97c6cf2e-d3c9-4c0d-a38c-06e93df64b7e	Cucuta	8a603ede-a45c-499e-adc8-96411966a525	t
61a1a549-6618-48a6-8c08-19686a0e094a	Pereira	8a603ede-a45c-499e-adc8-96411966a525	t
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-07-21 19:37:25
20211116045059	2026-07-21 19:37:25
20211116050929	2026-07-21 19:37:25
20211116051442	2026-07-21 19:37:25
20211116212300	2026-07-21 19:37:25
20211116213355	2026-07-21 19:37:25
20211116213934	2026-07-21 19:37:25
20211116214523	2026-07-21 19:37:25
20211122062447	2026-07-21 19:37:25
20211124070109	2026-07-21 19:37:25
20211202204204	2026-07-21 19:37:25
20211202204605	2026-07-21 19:37:25
20211210212804	2026-07-21 19:37:25
20211228014915	2026-07-21 19:37:25
20220107221237	2026-07-21 19:37:25
20220228202821	2026-07-21 19:37:25
20220312004840	2026-07-21 19:37:25
20220603231003	2026-07-21 19:37:25
20220603232444	2026-07-21 19:37:25
20220615214548	2026-07-21 19:37:25
20220712093339	2026-07-21 19:37:26
20220908172859	2026-07-21 19:37:26
20220916233421	2026-07-21 19:37:26
20230119133233	2026-07-21 19:37:26
20230128025114	2026-07-21 19:37:26
20230128025212	2026-07-21 19:37:26
20230227211149	2026-07-21 19:37:26
20230228184745	2026-07-21 19:37:26
20230308225145	2026-07-21 19:37:26
20230328144023	2026-07-21 19:37:26
20231018144023	2026-07-21 19:37:26
20231204144023	2026-07-21 19:37:26
20231204144024	2026-07-21 19:37:26
20231204144025	2026-07-21 19:37:26
20240108234812	2026-07-21 19:37:26
20240109165339	2026-07-21 19:37:26
20240227174441	2026-07-21 19:37:26
20240311171622	2026-07-21 19:37:26
20240321100241	2026-07-21 19:37:26
20240401105812	2026-07-21 19:37:26
20240418121054	2026-07-21 19:37:26
20240523004032	2026-07-21 19:37:26
20240618124746	2026-07-21 19:37:26
20240801235015	2026-07-21 19:37:26
20240805133720	2026-07-21 19:37:26
20240827160934	2026-07-21 19:37:26
20240919163303	2026-07-21 19:37:26
20240919163305	2026-07-21 19:37:26
20241019105805	2026-07-21 19:37:26
20241030150047	2026-07-21 19:37:26
20241108114728	2026-07-21 19:37:27
20241121104152	2026-07-21 19:37:27
20241130184212	2026-07-21 19:37:27
20241220035512	2026-07-21 19:37:27
20241220123912	2026-07-21 19:37:27
20241224161212	2026-07-21 19:37:27
20250107150512	2026-07-21 19:37:27
20250110162412	2026-07-21 19:37:27
20250123174212	2026-07-21 19:37:27
20250128220012	2026-07-21 19:37:27
20250506224012	2026-07-21 19:37:27
20250523164012	2026-07-21 19:37:27
20250714121412	2026-07-21 19:37:27
20250905041441	2026-07-21 19:37:27
20251103001201	2026-07-21 19:37:27
20251120212548	2026-07-21 19:37:27
20251120215549	2026-07-21 19:37:27
20260218120000	2026-07-21 19:37:27
20260326120000	2026-07-21 19:37:27
20260514120000	2026-07-21 19:37:27
20260527120000	2026-07-21 19:37:27
20260528120000	2026-07-21 19:37:27
20260603120000	2026-07-21 19:37:27
20260605120000	2026-07-21 19:37:27
20260606110000	2026-07-21 19:37:27
20260616120000	2026-07-21 19:37:27
20260624120000	2026-07-21 19:37:27
20260626120000	2026-07-21 19:37:27
20260706120000	2026-07-21 19:37:27
20260707120000	2026-07-21 19:37:27
20260709120000	2026-07-21 19:37:27
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-07-21 19:37:47.32691
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-07-21 19:37:47.343312
2	storage-schema	f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd	2026-07-21 19:37:47.349861
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-07-21 19:37:47.370411
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-07-21 19:37:47.385975
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-07-21 19:37:47.392496
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-07-21 19:37:47.399866
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-07-21 19:37:47.407026
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-07-21 19:37:47.413938
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-07-21 19:37:47.421368
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-07-21 19:37:47.428299
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-07-21 19:37:47.434698
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-07-21 19:37:47.44182
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-07-21 19:37:47.448278
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-07-21 19:37:47.454927
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-07-21 19:37:47.480768
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-07-21 19:37:47.489139
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-07-21 19:37:47.495805
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-07-21 19:37:47.502048
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-07-21 19:37:47.509949
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-07-21 19:37:47.516332
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-07-21 19:37:47.525486
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-07-21 19:37:47.542531
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-07-21 19:37:47.556855
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-07-21 19:37:47.563971
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-07-21 19:37:47.570862
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-07-21 19:37:47.577242
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-07-21 19:37:47.584577
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-07-21 19:37:47.591788
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-07-21 19:37:47.599556
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-07-21 19:37:47.607858
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-07-21 19:37:47.613846
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-07-21 19:37:47.619867
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-07-21 19:37:47.626294
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-07-21 19:37:47.632512
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-07-21 19:37:47.638458
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-07-21 19:37:47.645805
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-07-21 19:37:47.652039
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-07-21 19:37:47.659473
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-07-21 19:37:47.670586
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-07-21 19:37:47.676185
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-07-21 19:37:47.682598
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-07-21 19:37:47.688438
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-07-21 19:37:47.695068
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-07-21 19:37:47.700855
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-07-21 19:37:47.707498
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-07-21 19:37:47.719533
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-07-21 19:37:47.725939
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-07-21 19:37:47.731787
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-07-21 19:37:47.749632
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-07-21 19:37:47.756584
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-07-21 19:37:48.47716
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-07-21 19:37:48.479558
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-07-21 19:37:48.493626
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-07-21 19:37:48.497512
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-07-21 19:37:48.499922
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-07-21 19:37:48.507032
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-07-21 19:37:48.514832
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-07-21 19:37:48.521086
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-07-21 19:37:48.527859
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-07-21 19:37:48.534883
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: absence_or_novelty absence_or_novelty_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_or_novelty
    ADD CONSTRAINT absence_or_novelty_pkey PRIMARY KEY (novelty_id);


--
-- Name: admin_audit_log admin_audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_audit_log
    ADD CONSTRAINT admin_audit_log_pkey PRIMARY KEY (audit_log_id);


--
-- Name: app_user app_user_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_pkey PRIMARY KEY (user_id);


--
-- Name: curve_pay curve_pay_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curve_pay
    ADD CONSTRAINT curve_pay_pkey PRIMARY KEY (curve_pay_id);


--
-- Name: employee_execution_kpi employee_execution_kpi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_execution_kpi
    ADD CONSTRAINT employee_execution_kpi_pkey PRIMARY KEY (employee_execution_kpi_id);


--
-- Name: employee_payment_condition employee_payment_condition_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payment_condition
    ADD CONSTRAINT employee_payment_condition_pkey PRIMARY KEY (employee_payment_condition_id);


--
-- Name: employee employee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_pkey PRIMARY KEY (employee_id);


--
-- Name: employee_team_assignment employee_team_assignment_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_team_assignment
    ADD CONSTRAINT employee_team_assignment_pkey PRIMARY KEY (employee_team_assignment_id);


--
-- Name: incentive_calculation_detail incentive_calculation_detail_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_detail
    ADD CONSTRAINT incentive_calculation_detail_pkey PRIMARY KEY (incentive_calculation_detail_id);


--
-- Name: incentive_calculation_header incentive_calculation_header_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_header
    ADD CONSTRAINT incentive_calculation_header_pkey PRIMARY KEY (incentive_calculation_header_id);


--
-- Name: org_hierarchy org_hierarchy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_hierarchy
    ADD CONSTRAINT org_hierarchy_pkey PRIMARY KEY (org_hierarchy_id);


--
-- Name: period period_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period
    ADD CONSTRAINT period_pkey PRIMARY KEY (period_id);


--
-- Name: person person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pkey PRIMARY KEY (person_id);


--
-- Name: position position_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."position"
    ADD CONSTRAINT position_pkey PRIMARY KEY (position_id);


--
-- Name: region region_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.region
    ADD CONSTRAINT region_pkey PRIMARY KEY (region_id);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (role_id);


--
-- Name: sales_component sales_component_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_component
    ADD CONSTRAINT sales_component_pkey PRIMARY KEY (component_id);


--
-- Name: sales_transaction sales_transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transaction
    ADD CONSTRAINT sales_transaction_pkey PRIMARY KEY (sales_transaction_id);


--
-- Name: sales_upload_batch sales_upload_batch_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_upload_batch
    ADD CONSTRAINT sales_upload_batch_pkey PRIMARY KEY (sales_upload_batch_id);


--
-- Name: team_component_target team_component_target_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_target
    ADD CONSTRAINT team_component_target_pkey PRIMARY KEY (team_component_target_id);


--
-- Name: team_component_weight team_component_weight_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_weight
    ADD CONSTRAINT team_component_weight_pkey PRIMARY KEY (team_component_weight_id);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (team_id);


--
-- Name: user_role user_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_pkey PRIMARY KEY (user_role_id);


--
-- Name: zone zone_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zone
    ADD CONSTRAINT zone_pkey PRIMARY KEY (zone_id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: absence_or_novelty_period_id_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX absence_or_novelty_period_id_employee_id_idx ON public.absence_or_novelty USING btree (period_id, employee_id);


--
-- Name: admin_audit_log_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_action_idx ON public.admin_audit_log USING btree (action);


--
-- Name: admin_audit_log_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_created_at_idx ON public.admin_audit_log USING btree (created_at);


--
-- Name: admin_audit_log_period_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX admin_audit_log_period_id_idx ON public.admin_audit_log USING btree (period_id);


--
-- Name: app_user_employee_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX app_user_employee_id_key ON public.app_user USING btree (employee_id);


--
-- Name: app_user_username_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX app_user_username_key ON public.app_user USING btree (username);


--
-- Name: curve_pay_period_id_min_compliance_percent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX curve_pay_period_id_min_compliance_percent_idx ON public.curve_pay USING btree (period_id, min_compliance_percent);


--
-- Name: employee_employee_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_employee_code_idx ON public.employee USING btree (employee_code);


--
-- Name: employee_employee_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_employee_code_key ON public.employee USING btree (employee_code);


--
-- Name: employee_execution_kpi_employee_id_period_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_execution_kpi_employee_id_period_id_key ON public.employee_execution_kpi USING btree (employee_id, period_id);


--
-- Name: employee_execution_kpi_period_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_execution_kpi_period_id_idx ON public.employee_execution_kpi USING btree (period_id);


--
-- Name: employee_payment_condition_period_id_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_payment_condition_period_id_employee_id_idx ON public.employee_payment_condition USING btree (period_id, employee_id);


--
-- Name: employee_person_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_person_id_key ON public.employee USING btree (person_id);


--
-- Name: employee_team_assignment_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_team_assignment_employee_id_idx ON public.employee_team_assignment USING btree (employee_id);


--
-- Name: employee_team_assignment_team_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_team_assignment_team_id_idx ON public.employee_team_assignment USING btree (team_id);


--
-- Name: employee_zone_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX employee_zone_id_idx ON public.employee USING btree (zone_id);


--
-- Name: incentive_calculation_detail_incentive_calculation_header_i_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX incentive_calculation_detail_incentive_calculation_header_i_idx ON public.incentive_calculation_detail USING btree (incentive_calculation_header_id);


--
-- Name: incentive_calculation_header_employee_id_period_id_calculat_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX incentive_calculation_header_employee_id_period_id_calculat_key ON public.incentive_calculation_header USING btree (employee_id, period_id, calculation_version);


--
-- Name: incentive_calculation_header_period_id_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX incentive_calculation_header_period_id_employee_id_idx ON public.incentive_calculation_header USING btree (period_id, employee_id);


--
-- Name: org_hierarchy_manager_employee_id_subordinate_employee_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX org_hierarchy_manager_employee_id_subordinate_employee_id_idx ON public.org_hierarchy USING btree (manager_employee_id, subordinate_employee_id);


--
-- Name: period_parent_period_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX period_parent_period_id_idx ON public.period USING btree (parent_period_id);


--
-- Name: period_period_year_period_month_period_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX period_period_year_period_month_period_type_key ON public.period USING btree (period_year, period_month, period_type);


--
-- Name: person_document_number_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX person_document_number_idx ON public.person USING btree (document_number);


--
-- Name: person_document_number_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX person_document_number_key ON public.person USING btree (document_number);


--
-- Name: role_role_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX role_role_name_key ON public.role USING btree (role_name);


--
-- Name: sales_component_component_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sales_component_component_code_key ON public.sales_component USING btree (component_code);


--
-- Name: sales_transaction_period_id_employee_id_component_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_transaction_period_id_employee_id_component_id_idx ON public.sales_transaction USING btree (period_id, employee_id, component_id);


--
-- Name: sales_upload_batch_file_hash_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_upload_batch_file_hash_idx ON public.sales_upload_batch USING btree (file_hash);


--
-- Name: sales_upload_batch_period_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sales_upload_batch_period_id_idx ON public.sales_upload_batch USING btree (period_id);


--
-- Name: team_component_target_employee_id_component_id_period_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_component_target_employee_id_component_id_period_id_key ON public.team_component_target USING btree (employee_id, component_id, period_id);


--
-- Name: team_component_target_period_id_employee_id_component_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX team_component_target_period_id_employee_id_component_id_idx ON public.team_component_target USING btree (period_id, employee_id, component_id);


--
-- Name: team_component_weight_team_id_component_id_period_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_component_weight_team_id_component_id_period_id_key ON public.team_component_weight USING btree (team_id, component_id, period_id);


--
-- Name: team_team_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX team_team_code_key ON public.team USING btree (team_code);


--
-- Name: user_role_user_id_role_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_role_user_id_role_id_key ON public.user_role USING btree (user_id, role_id);


--
-- Name: zone_region_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX zone_region_id_idx ON public.zone USING btree (region_id);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_action_filter_selec; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_selec ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: absence_or_novelty absence_or_novelty_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_or_novelty
    ADD CONSTRAINT absence_or_novelty_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: absence_or_novelty absence_or_novelty_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.absence_or_novelty
    ADD CONSTRAINT absence_or_novelty_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: app_user app_user_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.app_user
    ADD CONSTRAINT app_user_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: curve_pay curve_pay_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curve_pay
    ADD CONSTRAINT curve_pay_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.sales_component(component_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: curve_pay curve_pay_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.curve_pay
    ADD CONSTRAINT curve_pay_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_execution_kpi employee_execution_kpi_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_execution_kpi
    ADD CONSTRAINT employee_execution_kpi_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_execution_kpi employee_execution_kpi_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_execution_kpi
    ADD CONSTRAINT employee_execution_kpi_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_payment_condition employee_payment_condition_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payment_condition
    ADD CONSTRAINT employee_payment_condition_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_payment_condition employee_payment_condition_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_payment_condition
    ADD CONSTRAINT employee_payment_condition_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee employee_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(person_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee employee_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_position_id_fkey FOREIGN KEY (position_id) REFERENCES public."position"(position_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employee_team_assignment employee_team_assignment_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_team_assignment
    ADD CONSTRAINT employee_team_assignment_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee_team_assignment employee_team_assignment_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_team_assignment
    ADD CONSTRAINT employee_team_assignment_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employee employee_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee
    ADD CONSTRAINT employee_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zone(zone_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: incentive_calculation_detail incentive_calculation_detail_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_detail
    ADD CONSTRAINT incentive_calculation_detail_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.sales_component(component_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: incentive_calculation_detail incentive_calculation_detail_incentive_calculation_header__fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_detail
    ADD CONSTRAINT incentive_calculation_detail_incentive_calculation_header__fkey FOREIGN KEY (incentive_calculation_header_id) REFERENCES public.incentive_calculation_header(incentive_calculation_header_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: incentive_calculation_header incentive_calculation_header_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_header
    ADD CONSTRAINT incentive_calculation_header_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: incentive_calculation_header incentive_calculation_header_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_header
    ADD CONSTRAINT incentive_calculation_header_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: incentive_calculation_header incentive_calculation_header_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.incentive_calculation_header
    ADD CONSTRAINT incentive_calculation_header_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: org_hierarchy org_hierarchy_manager_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_hierarchy
    ADD CONSTRAINT org_hierarchy_manager_employee_id_fkey FOREIGN KEY (manager_employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: org_hierarchy org_hierarchy_subordinate_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.org_hierarchy
    ADD CONSTRAINT org_hierarchy_subordinate_employee_id_fkey FOREIGN KEY (subordinate_employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: period period_parent_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.period
    ADD CONSTRAINT period_parent_period_id_fkey FOREIGN KEY (parent_period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: sales_transaction sales_transaction_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transaction
    ADD CONSTRAINT sales_transaction_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.sales_component(component_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_transaction sales_transaction_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transaction
    ADD CONSTRAINT sales_transaction_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_transaction sales_transaction_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transaction
    ADD CONSTRAINT sales_transaction_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_transaction sales_transaction_sales_upload_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_transaction
    ADD CONSTRAINT sales_transaction_sales_upload_batch_id_fkey FOREIGN KEY (sales_upload_batch_id) REFERENCES public.sales_upload_batch(sales_upload_batch_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_upload_batch sales_upload_batch_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_upload_batch
    ADD CONSTRAINT sales_upload_batch_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: sales_upload_batch sales_upload_batch_uploaded_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_upload_batch
    ADD CONSTRAINT sales_upload_batch_uploaded_by_user_id_fkey FOREIGN KEY (uploaded_by_user_id) REFERENCES public.app_user(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_component_target team_component_target_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_target
    ADD CONSTRAINT team_component_target_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.sales_component(component_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_component_target team_component_target_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_target
    ADD CONSTRAINT team_component_target_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee(employee_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_component_target team_component_target_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_target
    ADD CONSTRAINT team_component_target_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_component_weight team_component_weight_component_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_weight
    ADD CONSTRAINT team_component_weight_component_id_fkey FOREIGN KEY (component_id) REFERENCES public.sales_component(component_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_component_weight team_component_weight_period_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_weight
    ADD CONSTRAINT team_component_weight_period_id_fkey FOREIGN KEY (period_id) REFERENCES public.period(period_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: team_component_weight team_component_weight_team_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.team_component_weight
    ADD CONSTRAINT team_component_weight_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.team(team_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_role user_role_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.role(role_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_role user_role_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_role
    ADD CONSTRAINT user_role_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_user(user_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: zone zone_region_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.zone
    ADD CONSTRAINT zone_region_id_fkey FOREIGN KEY (region_id) REFERENCES public.region(region_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict BEUlk7n6R0c7ahEydBWMN3cZQRW7aXR90zJJq9HTznBttayMlvZeDJqxkgmaFF0

