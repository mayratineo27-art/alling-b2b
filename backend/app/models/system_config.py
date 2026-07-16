from sqlmodel import SQLModel, Field
from datetime import datetime

class SystemConfigModel(SQLModel, table=True):
    __tablename__ = "system_configs"

    key: str = Field(primary_key=True, index=True)
    value: str
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    updated_by: str = Field(default="system")
