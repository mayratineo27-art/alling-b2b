"""
Script utilitario para estandarizar cualquier imagen a 400x400 px (formato cuadrado 1:1)
con fondo blanco centrado para la carga en categorías del sistema (RN-CAT-IMG-02).

Uso:
    python backend/scripts/standardize_image.py <ruta_imagen_entrada> [ruta_salida]
"""

import sys
import os
from PIL import Image

def standardize_image(input_path: str, output_path: str = None) -> str:
    if not os.path.exists(input_path):
        print(f"Error: Archivo '{input_path}' no encontrado.")
        sys.exit(1)

    if not output_path:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_400x400.png"

    # Abrir la imagen
    img = Image.open(input_path)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Crear lienzo cuadrado 400x400 blanco
    canvas_size = 400
    canvas = Image.new('RGBA', (canvas_size, canvas_size), (255, 255, 255, 255))

    # Redimensionar manteniendo la proporción aspect ratio
    src_w, src_h = img.size
    aspect = src_w / src_h

    # Dejar margen interior de 20px para un acabado limpio (área útil 360x360)
    target_max = 360

    if aspect > 1:
        new_w = target_max
        new_h = int(target_max / aspect)
    else:
        new_h = target_max
        new_w = int(target_max * aspect)

    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Centrar en el lienzo de 400x400
    offset_x = (canvas_size - new_w) // 2
    offset_y = (canvas_size - new_h) // 2

    canvas.paste(img_resized, (offset_x, offset_y), img_resized)

    # Convertir a RGB y guardar
    canvas_rgb = Image.new('RGB', (canvas_size, canvas_size), (255, 255, 255))
    canvas_rgb.paste(canvas, mask=canvas.split()[3])
    canvas_rgb.save(output_path, 'PNG', quality=95)

    print("Imagen estandarizada con exito:")
    print(f"   Dimensiones: 400 x 400 px")
    print(f"   Ubicacion  : {output_path}")
    return output_path

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Uso: python backend/scripts/standardize_image.py <ruta_imagen_entrada> [ruta_salida]")
        sys.exit(1)

    inp = sys.argv[1]
    outp = sys.argv[2] if len(sys.argv) > 2 else None
    standardize_image(inp, outp)
