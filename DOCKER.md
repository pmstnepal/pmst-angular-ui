# PMST Docker Development Setup

## Quick Start (Development)

```bash
# Start all services with hot reload
docker compose -f docker-compose.dev.yml up

# Or use the batch file (Windows)
start-dev.bat
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:4200 | Angular with hot reload |
| Backend API | http://localhost:8080 | Java 21 Spring Boot |
| Database | localhost:5432 | PostgreSQL |

## Development Features

- **Hot Reload**: Frontend auto-rebuilds on code changes
- **Live Reload**: Backend restarts on Java changes (limited)
- **Volume Mounts**: Edit code on host, see changes in container
- **Persistent DB**: Database survives container restarts

## Commands

```bash
# Start development environment
docker compose -f docker-compose.dev.yml up --build

# Start in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop all
docker compose -f docker-compose.dev.yml down

# Reset database (WARNING: deletes all data)
docker compose -f docker-compose.dev.yml down -v
```

## Production Build

```bash
# Build production images
docker compose -f docker-compose.yml up --build -d
```

## Troubleshooting

**Port already in use:**
```bash
# Find and stop process using port 4200 or 8080
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

**Database connection issues:**
```bash
# Check database health
docker exec pmst-postgres-dev pg_isready -U pmst
```

**Clear everything and restart:**
```bash
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up --build
```
