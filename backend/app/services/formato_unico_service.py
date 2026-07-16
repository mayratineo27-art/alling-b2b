"""Servicio de aplicación — ciclo de vida del Formato Único (MOD-FU-01)."""

from uuid import UUID, uuid4
from app.domain.exceptions import DomainException
from app.domain.formato_unico import FormatoUnico, FormatoUnicoItem, FormatoUnicoState
from app.domain.product import Product
from app.domain.repositories.formato_unico_repository import IFormatoUnicoRepository


class FormatoUnicoService:
    """Orquesta operaciones de negocio sobre el agregado FormatoUnico usando Inyección de Dependencias."""

    def __init__(self, repo: IFormatoUnicoRepository):
        self.repo = repo

    def _merge_quantity(self, current_quantity: int, incoming_quantity: int, max_stock: float) -> int:
        if max_stock == float('inf'):
            return current_quantity + incoming_quantity
        return min(current_quantity + incoming_quantity, int(max_stock))

    def crear(self, customer_id: UUID | None = None) -> FormatoUnico:
        """Crea un Formato Único nuevo en estado BORRADOR sin ítems."""
        formato = FormatoUnico(state=FormatoUnicoState.BORRADOR, customer_id=customer_id)
        self.repo.save(formato)
        return formato

    def crear_guest_session(self) -> tuple[FormatoUnico, str]:
        """RF-CHK-007: Crea un Formato Único para usuario GUEST con un order_token opaco.
        El token será seteado en cookie httpOnly por el controller.
        Returns: (FormatoUnico, order_token)
        """
        order_token = str(uuid4())
        formato = FormatoUnico(
            state=FormatoUnicoState.BORRADOR,
            customer_id=None,
            order_token=order_token,
        )
        self.repo.save(formato)
        return formato, order_token

    def agregar_item(self, formato_unico: FormatoUnico, product: Product, qty: int) -> FormatoUnico:
        """Agrega un producto al FU validando stock disponible (RF-FU-002)."""
        if formato_unico.state != FormatoUnicoState.BORRADOR:
            raise DomainException("Operación no permitida fuera de BORRADOR")

        if qty < 1:
            raise DomainException("La cantidad debe ser al menos 1")

        if qty > product.stock:
            raise DomainException("Stock insuficiente")

        item = FormatoUnicoItem(
            product_id=product.id,
            quantity=qty,
            unit_price=product.price_public,
        )
        formato_unico.items.append(item)
        formato_unico.recalcular_subtotal()

        from datetime import datetime
        formato_unico.updated_at = datetime.utcnow()

        self.repo.save(formato_unico)
        return formato_unico

    def actualizar_cantidad_item(self, formato_unico: FormatoUnico, product: Product, qty: int) -> FormatoUnico:
        """Actualiza la cantidad de un ítem existente en el FU."""
        if formato_unico.state != FormatoUnicoState.BORRADOR:
            raise DomainException("Operación no permitida fuera de BORRADOR")

        if qty < 1:
            raise DomainException("La cantidad debe ser al menos 1")

        if qty > product.stock:
            raise DomainException("Stock insuficiente", status_code=409)

        idx = next((i for i, x in enumerate(formato_unico.items) if x.product_id == product.id), None)
        if idx is None:
            raise DomainException("El ítem no existe en el Formato Único")
            
        formato_unico.items[idx] = FormatoUnicoItem(
            product_id=product.id,
            quantity=qty,
            unit_price=product.price_public,
        )
        formato_unico.recalcular_subtotal()

        from datetime import datetime
        formato_unico.updated_at = datetime.utcnow()

        self.repo.save(formato_unico)
        return formato_unico

    def eliminar_item(self, formato_unico: FormatoUnico, product_id: UUID) -> FormatoUnico:
        """RF-FU-002: elimina un ítem específico del FU (BORRADOR-only)."""
        if formato_unico.state != FormatoUnicoState.BORRADOR:
            raise DomainException("Operación no permitida fuera de BORRADOR")

        idx = next((i for i, x in enumerate(formato_unico.items) if x.product_id == product_id), None)
        if idx is None:
            raise DomainException("El ítem no existe en el Formato Único", status_code=404)

        del formato_unico.items[idx]
        formato_unico.recalcular_subtotal()

        from datetime import datetime
        formato_unico.updated_at = datetime.utcnow()

        self.repo.save(formato_unico)
        return formato_unico

    def solicitar_consulta(self, formato_unico: FormatoUnico) -> FormatoUnico:
        """RF-FU-004 / FU-T-02: BORRADOR -> CONSULTA (BTN-FU-003, GUEST o
        CUSTOMER). Queda visible en la cola del SELLER (MOD-CON-01)."""
        if formato_unico.state != FormatoUnicoState.BORRADOR:
            raise DomainException("Operación no permitida fuera de BORRADOR")

        if not formato_unico.items:
            raise DomainException("No se puede solicitar asesoría sin ítems", status_code=400)

        from datetime import datetime

        formato_unico.state = FormatoUnicoState.CONSULTA
        formato_unico.updated_at = datetime.utcnow()
        self.repo.save(formato_unico)
        return formato_unico

    def agregar_kit(
        self, 
        formato_unico: FormatoUnico, 
        kit_id: UUID, 
        qty: int, 
        kit_service: 'KitService', 
        product_repo: 'IProductRepository'
    ) -> FormatoUnico:
        """Agrega todos los componentes de un kit al FU como ítems individuales, respetando atomicidad."""
        if formato_unico.state != FormatoUnicoState.BORRADOR:
            raise DomainException("Operación no permitida fuera de BORRADOR")

        if qty < 1:
            raise DomainException("La cantidad debe ser al menos 1")

        kit_detail = kit_service.get_kit_detail(kit_id)
        if kit_detail.stock_disponible < qty:
            raise DomainException(f"Stock insuficiente para el kit (Solicitado: {qty}, Disponible: {kit_detail.stock_disponible})", status_code=409)

        # Para asegurar atomicidad en la validación antes de modificar el agregado, 
        # primero recolectamos los productos y validamos.
        productos_a_agregar = []
        for comp in kit_detail.components:
            product = product_repo.get_by_id(comp.product_id)
            if not product:
                raise DomainException(f"Componente {comp.product_id} no encontrado en el sistema")
            
            qty_necesaria = comp.quantity * qty
            if product.stock < qty_necesaria:
                raise DomainException(f"Stock insuficiente para el componente {comp.name}")
                
            productos_a_agregar.append((product, qty_necesaria))

        # Una vez validados todos, los agregamos iterativamente
        # Nota: llamamos la lógica base pero SIN persistir individualmente para hacer un solo commit al final
        for product, qty_necesaria in productos_a_agregar:
            item = FormatoUnicoItem(
                product_id=product.id,
                quantity=qty_necesaria,
                unit_price=product.price_public,
                kit_id=kit_id,
                kit_name=kit_detail.name,
            )
            formato_unico.items.append(item)

        formato_unico.recalcular_subtotal()

        from datetime import datetime
        formato_unico.updated_at = datetime.utcnow()

        self.repo.save(formato_unico)
        return formato_unico

    def generar_cotizacion(self, formato_unico: FormatoUnico, customer_id: UUID) -> FormatoUnico:
        """RF-FU-005 / FU-T-03 (BORRADOR) y FU-T-07 (RESUELTA) → COTIZACION.
        Actor exclusivo: CUSTOMER dueño del FU (RF-FU-005 no incluye a GUEST).
        Fija la vigencia de 15 días (RN-FU-03).

        Sprint 6 — Patrón de Clonación (DEC-030 "Camino C", notas_actualizacion_diseno.md
        §4): en vez de mutar el mismo agregado (lo que congelaba el carrito
        del cliente durante toda la vigencia de la cotización), se CLONA el
        FU en un registro nuevo e independiente en COTIZACION. El FU
        original se vacía y permanece en BORRADOR, listo para seguir
        usándose de inmediato — soluciona el bug reportado de "ya no puedo
        comprar otra cosa" tras generar una cotización.
        Retorna el FU CLONADO (la cotización), no el original.
        """
        if formato_unico.customer_id is None or str(formato_unico.customer_id) != str(customer_id):
            raise DomainException("No autorizado", status_code=403)

        if formato_unico.state not in (FormatoUnicoState.BORRADOR, FormatoUnicoState.RESUELTA):
            raise DomainException(
                f"No se puede generar cotización desde el estado {formato_unico.state.value}",
                status_code=409,
            )

        if not formato_unico.items:
            raise DomainException("No se puede aprobar un Formato Único sin ítems", status_code=400)

        from datetime import datetime

        cotizacion = FormatoUnico(
            state=FormatoUnicoState.COTIZACION,
            customer_id=formato_unico.customer_id,
            items=list(formato_unico.items),
        )
        cotizacion.recalcular_subtotal()
        self.repo.save(cotizacion)

        formato_unico.state = FormatoUnicoState.BORRADOR
        formato_unico.items = []
        formato_unico.recalcular_subtotal()
        formato_unico.updated_at = datetime.utcnow()
        self.repo.save(formato_unico)

        return cotizacion

    def cancelar_cotizacion(self, formato_unico: FormatoUnico, customer_id: UUID) -> FormatoUnico:
        """RF-FU-020 / FU-T-15 (RN-FU-06): cancelación voluntaria de una
        cotización vigente, a pedido del CUSTOMER dueño, sin esperar el
        vencimiento de 15 días (RN-FU-03). El FU vuelve a BORRADOR con los
        ítems preservados; el pdf_url se limpia porque deja de ser válido
        (mismo criterio que FU-T-11, expiración automática)."""
        if formato_unico.customer_id is None or str(formato_unico.customer_id) != str(customer_id):
            raise DomainException("No autorizado", status_code=403)

        if formato_unico.state != FormatoUnicoState.COTIZACION:
            raise DomainException(
                f"No se puede cancelar una cotización desde el estado {formato_unico.state.value}",
                status_code=409,
            )

        from datetime import datetime

        formato_unico.state = FormatoUnicoState.BORRADOR
        formato_unico.pdf_url = None
        formato_unico.updated_at = datetime.utcnow()
        self.repo.save(formato_unico)
        return formato_unico

    def _clonar_items_disponibles(self, items: list[FormatoUnicoItem], product_repo) -> list[FormatoUnicoItem]:
        """Copia ítems desde un FU histórico usando precios ACTUALES del
        catálogo (no los precios congelados), ya que el destino es un
        BORRADOR editable de precios dinámicos. Omite productos inactivos
        o sin stock en vez de fallar la operación completa (Widget de
        Recompra, T6-B3)."""
        clonados = []
        for item in items:
            product = product_repo.get_by_id(item.product_id)
            if not product or not product.is_active:
                continue
            max_stock = product.stock
            qty = item.quantity if max_stock == float('inf') else min(item.quantity, int(max_stock))
            if qty < 1:
                continue
            clonados.append(FormatoUnicoItem(product_id=item.product_id, quantity=qty, unit_price=product.price_public))
        return clonados

    def reemplazar_borrador(self, historico: FormatoUnico, borrador_activo: FormatoUnico, product_repo) -> FormatoUnico:
        """BTN-FU-008a (Widget de Recompra): reemplaza por completo el
        borrador activo con los ítems de una cotización histórica."""
        from datetime import datetime

        borrador_activo.items = self._clonar_items_disponibles(historico.items, product_repo)
        borrador_activo.recalcular_subtotal()
        borrador_activo.updated_at = datetime.utcnow()
        self.repo.save(borrador_activo)
        return borrador_activo

    def combinar_con_borrador(self, historico: FormatoUnico, borrador_activo: FormatoUnico, product_repo) -> FormatoUnico:
        """BTN-FU-008b (Widget de Recompra): fusiona los ítems de una
        cotización histórica dentro del borrador activo, sumando
        cantidades para los productos ya presentes en vez de duplicar filas."""
        from datetime import datetime

        items_por_producto = {item.product_id: item for item in borrador_activo.items}
        for item_historico in self._clonar_items_disponibles(historico.items, product_repo):
            product = product_repo.get_by_id(item_historico.product_id)
            max_stock = product.stock if product else float('inf')
            existente = items_por_producto.get(item_historico.product_id)
            if existente:
                nueva_qty = self._merge_quantity(existente.quantity, item_historico.quantity, max_stock)
                items_por_producto[item_historico.product_id] = FormatoUnicoItem(
                    product_id=item_historico.product_id,
                    quantity=nueva_qty,
                    unit_price=item_historico.unit_price,
                )
            else:
                items_por_producto[item_historico.product_id] = item_historico

        borrador_activo.items = list(items_por_producto.values())
        borrador_activo.recalcular_subtotal()
        borrador_activo.updated_at = datetime.utcnow()
        self.repo.save(borrador_activo)
        return borrador_activo

    def cambiar_estado(self, formato_unico: FormatoUnico, nuevo_estado: FormatoUnicoState) -> FormatoUnico:
        """Cambia el estado del Formato Único (RF-FU-003, RF-FU-004)."""
        if formato_unico.state == nuevo_estado:
            raise DomainException(f"El Formato Único ya se encuentra en estado {nuevo_estado}")
            
        if nuevo_estado == FormatoUnicoState.CANCELADO:
            if formato_unico.state not in (FormatoUnicoState.BORRADOR, FormatoUnicoState.EXPIRADA):
                raise DomainException("Solo permitido en BORRADOR o EXPIRADA", status_code=409)
            
        if nuevo_estado == FormatoUnicoState.APROBADO and not formato_unico.items:
            raise DomainException("No se puede aprobar un Formato Único sin ítems")
            
        formato_unico.state = nuevo_estado
        self.repo.save(formato_unico)
        return formato_unico

    def merge_guest_to_customer(self, order_token: str, customer_id: UUID, product_repo=None) -> FormatoUnico:
        """RF-AUT-007: Fusiona el FU GUEST (por cookie order_token) con el FU activo del CUSTOMER.
        Si el CUSTOMER no tiene FU activo, el FU GUEST es adoptado como su FU.
        Al finalizar, el FU GUEST es CANCELADO para invalidarlo.
        El controller es responsable de borrar la cookie order_token tras el merge exitoso.
        """
        guest_fu = self.repo.get_by_order_token(order_token)
        if not guest_fu:
            # No hay FU guest que fusionar — simplemente retornamos o creamos uno para el customer
            customer_fu = self.repo.get_active_by_customer_id(customer_id)
            if not customer_fu:
                customer_fu = self.crear(customer_id)
            return customer_fu

        # Buscar el FU activo del CUSTOMER
        customer_fu = self.repo.get_active_by_customer_id(customer_id)

        if customer_fu:
            # Merge de items: sumar cantidades (respetando stock máximo)
            for guest_item in guest_fu.items:
                existing_item = next(
                    (item for item in customer_fu.items if item.product_id == guest_item.product_id), None
                )

                max_stock = float('inf')
                if product_repo:
                    product = product_repo.get_by_id(guest_item.product_id)
                    if product:
                        max_stock = product.stock - product.reserved_stock

                if existing_item:
                    nueva_cantidad = self._merge_quantity(existing_item.quantity, guest_item.quantity, max_stock)
                    nuevo_item = FormatoUnicoItem(
                        product_id=existing_item.product_id,
                        quantity=nueva_cantidad,
                        unit_price=existing_item.unit_price,
                    )
                    customer_fu.items.remove(existing_item)
                    customer_fu.items.append(nuevo_item)
                else:
                    nueva_cantidad = guest_item.quantity if max_stock == float('inf') else min(guest_item.quantity, int(max_stock))
                    if nueva_cantidad > 0:
                        customer_fu.items.append(
                            FormatoUnicoItem(
                                product_id=guest_item.product_id,
                                quantity=nueva_cantidad,
                                unit_price=guest_item.unit_price,
                            )
                        )

            customer_fu.recalcular_subtotal()
            self.repo.save(customer_fu)
        else:
            # Adoptar el FU GUEST como FU del CUSTOMER
            customer_fu = guest_fu
            customer_fu.customer_id = customer_id
            customer_fu.order_token = None  # Limpiar token de guest
            self.repo.save(customer_fu)
            # No hay FU guest separado que cancelar en este caso
            return customer_fu

        # Cancelar el FU GUEST para invalidarlo
        guest_fu.state = FormatoUnicoState.CANCELADO
        self.repo.save(guest_fu)

        return customer_fu

    def fusionar_formatos(self, guest_fu_id: UUID, customer_id: UUID, product_repo=None) -> FormatoUnico:
        """Fusiona el FU GUEST (por ID) con el del CUSTOMER. Utilizado por los flujos de prueba integration."""
        guest_fu = self.repo.get_by_id(guest_fu_id)
        if not guest_fu:
            customer_fu = self.repo.get_active_by_customer_id(customer_id)
            if not customer_fu:
                customer_fu = self.crear(customer_id)
            return customer_fu

        customer_fu = self.repo.get_active_by_customer_id(customer_id)

        if customer_fu:
            for guest_item in guest_fu.items:
                existing_item = next(
                    (item for item in customer_fu.items if item.product_id == guest_item.product_id), None
                )

                max_stock = float('inf')
                if product_repo:
                    product = product_repo.get_by_id(guest_item.product_id)
                    if product:
                        max_stock = product.stock - product.reserved_stock

                if existing_item:
                    nueva_cantidad = self._merge_quantity(existing_item.quantity, guest_item.quantity, max_stock)
                    nuevo_item = FormatoUnicoItem(
                        product_id=existing_item.product_id,
                        quantity=nueva_cantidad,
                        unit_price=existing_item.unit_price,
                    )
                    customer_fu.items.remove(existing_item)
                    customer_fu.items.append(nuevo_item)
                else:
                    nueva_cantidad = guest_item.quantity if max_stock == float('inf') else min(guest_item.quantity, int(max_stock))
                    if nueva_cantidad > 0:
                        customer_fu.items.append(
                            FormatoUnicoItem(
                                product_id=guest_item.product_id,
                                quantity=nueva_cantidad,
                                unit_price=guest_item.unit_price,
                            )
                        )

            customer_fu.recalcular_subtotal()
            self.repo.save(customer_fu)
        else:
            customer_fu = guest_fu
            customer_fu.customer_id = customer_id
            customer_fu.order_token = None
            self.repo.save(customer_fu)
            return customer_fu

        guest_fu.state = FormatoUnicoState.CANCELADO
        self.repo.save(guest_fu)
        return customer_fu
