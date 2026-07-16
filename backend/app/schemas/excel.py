from pydantic import BaseModel, Field
from uuid import UUID

class ExcelRowSchema(BaseModel):
    product_id: UUID = Field(alias="SKU")
    quantity: int = Field(alias="Cantidad", gt=0)
    
class ExcelImportResultSchema(BaseModel):
    valid_items: list[dict]
    invalid_sku_items: list[dict]
    insufficient_stock_items: list[dict]
    errors: list[str]
