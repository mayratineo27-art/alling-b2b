from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings

router = APIRouter()

class GenerateHeroResponse(BaseModel):
    image_url: str

@router.get("/generate-hero", response_model=GenerateHeroResponse)
def generate_hero():
    """
    Genera una imagen usando google-generativeai para el hero section.
    
    @sdd-endpoint GET /system/generate-hero
    @sdd-rf RF-SYS-001
    """
    if not settings.GOOGLE_API_KEY:
        return GenerateHeroResponse(image_url="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070")

    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_API_KEY)
        
        # En el SDK reciente de google-generativeai, generar imágenes usa ImageGenerationModel
        try:
            from google.generativeai import ImageGenerationModel
            model = ImageGenerationModel("imagen-3.0-generate-001")
            result = model.generate_images(
                prompt="fiber optic bokeh background",
                number_of_images=1,
                aspect_ratio="16:9"
            )
            
            import base64
            from io import BytesIO
            
            img_byte_arr = BytesIO()
            result.images[0].image.save(img_byte_arr, format='JPEG')
            base64_encoded = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
            
            return GenerateHeroResponse(image_url=f"data:image/jpeg;base64,{base64_encoded}")
            
        except Exception as e:
            print(f"Error generando imagen con Gemini: {e}")
            return GenerateHeroResponse(image_url="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070")
            
    except Exception as e:
        print(f"Error importando o configurando genai: {e}")
        return GenerateHeroResponse(image_url="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070")
