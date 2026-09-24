import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const answers: Record<string, string> = {};
for (let n = 1; n <= 5; n++) {
  const raw = readFileSync(`CCSE26/Tarea${n}.md`, 'utf8').replace(/\*\*/g, '');
  for (const m of raw.matchAll(/^\d+ \((\d{4})\)\..+\r?\n\s*\r?\n- (.+)/gm)) answers[m[1]] = m[2].trim();
}
async function answer(page: Page, right: boolean) {
  const tag = await page.locator('.question-card .tag').innerText();
  const id = tag.match(/\d{4}/)![0];
  if (id.startsWith('2')) {
    const expected = answers[id].replace(/\.$/, '');
    await page.getByRole('button', { name: right ? expected : expected === 'Verdadero' ? 'Falso' : 'Verdadero', exact: true }).click();
  } else {
    await page.getByLabel('Tu respuesta', { exact: true }).fill(right ? answers[id] : 'respuesta equivocada');
    await page.getByRole('button', { name: 'Comprobar respuesta' }).click();
  }
  await expect(page.locator('.feedback')).toContainText(right ? 'Respuesta correcta' : 'No coincide');
  await page.getByRole('button', { name: /Siguiente pregunta|Ver resultado/ }).click();
}
test('examen, desbloqueo, repaso de fallos y persistencia real', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Mi progreso', exact: false }).click();
  await page.getByRole('button', { name: 'Comenzar examen' }).click();
  for (let i = 0; i < 20; i++) await answer(page, i < 16);
  await expect(page.getByText('Tarea superada. La tarea 2 está desbloqueada.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Mi progreso', exact: false }).click();
  await expect(page.locator('.journey-step').nth(1)).toContainText('Disponible');
  await expect(page.locator('.history-row')).toContainText('16/20');
  await page.getByRole('button', { name: /Mis fallos/ }).click();
  await expect(page.getByRole('heading', { name: '4 preguntas pendientes' })).toBeVisible();
  await page.getByRole('button', { name: /Repasar hasta/ }).click();
  for (let i = 0; i < 4; i++) await answer(page, true);
  await page.getByRole('button', { name: 'Repasar mis fallos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sin fallos pendientes' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('lectura, búsqueda, último punto y responsive sin desbordamientos', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Secciones del apunte' }).getByRole('button', { name: /1\. España y Constitución/ }).click();
  await page.getByRole('button', { name: 'Marcar leído', exact: true }).click();
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.reload();
  await expect(page.getByRole('button', { name: '✓ Leído', exact: true })).toBeVisible();
  await page.getByLabel('Buscar en esta tarea').fill('1091');
  await page.locator('.answer summary').click();
  await expect(page.locator('.answer p')).toContainText('60.');
  await page.getByLabel('Buscar en esta tarea').fill('zzzzzzzzz');
  await expect(page.getByText('0 secciones y 0 preguntas encontradas')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Buscar en esta tarea').fill('');
  await expect(page.getByLabel('Ir a una sección')).toBeVisible();
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Practicar', exact: false }).first().click();
  await page.getByRole('button', { name: 'Comenzar práctica' }).click();
  await page.getByRole('button', { name: 'Salir del intento' }).click();
  await page.getByRole('button', { name: 'Seguir aquí' }).click();
  await expect(page.locator('.question-card')).toBeVisible();
});
test('verdadero/falso, tarea bloqueada y almacenamiento corrupto', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Tareas', exact: true }).getByRole('button').nth(1).click();
  await page.getByRole('button', { name: 'Mi progreso', exact: false }).click();
  await expect(page.getByRole('button', { name: 'Supera antes la tarea 1' })).toBeDisabled();
  await page.getByRole('button', { name: 'Practicar', exact: false }).first().click();
  await page.getByRole('button', { name: 'Comenzar práctica' }).click();
  await answer(page, true);
  await page.getByRole('button', { name: 'Salir del intento' }).click();
  await page.getByRole('button', { name: 'Salir', exact: true }).click();
  await page.evaluate(() => localStorage.setItem('repasoccse.v1', '{invalid'));
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('No se pudo leer');
  expect(await page.evaluate(() => localStorage.getItem('repasoccse.v1'))).toBe('{invalid');
});

