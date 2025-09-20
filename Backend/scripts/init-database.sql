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
      WHERE rolname = 'pearl') THEN

      CREATE ROLE pearl LOGIN PASSWORD '1968';
   END IF;
END
$do$;

-- Grant privileges to pearl user
GRANT ALL PRIVILEGES ON DATABASE "ERPDB" TO pearl;
GRANT ALL ON SCHEMA public TO pearl;
GRANT ALL ON ALL TABLES IN SCHEMA public TO pearl;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO pearl;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO pearl;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO pearl;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO pearl;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO pearl;

\echo 'Database ERPDB and user pearl configured successfully!'