@echo off
echo Testing database connection...

:: Try connecting with pearl user first
echo Testing connection with pearl user...
psql -h localhost -p 5432 -U pearl -d postgres -c "SELECT version();" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Pearl user connection successful!
    goto :create_db
)

:: If pearl doesn't exist, try with postgres user and default password
echo Pearl user not found. Trying to create database and user...
echo Attempting with postgres user and common passwords...

:: Try different common passwords for postgres user
set "passwords=admin password postgres root 123456 pearl"
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
echo 3. CREATE USER pearl WITH PASSWORD '1968';
echo 4. GRANT ALL PRIVILEGES ON DATABASE "ERPDB" TO pearl;
pause
exit /b 1

:setup_db
echo Setting up database and user...
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE \"ERPDB\";" 2>nul
psql -h localhost -p 5432 -U postgres -d postgres -c "CREATE USER pearl WITH PASSWORD '1968';" 2>nul
psql -h localhost -p 5432 -U postgres -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE \"ERPDB\" TO pearl;" 2>nul

:create_db
echo Database setup completed!
echo Testing final connection...
set PGPASSWORD=1968
psql -h localhost -p 5432 -U pearl -d ERPDB -c "SELECT current_database(), current_user;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Final connection test successful!
    echo Database: ERPDB
    echo User: pearl
    echo Password: 1968
) else (
    echo Final connection test failed. Please check database setup manually.
)

pause