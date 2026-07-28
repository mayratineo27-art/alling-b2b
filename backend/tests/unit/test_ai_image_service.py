"""
Pruebas unitarias para AIImageGeneratorService (RF-AI-001).
"""

import pytest
from unittest.mock import patch, MagicMock
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


@patch("urllib.request.urlopen")
def test_generate_image_success_returns_data_uri(mock_urlopen):
    raw_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff?\x03\x00\x05\xfe\x02\xfe\xa7\x5c\xc8\x00\x00\x00\x00IEND\xaeB`\x82"
    mock_response = MagicMock()
    mock_response.read.return_value = raw_png

    mock_cm = MagicMock()
    mock_cm.__enter__.return_value = mock_response
    mock_urlopen.return_value = mock_cm

    svc = AIImageGeneratorService()
    result = svc.generate_image(prompt="Router Wi-Fi", entity_type="product", actor_role="ADMIN")

    assert result["image_url"].startswith("data:image/")
    assert "prompt_used" in result
    assert "Router Wi-Fi" in result["prompt_used"]
