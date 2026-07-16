from uuid import UUID
import dataclasses
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository
from app.domain.repositories.product_repository import IProductRepository
from app.domain.exceptions import DomainException

class InventoryService:
    def __init__(self, fu_repo: IFormatoUnicoRepository, product_repo: IProductRepository):
        self.fu_repo = fu_repo
        self.product_repo = product_repo

    def reservar_stock(self, fu_id: UUID) -> None:
        """
        Reserva stock para los ítems de un Formato Único.
        Valida que haya suficiente stock disponible.
        """
        fu = self.fu_repo.get_by_id(fu_id)
        if not fu:
            raise DomainException(message="Formato Único no encontrado", status_code=404)
            
        # Para evitar condiciones de carrera reales en BD usaríamos transacciones o FOR UPDATE.
        # Aquí usamos lógica en memoria simulada.
        for item in fu.items:
            product = self.product_repo.get_by_id(item.product_id)
            if not product:
                raise DomainException(message=f"Producto {item.product_id} no encontrado", status_code=409)
            
            disponible = product.stock - product.reserved_stock
            if disponible < item.quantity:
                raise DomainException(message=f"Stock insuficiente para el producto {product.name}", status_code=409)
            
            # Incrementar reserva
            nuevo_reservado = product.reserved_stock + item.quantity
            product_actualizado = dataclasses.replace(product, reserved_stock=nuevo_reservado)
            self.product_repo.save(product_actualizado)
            
    def liberar_stock(self, fu_id: UUID) -> None:
        """
        Libera la reserva de stock asociada a los ítems de un Formato Único.
        """
        fu = self.fu_repo.get_by_id(fu_id)
        if not fu:
            return # Si no hay FU, no hay qué liberar
            
        for item in fu.items:
            product = self.product_repo.get_by_id(item.product_id)
            if product:
                nuevo_reservado = max(0, product.reserved_stock - item.quantity)
                product_actualizado = dataclasses.replace(product, reserved_stock=nuevo_reservado)
                self.product_repo.save(product_actualizado)

    def confirmar_reserva(self, fu_id: UUID) -> None:
        """
        Confirma la venta. Descuenta el stock reservado y el stock total (RF-CHK-011).
        """
        fu = self.fu_repo.get_by_id(fu_id)
        if not fu:
            return
            
        for item in fu.items:
            product = self.product_repo.get_by_id(item.product_id)
            if product:
                nuevo_reservado = max(0, product.reserved_stock - item.quantity)
                nuevo_stock = max(0, product.stock - item.quantity)
                product_actualizado = dataclasses.replace(product, stock=nuevo_stock, reserved_stock=nuevo_reservado)
                self.product_repo.save(product_actualizado)
