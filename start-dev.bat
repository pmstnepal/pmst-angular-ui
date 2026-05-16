@echo off
echo Starting PMST Development Environment...
echo.
echo Services:
echo   - Frontend: http://localhost:4200 (Angular with hot reload)
echo   - Backend:  http://localhost:8080 (Java Spring Boot)
echo   - Database: localhost:5432 (PostgreSQL)
echo.
echo Press Ctrl+C to stop all services
echo.
docker compose -f docker-compose.dev.yml up --build
