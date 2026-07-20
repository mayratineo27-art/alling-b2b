import pytest
import asyncio
import json
import hmac
import hashlib
from uuid import uuid4
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.api.endpoints.webhooks import WEBHOOK_SECRET, mock_fu_repo, mock_idempotency_repo
from app.domain.formato_unico import FormatoUnico, FormatoUnicoState

def test_webhook_concurrency_idempotency():
    """
    RNF-SEG-001: Concurrencia e Idempotencia.
    Simula un ataque o fallo de red enviando exactamente el mismo payload 
    de webhook 5 veces simultáneas (en menos de 500ms).
    Verificamos que la BD (mock_fu_repo) devuelva un solo 200 OK con mutación 
    de estado.
    """
    async def _test():
        mock_idempotency_repo._keys.clear()
        
        fu_id = uuid4()
        fu = FormatoUnico(id=fu_id, customer_id=uuid4(), state=FormatoUnicoState.PEDIDO, items=[])
        mock_fu_repo.save(fu)
        
        event_id = f"evt_{uuid4()}"
        payload = {"id": event_id, "status": "approved", "external_reference": str(fu_id)}
        
        body_bytes = json.dumps(payload, separators=(',', ':')).encode('utf-8')
        firma_valida = hmac.new(WEBHOOK_SECRET.encode(), body_bytes, hashlib.sha256).hexdigest()
        headers = {"X-Signature": firma_valida, "Content-Type": "application/json"}
        
        transport = ASGITransport(app=app)
        
        from unittest.mock import patch, MagicMock
        
        with patch("app.services.payment_service.mercadopago.SDK") as mock_sdk_class:
            with patch("app.services.notification_service.NotificationService.enviar_email_confirmacion") as mock_email:
                mock_sdk_instance = MagicMock()
                mock_sdk_instance.payment().get.return_value = {"response": {"status": "approved"}}
                mock_sdk_class.return_value = mock_sdk_instance
                
                async with AsyncClient(transport=transport, base_url="http://test") as ac:
                    tasks = [
                        ac.post("/webhooks/mercadopago/", content=body_bytes, headers=headers)
                        for _ in range(5)
                    ]
                    responses = await asyncio.gather(*tasks)
                    
                for r in responses:
                    assert r.status_code == 200

                fu_actualizado = mock_fu_repo.get_by_id(fu_id)
                assert fu_actualizado.state == FormatoUnicoState.CONFIRMADO
                assert len(mock_idempotency_repo._keys) == 1
                assert event_id in mock_idempotency_repo._keys

    asyncio.run(_test())
