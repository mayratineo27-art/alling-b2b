import { test, expect } from '@playwright/test';

test.describe('Flujo E2E de Invitado (GUEST) — Alling B2B', () => {
  
  test('TC_ALLING_E2E_001: Navegación del Catálogo y Adición de Producto a Formato Único (RF-CAT-001, RF-FU-002)', async ({ page }) => {
    // 1. OBSERVAR: Navegar al catálogo público
    await page.goto('/productos');
    
    // Verificar que la vista de filtros laterales está visible
    await expect(page.getByRole('heading', { name: 'Filtros' })).toBeVisible({ timeout: 45000 });

    // 2. ANALIZAR & ATRIBUIR: Buscar el primer producto disponible
    // Esperamos a que los productos se carguen y se renderice el botón "Agregar a Formato Único" (con un timeout ampliado para APIs lentas/cold starts)
    const firstAddButton = page.getByRole('button', { name: 'Agregar a Formato Único' }).first();
    await expect(firstAddButton).toBeVisible({ timeout: 45000 });

    // Verificar que el badge del carrito no tenga productos inicialmente o no se muestre
    const cartButton = page.locator('button[aria-label="Mi formato único"]');
    await expect(cartButton).toBeVisible({ timeout: 45000 });
    
    // 3. REGISTRAR: Simular el clic en el botón de agregar
    await firstAddButton.click();

    // El botón debería cambiar a estado de carga y luego a éxito ("¡Agregado ✓!")
    await expect(page.getByRole('button', { name: '¡Agregado ✓!' }).first()).toBeVisible({ timeout: 45000 });

    // Verificar que el contador del badge en el carrito aumente y sea visible
    const cartBadge = cartButton.locator('span');
    await expect(cartBadge).toBeVisible({ timeout: 45000 });
    
    const countText = await cartBadge.innerText();
    const cartCount = parseInt(countText, 10);
    expect(cartCount).toBeGreaterThan(0);
  });
});
