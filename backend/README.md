# PetCare & E-Commerce REST API

A comprehensive REST API backend for pet care management and e-commerce functionality built with FastAPI, PostgreSQL, and Stripe.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Pet Management**: CRUD operations for managing pets with ownership enforcement
- **Booking System**: Schedule pet care services (grooming, boarding, bathing) with FSM-based status management
- **Care Logs**: Track pet activities with optional image uploads
- **E-Commerce**: Product catalog and order management with stock tracking
- **Stripe Integration**: Secure payment processing with webhook support
- **S3 Storage**: AWS S3 integration for file uploads with presigned URLs
- **Admin Reporting**: Revenue and booking analytics for administrators
- **Comprehensive Logging**: Structured JSON logging for all requests and events

## Tech Stack

- **Framework**: FastAPI 0.104+
- **Database**: PostgreSQL with SQLAlchemy 2.0 async ORM
- **Authentication**: JWT with python-jose
- **Password Hashing**: bcrypt via passlib
- **File Storage**: AWS S3 with boto3
- **Payments**: Stripe API integration
- **Database Migrations**: Alembic
- **Testing**: pytest + pytest-asyncio
- **Containerization**: Docker & Docker Compose

## Project Structure

```
src/
  main.py                  # App factory with lifespan management
  config.py                # Environment configuration
  api/                     # API routes
    auth.py               # Authentication endpoints
    pets.py               # Pet management endpoints
    bookings.py           # Booking management endpoints
    care_logs.py          # Care log endpoints
    storage.py            # S3 storage endpoints
    products.py           # Product catalog endpoints
    orders.py             # Order management endpoints
    payments.py           # Stripe webhook handler
    reports.py            # Admin reporting endpoints
    deps.py               # Dependency injection (auth, db)
  domain/                 # Business logic services
    auth_service.py       # Authentication service
    pet_service.py        # Pet service with ownership validation
    booking_service.py    # Booking service with FSM
    care_log_service.py   # Care log service
    storage_service.py    # S3 storage service
    order_service.py      # Order service with Stripe integration
    report_service.py     # Reporting service
  persistence/            # Data access layer
    database.py           # SQLAlchemy setup
    models/               # ORM models
    repositories/         # Repository pattern for DB access
    migrations/           # Alembic migrations
  schemas/                # Pydantic models
  middleware/             # HTTP middleware
    logging.py           # Structured JSON logging
    error_handler.py     # Global error handling
  tasks/                  # Background tasks
    background.py       # Email and image processing tasks
tests/
  conftest.py            # Pytest fixtures and configuration
  unit/                  # Unit tests
  integration/           # Integration tests
```

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Docker & Docker Compose (optional)
- AWS credentials for S3 (optional)
- Stripe API keys (optional)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd backend
```

2. Create virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -e .
```

4. Configure environment:

```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Run migrations:

```bash
alembic upgrade head
```

6. Start the server:

```bash
uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`

### Docker Setup

```bash
# Build and run with docker-compose
docker-compose up -d

# Run migrations
docker-compose exec backend alembic upgrade head

# View logs
docker-compose logs -f backend
```

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive Swagger UI documentation.

## Testing

```bash
# Run all tests
pytest tests/ -v

# Run specific test file
pytest tests/unit/test_auth.py -v

# Run with coverage
pytest tests/ --cov=src
```

## Architecture Decisions

- **Layered Architecture**: Separation of concerns with routers, services, and repositories
- **UUID Primary Keys**: Better for distributed systems and security
- **Async/Await**: Non-blocking I/O throughout for better performance
- **Service Layer**: Business logic isolated from HTTP layer for testability
- **Repository Pattern**: Abstraction for data access, enabling easy testing
- **Middleware**: Centralized logging and error handling
- **Pydantic Schemas**: Automatic validation and serialization

## Security

- Passwords hashed with bcrypt
- JWT tokens with expiration
- HTTPS in production (enforced via reverse proxy)
- SQL injection prevention via ORM
- CORS middleware can be added as needed
- Stripe webhook signature verification
- S3 presigned URLs with 5-minute expiration

## Contributing

Follow these guidelines:

- Type hints on all function signatures
- Docstrings for all public functions
- No business logic in routers
- No FastAPI imports in domain layer
- Comprehensive test coverage
- Follow existing code patterns

## License

[Specify your license here]
