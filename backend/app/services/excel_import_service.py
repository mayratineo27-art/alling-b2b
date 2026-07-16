import csv
import io
from typing import Dict, Any, List
from app.domain.repositories.product_repository import IProductRepository
from app.domain.product import Product

class ExcelImportService:
    def __init__(self, product_repo: IProductRepository):
        self.product_repo = product_repo
        
    def process_csv(self, file_content: bytes) -> Dict[str, List[Dict[str, Any]]]:
        """
        Procesa el archivo CSV subido (formato: sku,cantidad).
        Cruza los SKUs con la base de datos (ProductRepository) y devuelve el estado.
        """
        exitosos = []
        advertencias = []
        errores = []
        
        # Leemos todos los productos (idealmente buscaríamos en batch por SKU pero para el mock repo iteramos)
        # list_all() sin argumentos pagina a solo 10 resultados por defecto —
        # con más de 10 productos activos, cualquier SKU real fuera de esa
        # primera página se reportaba como "SKU no existe" (RF-FU-013).
        all_products = self.product_repo.list_all(skip=0, limit=10_000)
        products_by_sku = {p.sku: p for p in all_products if p.sku}
        
        import pandas as pd
        
        try:
            # Intentar leer como Excel (.xlsx) primero
            df = pd.read_excel(io.BytesIO(file_content))
        except Exception:
            try:
                # Si falla, intentar como CSV (.csv)
                df = pd.read_csv(io.BytesIO(file_content))
            except Exception:
                return {"exitosos": [], "advertencias": [], "errores": [{"sku": "ARCHIVO", "mensaje": "Formato no soportado o archivo corrupto. Use CSV o XLSX."}]}
        
        # Estandarizar cabeceras a minúsculas
        df.columns = df.columns.str.strip().str.lower()
        
        if "sku" not in df.columns or "cantidad" not in df.columns:
            return {"exitosos": [], "advertencias": [], "errores": [{"sku": "COLUMNAS", "mensaje": "Faltan las cabeceras 'sku' o 'cantidad'"}]}
            
        df = df.fillna({"sku": "", "cantidad": 0})
        
        for _, row in df.iterrows():
            sku = str(row.get("sku", "")).strip()
            cantidad_str = str(row.get("cantidad", "0")).strip()
            
            if not sku:
                continue
                
            try:
                # La plantilla trae 200 filas (todo el catálogo) con
                # cantidad=0 para que el cliente solo rellene lo que quiere
                # pedir. .xlsx además suele traer columnas numéricas como
                # float ("10.0"), no int — int("10.0") lanza ValueError.
                cantidad = int(float(cantidad_str))
            except ValueError:
                errores.append({"sku": sku, "mensaje": "Cantidad inválida"})
                continue

            if cantidad == 0:
                # Fila de la plantilla que el cliente dejó sin pedir: no es
                # error ni ítem a importar, se omite en silencio.
                continue
            if cantidad < 0:
                errores.append({"sku": sku, "mensaje": "Cantidad inválida"})
                continue

            producto = products_by_sku.get(sku)
            if not producto:
                errores.append({"sku": sku, "mensaje": "SKU no existe"})
            elif producto.stock < cantidad:
                advertencias.append({
                    "sku": sku, 
                    "mensaje": f"Stock parcial. Solicitado: {cantidad}, Disponible: {producto.stock}",
                    "disponible": producto.stock
                })
            else:
                exitosos.append({
                    "sku": sku,
                    "cantidad": cantidad
                })
                
        return {
            "exitosos": exitosos,
            "advertencias": advertencias,
            "errores": errores
        }
