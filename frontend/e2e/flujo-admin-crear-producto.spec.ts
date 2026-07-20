import { test, expect } from '@playwright/test';

test.describe('Flujo de Administrador (ADMIN) — Crear Producto', () => {

  test('TC_ALLING_E2E_003: Crear Producto desde el Panel Admin y Verificarlo en Catálogo (RF-ADM-005)', async ({ page }) => {
    // 1. OBSERVAR: Iniciar sesión como administrador
    await page.goto('/admin/login');
    await page.locator('#admin-email').fill('admin@alling.com');
    await page.locator('#admin-password').fill('admin123');
    await page.locator('#admin-login-btn').click();

    // Esperar redirección al panel principal de administración
    await expect(page).toHaveURL(/.*admin\/usuarios/, { timeout: 30000 });

    // 2. ANALIZAR: Navegar a Gestión de Productos
    await page.goto('/admin/productos');
    await expect(page.getByRole('heading', { name: 'Gobernanza del Catálogo' })).toBeVisible({ timeout: 30000 });

    // 3. ATRIBUIR: Abrir modal de creación de producto
    const newProductBtn = page.getByRole('button', { name: '+ Nuevo Producto' });
    await expect(newProductBtn).toBeVisible({ timeout: 30000 });
    await newProductBtn.click();

    // 4. REGISTRAR: Rellenar el formulario de producto
    // Generar un SKU único con timestamp para evitar colisión de claves únicas (BTN-ADM-004)
    const uniqueSku = `SKU-E2E-${Date.now()}`;
    const productName = `Cable Fibra Optica E2E-${Date.now()}`;

    // Rellenar campos del formulario (usando prefix form para evitar el input de búsqueda general)
    await page.locator('form input[type="text"]').nth(0).fill(uniqueSku); // SKU
    await page.locator('form input[type="text"]').nth(1).fill('AllingBrand'); // Marca
    await page.locator('form input[type="text"]').nth(2).fill(productName); // Nombre Comercial
    await page.locator('form input[type="number"]').nth(0).fill('150.50'); // Precio Público
    await page.locator('form input[type="number"]').nth(1).fill('50'); // Stock Inicial

    // Guardar el producto
    const submitBtn = page.getByRole('button', { name: 'Crear Producto' });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    // Esperar a que el toast o mensaje de éxito aparezca
    await expect(page.locator('text=Producto creado')).toBeVisible({ timeout: 30000 });

    // 5. INFORMAR & TOMAR DECISIONES: Verificar visualización del producto en la pantalla pública del cliente/guest
    await page.goto('/productos');
    await expect(page.getByRole('heading', { name: 'Filtros' })).toBeVisible({ timeout: 30000 });

    // Comprobar que el producto recién creado aparece listado
    await expect(page.locator(`text=${productName}`)).toBeVisible({ timeout: 45000 });

    // Esperar 5 segundos adicionales para que el video grabe los productos completamente cargados
    await page.waitForTimeout(5000);
  });
});
