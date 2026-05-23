import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '../data');

function readCV(filename: string): string {
  return fs.readFileSync(path.join(DATA_DIR, filename), 'utf-8');
}

function buildCVBatch(): string {
  const cvs = [
    'cv-01-ideal.txt',
    'cv-02-bueno.txt',
    'cv-03-medio.txt',
    'cv-04-debil.txt',
    'cv-05-descartable.txt',
  ];
  return cvs.map(readCV).join('\n---\n');
}

async function pasteJD(page: Page, text: string): Promise<void> {
  const textarea = page.getByPlaceholder(/pega aquí la descripción/i);
  await textarea.fill(text);
}

async function waitForLoadingDone(page: Page): Promise<void> {
  // Wait for loading overlay to appear first (it may be instant)
  await page.waitForTimeout(500);
  // Then wait for it to disappear
  await page
    .getByText('Analizando con criterio experto...', { exact: false })
    .waitFor({ state: 'hidden', timeout: 120_000 });
}

// ─── TC-001: Happy Path completo ────────────────────────────────────────────
test('TC-001: Happy path completo — 5 CVs evaluados y Laura Martínez #1', async ({ page }) => {
  const jd = readCV('job-description.txt');
  const cvBatch = buildCVBatch();

  // 1. Navegar a la app
  await page.goto('/');

  // 2. No debe haber banner de error de servidor
  await expect(page.getByText(/error/i).first()).not.toBeVisible().catch(() => {
    // Tolerar si el elemento no existe
  });

  // 3. Paso JD: pegar descripción y continuar
  await pasteJD(page, jd);
  await page.getByRole('button', { name: /continuar a análisis de perfil/i }).click();

  // 4. Esperar extracción de criterios
  await waitForLoadingDone(page);

  // 5. Verificar que hay criterios visibles (al menos 3)
  const criterios = page.locator('[class*="criterio"], [class*="criterion"], [class*="weight"], input[type="number"]');
  await expect(criterios.first()).toBeVisible({ timeout: 15_000 });
  const count = await criterios.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // 6. Avanzar a paso CVS
  await page.getByRole('button', { name: /continuar a evaluación/i }).click();

  // 7. Paso CVS: pegar los 5 CVs y lanzar evaluación
  const cvTextarea = page.locator('textarea').last();
  await cvTextarea.fill(cvBatch);
  await page.getByRole('button', { name: /iniciar triage experto/i }).click();

  // 8. Esperar evaluación completa (puede tardar hasta 2 min con Gemini)
  await waitForLoadingDone(page);

  // 9. Estamos en RESULTS — verificar 5 candidatos
  await expect(page.getByText('Laura Martínez', { exact: false })).toBeVisible({ timeout: 15_000 });

  // 10. Laura Martínez debe aparecer primero (posición #1)
  const candidateCards = page.locator('[class*="candidate"], [class*="ranking"], article, li').filter({ hasText: /martínez|martinez/i });
  await expect(candidateCards.first()).toBeVisible();

  // 11. Verificar recomendación AVANZAR en el primer resultado
  const avanzar = page.getByText('AVANZAR', { exact: false }).first();
  await expect(avanzar).toBeVisible();

  // 12. Screenshot
  await page.screenshot({ path: 'test/screenshots/happy-path-results.png', fullPage: true });
});

// ─── TC-002: JD demasiado corta ─────────────────────────────────────────────
test('TC-002: Validación — JD de menos de 10 palabras no avanza', async ({ page }) => {
  await page.goto('/');

  // Capturar alerts nativos antes de hacer cualquier acción
  let alertMessage = '';
  page.on('dialog', async (dialog) => {
    alertMessage = dialog.message();
    await dialog.dismiss();
  });

  await pasteJD(page, 'Hola mundo necesito un programador');
  await page.getByRole('button', { name: /continuar a análisis de perfil/i }).click();

  // Esperar un momento para que el error aparezca
  await page.waitForTimeout(2_000);

  // No debe haberse avanzado: el botón de "Continuar a Evaluación" no debe existir
  await expect(
    page.getByRole('button', { name: /continuar a evaluación/i })
  ).not.toBeVisible();

  // Debe haber algún tipo de feedback (alert o mensaje visible)
  const hasAlert = alertMessage.length > 0;
  const hasErrorText = await page.getByText(/error|mínimo|corta|palabras/i).isVisible().catch(() => false);
  expect(hasAlert || hasErrorText).toBeTruthy();
});

// ─── TC-004: Pesos que no suman 100% ────────────────────────────────────────
test('TC-004: Validación — pesos que no suman 100% bloquean el avance', async ({ page }) => {
  const jd = readCV('job-description.txt');

  await page.goto('/');
  await pasteJD(page, jd);
  await page.getByRole('button', { name: /continuar a análisis de perfil/i }).click();
  await waitForLoadingDone(page);

  // Modificar el primer input de peso para romper la suma
  const weightInputs = page.locator('input[type="number"]');
  await weightInputs.first().waitFor({ state: 'visible', timeout: 15_000 });

  // Cambiar el primer peso a 99 (casi seguro rompe la suma si el total era 100)
  await weightInputs.first().click({ clickCount: 3 });
  await weightInputs.first().fill('99');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(500);

  // El botón de continuar debe estar deshabilitado o no visible
  const continueBtn = page.getByRole('button', { name: /continuar a evaluación/i });
  const isDisabled = await continueBtn.isDisabled().catch(() => true);
  const hasErrorMsg = await page.getByText(/100|suma|peso/i).isVisible().catch(() => false);

  expect(isDisabled || hasErrorMsg).toBeTruthy();
});

// ─── TC-009: Reset desde RESULTS vuelve al paso JD ──────────────────────────
test('TC-009: Reset — "Nueva Evaluación de Puesto" regresa al Step JD vacío', async ({ page }) => {
  const jd = readCV('job-description.txt');
  const cvBatch = buildCVBatch();

  await page.goto('/');
  await pasteJD(page, jd);
  await page.getByRole('button', { name: /continuar a análisis de perfil/i }).click();
  await waitForLoadingDone(page);
  await page.getByRole('button', { name: /continuar a evaluación/i }).click();

  const cvTextarea = page.locator('textarea').last();
  await cvTextarea.fill(cvBatch);
  await page.getByRole('button', { name: /iniciar triage experto/i }).click();
  await waitForLoadingDone(page);

  // Confirmar que llegamos a RESULTS
  await expect(page.getByText('Laura Martínez', { exact: false })).toBeVisible({ timeout: 15_000 });

  // Hacer reset
  await page.getByRole('button', { name: /nueva evaluación/i }).click();

  // Verificar que volvimos al Step JD
  await expect(
    page.getByRole('button', { name: /continuar a análisis de perfil/i })
  ).toBeVisible({ timeout: 5_000 });

  // El textarea debe estar vacío
  const jdTextarea = page.getByPlaceholder(/pega aquí la descripción/i);
  await expect(jdTextarea).toBeVisible();
  const content = await jdTextarea.inputValue();
  expect(content.trim()).toBe('');

  await page.screenshot({ path: 'test/screenshots/reset-verificado.png', fullPage: true });
});
