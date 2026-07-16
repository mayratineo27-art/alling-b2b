# backend/app/core/deps.py
from typing import Generator
from fastapi import Depends
from sqlmodel import Session
from app.db.database import engine, get_session
from app.services.product_query_service import ProductQueryService
from app.infra.repositories.product_repository_impl import ProductRepositoryImpl

def get_product_query_service(
    session: Session = Depends(get_session)
) -> ProductQueryService:
    """
    Inyecta el servicio de consulta de productos con su repositorio real (SQLModel).
    """
    if session is None:
        raise ValueError("Session is required to instantiate ProductQueryService")
        
    repo = ProductRepositoryImpl(session=session)
    return ProductQueryService(repo=repo)

def get_category_query_service(
    session: Session = Depends(get_session)
):
    """
    Inyecta el servicio de consulta de categorías con su repositorio real (SQLModel).
    """
    from app.services.category_query_service import CategoryQueryService

    repo = ProductRepositoryImpl(session=session)
    return CategoryQueryService(repo)

def get_kit_service(
    session: Session = Depends(get_session)
):
    from app.services.kit_service import KitService
    from app.infra.repositories.kit_repository_impl import KitRepositoryImpl
    from app.infra.repositories.product_repository_impl import ProductRepositoryImpl

    kit_repo = KitRepositoryImpl(session=session)
    product_repo = ProductRepositoryImpl(session=session)
    return KitService(kit_repo=kit_repo, product_repo=product_repo)

def get_product_repository(
    session: Session = Depends(get_session)
):
    """
    Inyecta el repositorio de productos con persistencia real (SQLModel).
    Usado por el endpoint de sincronización del distribuidor (MOD-DIS-01).
    """
    from app.infra.repositories.product_repository_impl import ProductRepositoryImpl
    return ProductRepositoryImpl(session=session)
