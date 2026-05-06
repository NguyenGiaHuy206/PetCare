import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, require_admin
from src.persistence.models import CategoryScope, User
from src.persistence.repositories.category_repo import CategoryRepository
from src.schemas import CategoryCreate, CategoryResponse, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def get_categories(
    scope: CategoryScope | None = Query(None),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryResponse]:
    repo = CategoryRepository(db)
    categories = await repo.get_all(scope)
    return [CategoryResponse.model_validate(category) for category in categories]


@router.post("", response_model=CategoryResponse)
async def create_category(
    request: CategoryCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    repo = CategoryRepository(db)
    try:
        category = await repo.create(request.name, request.scope)
        await db.commit()
        await db.refresh(category)
        return CategoryResponse.model_validate(category)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    request: CategoryUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> CategoryResponse:
    if not request.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category name is required")

    repo = CategoryRepository(db)
    try:
        category = await repo.update(uuid.UUID(category_id), request.name)
        if not category:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        await db.commit()
        await db.refresh(category)
        return CategoryResponse.model_validate(category)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.delete("/{category_id}")
async def delete_category(
    category_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    repo = CategoryRepository(db)
    success = await repo.delete(uuid.UUID(category_id))
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    await db.commit()
    return {"message": "Category deleted"}