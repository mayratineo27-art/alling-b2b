"""
Punto de entrada oficial para Vercel Serverless Functions (@vercel/python).
Vercel expone la aplicación ASGI directamente mediante `app`.
"""

from app.main import app  # noqa: F401
