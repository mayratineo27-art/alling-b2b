from decimal import Decimal

class ShippingService:
    def calculate_shipping(self, address: str) -> Decimal:
        # Mock de costo fijo
        return Decimal("15.00")
