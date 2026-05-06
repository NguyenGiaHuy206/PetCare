import asyncio
import os
from datetime import datetime, timedelta, timezone

from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.api.deps import get_db
from src.services.auth_service import AuthService
from src.main import create_app
from src.persistence.database import Base

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"


async def main():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    Session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with Session() as db:
        auth = AuthService(db)
        user = await auth.register(email="u@t.com", password="pass123", full_name="U")
        await db.commit()
        token = AuthService(None).create_access_token(user.id)
        app = create_app()

        async def override():
            yield db
        app.dependency_overrides[get_db] = override
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            h = {"Authorization": f"Bearer {token}"}
            pet = (await c.post(
                "/pets",
                json={
                    "name": "F",
                    "species": "cat",
                    "breed": "domestic",
                    "age": "3",
                },
                headers=h,
            )).json()
            t = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
            b = (await c.post("/bookings", json={
                "pet_id": pet["id"], "service": "grooming",
                "booking_datetime": t, "duration_minutes": 60
            }, headers=h)).json()
            print("Booking:", b)
            r = await c.put(f"/bookings/{b['id']}/status", json={"status": "confirmed"}, headers=h)
            print("STATUS:", r.status_code)
            print("BODY:", r.json())


def run() -> None:
    asyncio.run(main())


if __name__ == "__main__":
    run()
