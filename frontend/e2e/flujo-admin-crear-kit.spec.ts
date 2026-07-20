import { test, expect } from '@playwright/test';

test.describe('Flujo de Administrador (ADMIN) — Crear Kit', () => {

  test('TC_ALLING_E2E_004: Crear Kit desde el Panel Admin y Verificar en Pantalla de Kits (RF-ADM-009)', async ({ page }) => {
    // 1. OBSERVAR: Iniciar sesión como administrador
    await page.goto('/admin/login');
    await page.locator('#admin-email').fill('admin@alling.com');
    await page.locator('#admin-password').fill('admin123');
    await page.locator('#admin-login-btn').click();

    // Esperar redirección al panel principal
    await expect(page).toHaveURL(/.*admin\/usuarios/, { timeout: 30000 });

    // 2. ANALIZAR: Navegar a Gestión de Kits
    await page.goto('/admin/kits');
    await expect(page.getByRole('heading', { name: 'Gestión de Kits B2B' })).toBeVisible({ timeout: 30000 });

    // 3. ATRIBUIR: Abrir constructor de Kits
    const newKitBtn = page.getByRole('button', { name: '+ Nuevo Kit Personalizado' });
    await expect(newKitBtn).toBeVisible({ timeout: 30000 });
    await newKitBtn.click();

    // 4. REGISTRAR: Rellenar el formulario de creación de Kit
    const uniqueKitName = `Kit FTTH E2E-${Date.now()}`;
    await page.getByPlaceholder('Ej. Kit Abonado Fibra Óptica').fill(uniqueKitName);
    await page.getByPlaceholder('Propósito, velocidad, etc.').fill('Kit para instalaciones rápidas domiciliarias - Test E2E');

    // Agregar al menos 2 componentes de la lista de candidatos en la derecha
    // Hacemos clic en el botón "+ Agregar" de los dos primeros productos disponibles (mínimo 2 por BTN-ADM-009)
    const addButtons = page.getByRole('button', { name: '+ Agregar' });
    await expect(addButtons.first()).toBeVisible({ timeout: 30000 });
    await addButtons.nth(0).click();
    await addButtons.nth(1).click();

    // Guardar el kit
    const saveKitBtn = page.getByRole('button', { name: 'Confirmar y Guardar Kit' });
    await expect(saveKitBtn).toBeVisible();
    await saveKitBtn.click();

    // Esperar a que el kit se guarde (el modal se cierra y aparece el toast de éxito)
    await expect(page.locator('text=Kit creado exitosamente')).toBeVisible({ timeout: 30000 });

    // 5. INFORMAR & TOMAR DECISIONES: Verificar visualización del kit en la pantalla pública del cliente o guest
    await page.goto('/kits');
    await expect(page.getByRole('heading', { name: 'Kits Pre-armados' })).toBeVisible({ timeout: 30000 });

    // Comprobar que el kit recién creado aparece listado en las tarjetas públicas
    await expect(page.locator(`text=${uniqueKitName}`)).toBeVisible({ timeout: 45000 });

    // Esperar 5 segundos adicionales para que el video grabe las tarjetas completamente cargadas
    await page.waitForTimeout(5000);
  });
});
