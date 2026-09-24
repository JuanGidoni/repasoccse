import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
const answers: Record<string, string> = {};
const rawBank = readFileSync('CCSE26/PreguntasyRespuestas.md', 'utf8').replace(/\*\*/g, '');
for (const m of rawBank.matchAll(/^(\d{4})\..+\r?\n\s*\r?\n- (.+)/gm)) answers[m[1]] = m[2].trim();
async function answer(page: Page, right: boolean) {
  const tag = await page.locator('.question-card .tag').innerText();
  const id = tag.match(/\d{4}/)![0];
  const expected = id.startsWith('2') ? answers[id].replace(/\.$/, '') : answers[id];
  await expect(page.locator('.question-card input')).toHaveCount(0);
  const choices = page.locator('.choice-option');
  await expect(choices).toHaveCount(id.startsWith('2') ? 2 : 3);
  if (right) await page.getByRole('button', { name: expected, exact: true }).click();
  else {
    for (const choice of await choices.all()) {
      if (await choice.getAttribute('aria-label') !== expected) { await choice.click(); break; }
    }
  }
  await expect(page.locator('.choice-option.correct')).toHaveCount(1);
  for (const choice of await choices.all()) await expect(choice).toBeDisabled();
  await expect(page.locator('.feedback')).toContainText(right ? 'Respuesta correcta' : 'Respuesta incorrecta');
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
  await expect(page.locator('.study-facts')).toBeVisible();
  await page.getByRole('button', { name: 'Aumentar tamaño del texto' }).click();
  await expect(page.locator('.study-content')).toHaveCSS('font-size', '18px');
  await page.getByRole('button', { name: 'Modo lectura', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Secciones del apunte' })).toBeHidden();
  await page.getByRole('button', { name: 'Ver índice', exact: true }).click();
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


test('tres opciones y respuesta correcta seleccionable en todas las tareas', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/');
  for (const n of [1, 3, 4, 5]) {
    await page.getByRole('navigation', { name: 'Tareas', exact: true }).getByRole('button').nth(n - 1).click();
    await page.getByRole('button', { name: 'Practicar', exact: false }).first().click();
    await page.getByLabel('Preguntas por intento').selectOption(String([120,36,24,36,84][n - 1]));
    await page.getByRole('button', { name: 'Comenzar práctica' }).click();
    const positions = new Set<number>();
    for (let i = 0; i < [120,36,24,36,84][n - 1]; i++) {
      const id = (await page.locator('.question-card .tag').innerText()).match(/\d{4}/)![0];
      const options = await page.locator('.choice-option').evaluateAll(elements => elements.map(el => el.getAttribute('aria-label')));
      positions.add(options.indexOf(answers[id]));
      if (i === 0 && n === 1) await page.screenshot({ path: 'test-results/multiple-choice.png', fullPage: true });
      await answer(page, true);
    }
    expect(positions.size).toBeGreaterThan(1);
    await expect(page.locator('.result-card')).toContainText('100 % de aciertos');
    await page.getByRole('button', { name: 'Volver a estudiar', exact: true }).click();
  }
});


test('repaso rápido, búsqueda, trampas y acceso a la práctica', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Repaso rápido', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Repaso ultrarrápido' })).toBeVisible();
  for (let n = 0; n < 5; n++) {
    await page.getByRole('navigation', { name: 'Tareas del repaso rápido' }).getByRole('button').nth(n).click();
    await expect(page.locator('.quick-block')).toHaveCount(2);
    await expect(page.locator('.quick-block.memory')).toContainText('Repasos1a5.md');
    await expect(page.locator('.quick-block.traps')).toContainText('Ojo con estas trampas');
  }
  await page.getByRole('button', { name: 'Trampas', exact: true }).click();
  await expect(page.locator('.quick-block')).toHaveCount(1);
  await page.getByLabel('Encuentra un dato').fill('Canarias');
  await expect(page.locator('.quick-block')).toContainText('una hora MENOS');
  await page.getByLabel('Encuentra un dato').fill('ninguna-coincidencia-zz');
  await expect(page.getByRole('status')).toContainText('No hay coincidencias');
  await page.getByLabel('Encuentra un dato').fill('');
  await page.getByRole('button', { name: 'Todo', exact: true }).click();
  await page.screenshot({ path: 'test-results/quick-desktop.png', fullPage: true });
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({ path: 'test-results/quick-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Practicar tarea 5' }).click();
  await expect(page.getByRole('heading', { name: 'Sociedad española', exact: true })).toBeVisible();
});

test('fragmento exacto en popup, discrepancia visible y cierre accesible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Tareas', exact: true }).getByRole('button').nth(4).click();
  await page.getByLabel('Buscar en esta tarea').fill('5059');
  await page.locator('.answer summary').click();
  const link = page.getByRole('link', { name: 'Consultar fuente · 5059', exact: false });
  await link.click();
  const dialog = page.getByRole('dialog', { name: 'Fuente de la pregunta 5059' });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('PreguntasyRespuestas.md');
  await expect(dialog.locator('pre')).toHaveText('5059. El teléfono gratuito para las víctimas de violencia de género es el…\n\n- 16.');
  await expect(dialog.locator('.source-warning')).toContainText('016.');
  await page.screenshot({path:'test-results/source-popup.png'});
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(link).toBeFocused();
  await page.setViewportSize({width:390,height:844});
  await link.click();
  await expect(dialog).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await dialog.getByRole('button', {name:'Cerrar fuente'}).click();
  await expect(dialog).toHaveCount(0);
});

test('consultar la fuente después de responder no cambia el intento ni la corrección', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', {name:'Practicar',exact:true}).click();
  await page.getByRole('button', {name:'Comenzar práctica'}).click();
  await expect(page.locator('.source-link')).toHaveCount(0);
  const id = (await page.locator('.question-card .tag').innerText()).match(/\d{4}/)![0];
  await page.getByRole('button',{name:answers[id],exact:true}).click();
  await page.getByRole('link',{name:/Consultar fuente/}).click();
  await expect(page.getByRole('dialog').locator('pre')).toContainText(answers[id]);
  await page.getByRole('button',{name:'Cerrar fuente'}).click();
  await expect(page.locator('.feedback')).toContainText('Respuesta correcta');
  await expect(page.locator('.quiz-progress')).toContainText('Pregunta 1 de 10');
  await page.getByRole('button',{name:'Siguiente pregunta'}).click();
  await expect(page.locator('.quiz-progress')).toContainText('Pregunta 2 de 10');
});

