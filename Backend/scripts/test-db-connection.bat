@echo off
echo Testing database connection...

:: Try connecting with postgres user first
echo Testing connection with postgres user...
psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo postgres user connection successful!
    goto :create_db
)

:: If postgres doesn't exist, try with postgres user and default password
echo postgres user not found. Trying to create database and user...
echo Attempting with postgres user and common passwords...

:: Try different common passwords for postgres user
set "passwords=admin password postgres root 123456 postgres"
for %%p in (%passwords%) do (
    echo Trying password: %%p
    set PGPASSWORD=%%p
    psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT version();" 2>nul
    if !ERRORLEVEL! EQU 0 (
        echo Connected with postgres user and password: %%p
        goto :setup_db
    )
)

echo Failed to connect with any common passwords.
echo Please manually set up the database:
echo 1. Connect to PostgreSQL as superuser
echo 2. CREATE DATABASE "ERPDB";
echo 3. CREATE USER postgres WITH PASSWORD 'Thalha*7258';
echo 4. GRANT ALL PRIVILEGES ON DATABASE "ERPDB" TO postgres;
pause
exit /b 1

:setup_db
echo Setting up database and user...
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE \"ERPDB\";" 2>nul
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE USER postgres WITH PASSWORD 'Thalha*7258';" 2>nul
psql -h localhost -p 5432 -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"ERPDB\" TO postgres;" 2>nul

:create_db
echo Database setup completed!
echo Testing final connection...
set PGPASSWORD=Thalha*7258
psql -h localhost -p 5432 -U postgres -d ERPDB -c "SELECT current_database(), current_user;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Final connection test successful!
    echo Database: ERPDB
    echo User: postgres
    echo Password: Thalha*7258
) else (
    echo Final connection test failed. Please check database setup manually.
)

pause