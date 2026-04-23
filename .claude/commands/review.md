# review — Code Review Protocol

## Trigger
Run this after implementation is complete or before declaring a task done.

## Checklist — work through every item in order

### Architecture
- [ ] Routers contain zero business logic and zero direct DB access
- [ ] All business logic lives in domain/ services
- [ ] Repositories contain only DB queries — no conditionals based on business rules
- [ ] No FastAPI imports anywhere inside domain/
- [ ] No SQLAlchemy session usage inside domain/ services directly

### Models & Migrations
- [ ] Every primary key is UUID, not int
- [ ] Every timestamp uses UTC (datetime.utcnow() or func.now())
- [ ] All Enums match between ORM model, Pydantic schema, and DB migration
- [ ] Alembic migration reflects current ORM state — run autogenerate and confirm
      no new changes are detected

### Auth & Security
- [ ] Every non-public endpoint injects get_current_user
- [ ] Every admin endpoint injects require_admin
- [ ] Every pet/booking/care-log read/write/delete asserts ownership
      (pet.owner_id == current_user.id) before proceeding
- [ ] No secrets hardcoded anywhere — all read from config.py
- [ ] Stripe webhook reads raw body and verifies signature before any processing
- [ ] S3 presigned URLs use 300s expiry and uuid4-based key pattern

### Async Correctness
- [ ] Every DB call uses await
- [ ] No synchronous blocking calls inside async functions
- [ ] AsyncSession used everywhere — not Session

### Schemas
- [ ] All route responses return Pydantic schema instances, never raw ORM objects
- [ ] All Pydantic models use model_config = ConfigDict(from_attributes=True)
- [ ] Request bodies are validated by Pydantic before reaching the service layer

### Error Handling
- [ ] Global error handler in middleware/error_handler.py is registered in main.py
- [ ] RequestValidationError → 422
- [ ] SQLAlchemyError → 500
- [ ] StripeError → 502
- [ ] Custom domain exceptions → 400 / 403 / 404 as appropriate
- [ ] All errors return {"error": "<message>"} format

### Logging
- [ ] No print() calls anywhere in the codebase
- [ ] Every request logs method, path, status_code, duration_ms, user_id
- [ ] All errors logged at ERROR level with traceback
- [ ] Stripe webhook events logged at INFO with event type and session id

### Tests
- [ ] conftest.py uses async SQLite in-memory DB, not the production DB
- [ ] S3 is mocked with moto in all relevant tests
- [ ] Stripe is mocked with unittest.mock.patch in all relevant tests
- [ ] All five key test files exist with the cases from CLAUDE.md:
      - invalid login rejected
      - expired token rejected
      - duplicate email rejected
      - user A cannot access user B's pet
      - overlapping booking rejected
      - past date booking rejected
      - invalid status transition rejected
      - order total is accurate
      - order items stored correctly
      - bad Stripe signature → 400
      - valid Stripe event → order marked paid
- [ ] `pytest tests/ -v` passes with zero failures

### Final
- [ ] No TODO or placeholder comments left in any file
- [ ] No .env file committed
- [ ] docker-compose.yml backend service depends_on db
- [ ] CI workflow triggers on push and pull_request with lint + test + build jobs