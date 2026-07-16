from uuid import UUID
from datetime import datetime
from typing import List, Dict, Any

class AuditLogEntry:
    def __init__(self, user_id: str, action: str, entity_id: str, timestamp: datetime):
        self.user_id = user_id
        self.action = action
        self.entity_id = entity_id
        self.timestamp = timestamp

class AuditLogRepository:
    def __init__(self):
        self._logs: List[AuditLogEntry] = []
        
    def save(self, entry: AuditLogEntry) -> None:
        self._logs.append(entry)
        
    def get_all(self) -> List[AuditLogEntry]:
        return self._logs

# Singleton para pruebas
mock_audit_repo = AuditLogRepository()

class AuditService:
    def __init__(self, repo: AuditLogRepository = mock_audit_repo):
        self.repo = repo
        
    def log_mutation(self, user_id: str, action: str, entity_id: str) -> None:
        """Guarda un registro de auditoría de forma asíncrona"""
        entry = AuditLogEntry(
            user_id=user_id,
            action=action,
            entity_id=entity_id,
            timestamp=datetime.utcnow()
        )
        self.repo.save(entry)
        import logging
        logging.getLogger(__name__).info(f"[AUDIT] {action} en {entity_id} por {user_id}")
