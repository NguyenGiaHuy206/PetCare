#!/usr/bin/env python
"""Seed an initial admin user and default categories."""

import asyncio
import os

from dotenv import dotenv_values, find_dotenv

from src.persistence.database import AsyncSessionLocal
from src.persistence.models import CategoryScope, UserRole
from src.persistence.repositories.category_repo import CategoryRepository
from src.persistence.repositories.user_repo import UserRepository
from src.services.auth_service import AuthService

DEFAULT_CATEGORIES = {
    CategoryScope.SHOP: ["Food", "Toys", "Accessories", "Furniture"],
    CategoryScope.SERVICE: ["Grooming", "Veterinary", "Training", "Daycare"],
    CategoryScope.CARELOG: ["Feeding", "Medication", "Walking", "Grooming"],
}


async def seed_initial_data() -> None:
    env_values = {**dotenv_values(find_dotenv()), **os.environ}
    admin_email = env_values.get("SUPER_ADMIN_EMAIL") or env_values.get(
        "SEED_ADMIN_EMAIL") or "admin@petcare.com"
    admin_password = env_values.get("SEED_ADMIN_PASSWORD") or "Admin123!"
    admin_full_name = env_values.get("SEED_ADMIN_FULL_NAME") or "Initial Admin"

    async with AsyncSessionLocal() as session:
        user_repo = UserRepository(session)
        category_repo = CategoryRepository(session)
        auth_service = AuthService(session)

        admin_user = await user_repo.get_by_email(admin_email)
        if admin_user:
            admin_user.role = UserRole.ADMIN
            print(f"Promoted existing user to admin: {admin_email}")
        else:
            password_hash = auth_service.hash_password(admin_password)
            await user_repo.create(
                email=admin_email,
                password_hash=password_hash,
                full_name=admin_full_name,
                role=UserRole.ADMIN.value,
            )
            print(f"Created seed admin: {admin_email}")

        for scope, names in DEFAULT_CATEGORIES.items():
            for category_name in names:
                existing_category = await category_repo.get_by_name(category_name, scope)
                if existing_category:
                    continue
                await category_repo.create(category_name, scope)
                print(f"Seeded category [{scope.value}]: {category_name}")

        await session.commit()


def run() -> None:
    asyncio.run(seed_initial_data())


if __name__ == "__main__":
    run()