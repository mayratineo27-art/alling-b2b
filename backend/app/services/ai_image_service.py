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


def _generate_fallback_b2b_svg(prompt: str) -> str:
    import base64
    clean_title = (prompt[:35] + "...") if len(prompt) > 35 else prompt
    svg_code = f'''<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061D17"/>
      <stop offset="50%" stop-color="#092A22"/>
      <stop offset="100%" stop-color="#020A08"/>
    </linearGradient>
    <linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <rect width="500" height="500" fill="url(#bg)"/>
  <circle cx="250" cy="200" r="80" fill="#10B981" fill-opacity="0.1" stroke="#10B981" stroke-width="2" stroke-dasharray="6,6"/>
  <path d="M220 180L250 150L280 180M250 150V230M210 220H290" stroke="#34D399" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <rect x="50" y="320" width="400" height="46" rx="10" fill="url(#badge)"/>
  <text x="250" y="349" font-family="system-ui, sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{clean_title}</text>
  <text x="250" y="410" font-family="system-ui, sans-serif" font-size="12" font-weight="600" fill="#6EE7B7" text-anchor="middle">ALLING B2B — HARDWARE &amp; FIBRA ÓPTICA</text>
</svg>'''
    b64_svg = base64.b64encode(svg_code.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{b64_svg}"


def _generate_fallback_hero_b2b_svg(prompt: str) -> str:
    import base64
    clean_title = (prompt[:45] + "...") if len(prompt) > 45 else prompt
    svg_code = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#061D17"/>
      <stop offset="40%" stop-color="#0B382D"/>
      <stop offset="100%" stop-color="#020A08"/>
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#059669" stop-opacity="0.2"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <!-- High Tech Fiber Paths -->
  <path d="M-100 360 C 300 100, 700 620, 1380 360" fill="none" stroke="#10B981" stroke-width="3" stroke-opacity="0.4"/>
  <path d="M-100 400 C 400 600, 800 120, 1380 400" fill="none" stroke="#34D399" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8,8"/>
  <circle cx="640" cy="300" r="180" fill="#10B981" fill-opacity="0.05" stroke="#10B981" stroke-width="1.5"/>
  <rect x="240" y="480" width="800" height="56" rx="14" fill="url(#glow)"/>
  <text x="640" y="516" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{clean_title}</text>
  <text x="640" y="580" font-family="system-ui, sans-serif" font-size="14" font-weight="700" fill="#6EE7B7" letter-spacing="3" text-anchor="middle">PORTAL B2B ALLING — BANNER PRINCIPAL DE PORTADA</text>
</svg>'''
    b64_svg = base64.b64encode(svg_code.encode('utf-8')).decode('utf-8')
    return f"data:image/svg+xml;base64,{b64_svg}"


class AIImageGeneratorService:
    def generate_image(
        self,
        prompt: str,
        entity_type: str = "product",
        actor_role: str = "ADMIN",
    ) -> Dict[str, Any]:
        """
        Genera una imagen con IA libre a partir de un prompt o nombre de producto/categoría/banner.
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
        is_hero_banner = entity_type == "hero_banner"
        if is_hero_banner:
            enriched_prompt = (
                f"Widescreen 16:9 B2B hero banner background of {clean_prompt}, "
                f"high-tech telecom fiber optics network, studio lighting, emerald glow accents, 8k resolution wallpaper"
            )
            width, height = 1280, 720
        elif entity_type == "category":
            enriched_prompt = (
                f"Professional clean category icon photo of {clean_prompt}, "
                f"B2B telecom and networking technology, studio lighting, emerald accents, highly detailed, 4k resolution"
            )
            width, height = 512, 512
        else:
            enriched_prompt = (
                f"Professional studio product photograph of {clean_prompt}, "
                f"B2B networking hardware equipment, clean white background, studio lights, 8k product render"
            )
            width, height = 512, 512

        import random
        seed = random.randint(100, 999999)
        encoded_prompt = urllib.parse.quote(enriched_prompt)
        pollinations_url = (
            f"https://image.pollinations.ai/prompt/{encoded_prompt}"
            f"?width={width}&height={height}&nologo=true&seed={seed}"
        )

        final_image_url = None
        try:
            req = urllib.request.Request(
                pollinations_url,
                headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            )
            with urllib.request.urlopen(req, timeout=12) as resp:
                if resp.status == 200:
                    raw_bytes = resp.read()
                    if raw_bytes and len(raw_bytes) > 500:
                        max_dim = 1280 if is_hero_banner else 500
                        final_image_url = _compress_to_webp_data_uri(raw_bytes, max_dim=max_dim)
        except Exception as exc:
            print(f"[AIImageGeneratorService] Pollinations no disponible ({exc}), usando fallback Data URI B2B.")

        if not final_image_url:
            if is_hero_banner:
                final_image_url = _generate_fallback_hero_b2b_svg(clean_prompt)
            else:
                final_image_url = _generate_fallback_b2b_svg(clean_prompt)

        return {
            "image_url": final_image_url,
            "prompt_used": enriched_prompt,
            "message": "Imagen generada con IA exitosamente",
        }



