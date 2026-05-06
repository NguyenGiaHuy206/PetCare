import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.deps import get_db, require_admin
from src.persistence.models import ProductKind, User
from src.persistence.repositories.product_repo import ProductRepository
from src.schemas import ProductCreate, ProductResponse, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductResponse)
async def create_product(
    request: ProductCreate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Create a new product (admin only)."""
    repo = ProductRepository(db)
    try:
        product = await repo.create(
            request.name,
            request.price,
            request.stock,
            request.description,
            request.image_url,
            request.duration_minutes,
            request.kind,
            request.category_id,
        )
        await db.commit()
        return ProductResponse.model_validate(product)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("", response_model=list[ProductResponse])
async def get_products(
    search: str = Query(None),
    kind: ProductKind | None = Query(None),
    category_id: str | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[ProductResponse]:
    """Get all products with optional search."""
    repo = ProductRepository(db)
    parsed_category_id = uuid.UUID(category_id) if category_id else None
    products = await repo.get_all(skip, limit, search, kind, parsed_category_id)
    return [ProductResponse.model_validate(p) for p in products]


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str,
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Get a specific product."""
    repo = ProductRepository(db)
    product = await repo.get_by_id(uuid.UUID(product_id))
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    request: ProductUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> ProductResponse:
    """Update a product (admin only)."""
    repo = ProductRepository(db)
    try:
        update_data = request.model_dump(exclude_unset=True)
        product = await repo.update(uuid.UUID(product_id), **update_data)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        await db.commit()
        return ProductResponse.model_validate(product)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a product (admin only)."""
    repo = ProductRepository(db)
    success = await repo.delete(uuid.UUID(product_id))
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await db.commit()
    return {"message": "Product deleted"}
