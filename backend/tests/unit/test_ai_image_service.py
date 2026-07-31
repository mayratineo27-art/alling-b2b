"""
Pruebas unitarias para AIImageGeneratorService (RF-AI-001).
"""

import pytest
from app.domain.exceptions import DomainException
from app.services.ai_image_service import AIImageGeneratorService


def test_non_admin_cannot_generate_ai_image():
    svc = AIImageGeneratorService()
    with pytest.raises(DomainException) as exc:
        svc.generate_image(prompt="Fibra Optica", entity_type="category", actor_role="CUSTOMER")
    assert exc.value.status_code == 403


def test_empty_prompt_raises_error():
    svc = AIImageGeneratorService()
    with pytest.raises(DomainException) as exc:
        svc.generate_image(prompt="   ", entity_type="category", actor_role="ADMIN")
    assert exc.value.status_code == 422


def test_generate_image_success_returns_pollinations_url():
    svc = AIImageGeneratorService()
    result = svc.generate_image(prompt="Router Wi-Fi", entity_type="product", actor_role="ADMIN")

    assert result["image_url"].startswith("data:image/") or result["image_url"].startswith("http")

    assert "prompt_used" in result
    assert "Router Wi-Fi" in result["prompt_used"]
