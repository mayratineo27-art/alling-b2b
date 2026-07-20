import { test, expect } from '@playwright/test';

test.describe('Flujo E2E de Checkout (Checkout & Payment Flow)', () => {

  test('TC_ALLING_E2E_002: Completar Formulario de Checkout y Proceder a Pago (RF-CHK-001)', async ({ page }) => {
    // 1. OBSERVAR: Es necesario tener ítems en el Formato Único para acceder al Checkout.
    // Primero, navegamos al catálogo y agregamos un producto.
    await page.goto('/productos');
    
    // Buscar y presionar el botón "Agregar a Formato Único" del primer producto (con timeout ampliado)
    const firstAddButton = page.getByRole('button', { name: 'Agregar a Formato Único' }).first();
    await expect(firstAddButton).toBeVisible({ timeout: 45000 });
    await firstAddButton.click();
    
    // Verificar que el producto fue agregado correctamente
    await expect(page.getByRole('button', { name: '¡Agregado ✓!' }).first()).toBeVisible({ timeout: 45000 });

    // 2. ANALIZAR: Navegar a la página de Checkout
    await page.goto('/checkout');

    // Esperar a que se renderice la página de checkout
    const checkoutTitle = page.getByRole('heading', { name: 'Checkout' });
    await expect(checkoutTitle).toBeVisible({ timeout: 45000 });

    // 3. ATRIBUIR & REGISTRAR: Llenar el campo DNI / RUC y la dirección de envío
    // Campo DNI/RUC
    const billingInput = page.locator('#billingId');
    await expect(billingInput).toBeVisible({ timeout: 45000 });
    await billingInput.fill('12345678');

    // Campo Dirección de envío (también requerido en el formulario)
    const addressInput = page.locator('#address');
    await expect(addressInput).toBeVisible({ timeout: 45000 });
    await addressInput.fill('Av. Siempre Viva 742, Lima');

    // 4. REGISTRAR & TOMAR DECISIONES: Simular el clic en el botón de pagar
    // El botón se ubica en el formulario con texto "Pagar ahora"
    const payButton = page.getByRole('button', { name: 'Pagar ahora' });
    await expect(payButton).toBeVisible({ timeout: 45000 });
    
    // Hacemos clic en el botón de pago (iniciando redirección o MercadoPago Mock/Sandbox)
    await payButton.click();

    // El estado cambia a "Procesando..." mientras procesa la API
    await expect(page.getByRole('button', { name: 'Procesando...' })).toBeVisible({ timeout: 45000 });

    // Esperar 5 segundos adicionales para que el video grabe el estado final de procesamiento
    await page.waitForTimeout(5000);
  });
});
