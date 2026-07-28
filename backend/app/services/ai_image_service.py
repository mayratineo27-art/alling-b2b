"""
AIImageGeneratorService — Generador de imágenes referenciales mediante IA libre (Pollinations / FLUX).

RF relacionado  : RF-AI-001
OPS relacionada : OPS-CAT-006
CA relacionado  : CA-AI-001
"""

from __future__ import annotations

import io
import urllib.parse
import urllib.request
from typing import Dict, Any

from app.domain.exceptions import DomainException


def _compress_to_webp_data_uri(raw_bytes: bytes, max_dim: int = 500, quality: int = 80) -> str:
    """Comprime los bytes recibidos de la IA a WebP/JPEG liviano (~15-30 KB) en Data URI Base64."""
    import base64
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(raw_bytes))
        img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        if img.mode in ("RGBA", "P"):
            img.save(out, format="WEBP", quality=quality)
            mime = "image/webp"
        else:
            img = img.convert("RGB")
            img.save(out, format="JPEG", quality=quality)
            mime = "image/jpeg"
        b64_str = base64.b64encode(out.getvalue()).decode("utf-8")
        return f"data:{mime};base64,{b64_str}"
    except Exception:
        b64_str = base64.b64encode(raw_bytes).decode("utf-8")
        return f"data:image/png;base64,{b64_str}"


class AIImageGeneratorService:
    def generate_image(
        self,
        prompt: str,
        entity_type: str = "product",
        actor_role: str = "ADMIN",
    ) -> Dict[str, Any]:
        """
        Genera una imagen con IA libre a partir de un prompt o nombre de producto/categoría.
        """
        if actor_role.upper() != "ADMIN":
            raise DomainException(
                message="Solo el usuario ADMIN puede generar imágenes con IA",
                status_code=403,
            )

        clean_prompt = prompt.strip()
        if not clean_prompt:
            raise DomainException(
                message="El prompt para la generación con IA no puede estar vacío",
                status_code=422,
            )

        # Enriquecer prompt para fotografía comercial B2B de alta calidad
        if entity_type == "category":
            enriched_prompt = (
                f"Professional clean category icon photo of {clean_prompt}, "
                f"B2B telecom and networking technology, studio lighting, emerald accents, highly detailed, 4k resolution"
            )
        else:
            enriched_prompt = (
                f"Professional studio product photograph of {clean_prompt}, "
                f"B2B networking hardware equipment, clean white background, studio lights, 8k product render"
            )

        import random
        seed = random.randint(100, 999999)
        encoded_prompt = urllib.parse.quote(enriched_prompt)
        pollinations_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width=512&height=512&nologo=true&seed={seed}"
        )

        return {
            "image_url": pollinations_url,
            "prompt_used": enriched_prompt,
            "message": "Imagen generada con IA exitosamente",
        }

