"""
Punto de entrada para Vercel Serverless Functions.
Mangum actúa como adaptador entre el handler Lambda de Vercel y el ASGI app de FastAPI.
"""
from mangum import Mangum
from app.main import app

handler = Mangum(app, lifespan="off")
