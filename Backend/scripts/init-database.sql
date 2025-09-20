-- Database initialization script for Manufacturing ERP
-- Run this script as PostgreSQL superuser (postgres)

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE "ERPDB"'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'ERPDB')\gexec

-- Create user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'postgres') THEN

      CREATE ROLE postgres LOGIN PASSWORD 'Thalha*7258';
   END IF;
END
$do$;

-- Grant privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE "ERPDB" TO postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;

\echo 'Database ERPDB and user postgres configured successfully!'