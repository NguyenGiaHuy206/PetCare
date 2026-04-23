# fix-issue — Bug Fix Protocol

## Trigger
Run this command when tests fail or a bug is reported.

## Steps

### 1. Understand Before Touching
- Read the full error message and traceback carefully.
- Identify the exact file, line, and function where the failure originates.
- Trace the call chain: router → service → repository → model.
- Do NOT guess. Do not fix symptoms — find the root cause.

### 2. Reproduce First
- Run the specific failing test in isolation before changing anything:
  `pytest tests/path/to/test_file.py::test_name -v`
- Confirm you can reproduce the failure consistently.

### 3. Categorize the Bug
Label the bug before fixing it:
- **Schema mismatch** — Pydantic field name/type doesn't match ORM model or DB column
- **Missing await** — async function called without await
- **Wrong dependency** — wrong dep injected in router (e.g. missing get_current_user)
- **Ownership check missing** — pet/booking/care-log endpoint skips user id assertion
- **Status transition** — booking FSM allows invalid state change
- **Import violation** — FastAPI imported inside domain/ service
- **Session leak** — db session not properly closed or committed
- **Migration drift** — ORM model changed but migration not regenerated
- **Test fixture gap** — test relies on data that conftest.py doesn't seed

### 4. Fix Rules
- Change only the minimum code needed to fix this specific bug.
- Do not refactor unrelated code in the same commit.
- If fixing a schema: update both the Pydantic schema AND the ORM model if needed.
- If fixing a service: ensure the fix does not add FastAPI imports.
- If fixing a repo: ensure no business logic is introduced.
- After fixing, re-read the changed file top-to-bottom before running tests.

### 5. Verify
- Run the previously failing test: must pass.
- Run the full test suite: `pytest tests/ -v`
- No new failures permitted. If new failures appear, treat them as a new bug and
  restart this protocol from Step 1.

### 6. Done Criteria
- All tests in `pytest tests/ -v` pass with zero errors and zero warnings about
  coroutines, deprecations, or unclosed sessions.