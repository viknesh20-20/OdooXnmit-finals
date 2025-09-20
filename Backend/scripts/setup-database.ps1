# Database setup script for Manufacturing ERP
# Run this script as Administrator

Write-Host "Setting up PostgreSQL database for Manufacturing ERP..." -ForegroundColor Green

# Check if PostgreSQL is running
$pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
if (-not $pgService -or $pgService.Status -ne "Running") {
    Write-Host "PostgreSQL service is not running. Please start PostgreSQL first." -ForegroundColor Red
    exit 1
}

# Set PostgreSQL connection parameters
$env:PGUSER = "postgres"
$env:PGPASSWORD = "admin"  # Default PostgreSQL password
$env:PGHOST = "localhost"
$env:PGPORT = "5432"

try {
    Write-Host "Creating database and user..." -ForegroundColor Yellow
    
    # Execute the initialization script
    psql -f "scripts/init-database.sql" -d postgres
    
    Write-Host "Database setup completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Database Configuration:" -ForegroundColor Cyan
    Write-Host "  Database: ERPDB" -ForegroundColor White
    Write-Host "  User: pearl" -ForegroundColor White
    Write-Host "  Password: 1968" -ForegroundColor White
    Write-Host "  Host: localhost" -ForegroundColor White
    Write-Host "  Port: 5432" -ForegroundColor White
    
} catch {
    Write-Host "Error setting up database: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual setup instructions:" -ForegroundColor Yellow
    Write-Host "1. Open PostgreSQL command line (psql)" -ForegroundColor White
    Write-Host "2. Connect as superuser: psql -U postgres" -ForegroundColor White
    Write-Host "3. Create database: CREATE DATABASE \"ERPDB\";" -ForegroundColor White
    Write-Host "4. Create user: CREATE USER pearl WITH PASSWORD '1968';" -ForegroundColor White
    Write-Host "5. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE \"ERPDB\" TO pearl;" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "You can now start the backend server with: npm run dev" -ForegroundColor Green