import { test, expect } from '@playwright/test';

test.describe('Flujo E2E - Google OAuth, Checkout y Pago con Mercado Pago', () => {

  test('TC_ALLING_E2E_005: Iniciar Sesión con Google, Checkout y Redirección a Mercado Pago (RF-AUT-001, RF-CHK-001)', async ({ page }) => {
    // 1. OBSERVAR: Agregar un producto al catálogo como GUEST para tener carrito activo
    await page.goto('/productos');
    const addCartBtn = page.getByRole('button', { name: 'Agregar a Formato Único' }).first();
    await expect(addCartBtn).toBeVisible({ timeout: 45000 });
    await addCartBtn.click();
    await expect(page.getByRole('button', { name: '¡Agregado ✓!' }).first()).toBeVisible({ timeout: 45000 });

    // 2. ANALIZAR: Ir al login e iniciar sesión simulando Google OAuth
    await page.goto('/auth/login?test=true');
    const mockGoogleBtn = page.locator('#mock-google-login-btn');
    await expect(mockGoogleBtn).toBeVisible({ timeout: 30000 });
    await mockGoogleBtn.click();

    // Comprobar la redirección exitosa del rol CUSTOMER a su dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 30000 });

    // 3. ATRIBUIR & REGISTRAR: Ir al Checkout y completar el formulario de facturación
    await page.goto('/checkout');
    await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible({ timeout: 30000 });

    // Rellenar DNI/RUC
    const billingInput = page.locator('#billingId');
    await expect(billingInput).toBeVisible({ timeout: 30000 });
    await billingInput.fill('77889900');

    // Rellenar dirección de entrega
    const addressInput = page.locator('#address');
    await expect(addressInput).toBeVisible({ timeout: 30000 });
    await addressInput.fill('Jr. Huanta 456, Ayacucho');

    // 4. INFORMAR & TOMAR DECISIONES: Presionar "Pagar ahora" y verificar la redirección a Mercado Pago
    const payButton = page.getByRole('button', { name: 'Pagar ahora' });
    await expect(payButton).toBeVisible({ timeout: 30000 });
    await payButton.click();

    // Confirmar que el navegador es redirigido a la pasarela de Mercado Pago (sandbox o mock)
    await expect(page).toHaveURL(/.*mercadopago\.com.*/, { timeout: 45000 });

    // Esperar 5 segundos adicionales para que el video grabe el redireccionamiento completo a Mercado Pago
    await page.waitForTimeout(5000);
  });
});
