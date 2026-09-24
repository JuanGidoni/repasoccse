# Repaso CCSE 2026

Aplicación personal de estudio con React, TypeScript, Vite y Tailwind CSS. Los cinco archivos `CCSE26/Tarea1.md` a `Tarea5.md` son la única fuente de contenido y se conservan sin modificaciones.

## Arrancar

Requiere Node.js 22.12+ o 24 y npm.

```sh
npm install
npm run dev
```

Abrir la dirección local que indique Vite. En este equipo, si el acceso habitual a npm falla, usar `& 'C:\Program Files\nodejs\npm.cmd' run dev` desde PowerShell.

```sh
npm test
npm run build
npm run preview
```

## Funciones

- Estudiar: cinco tareas, navegación jerárquica por los encabezados originales, búsqueda de texto/preguntas, respuestas desplegables, secciones leídas y último punto consultado.
- Practicar: tandas aleatorias de 10, 20 o todas las preguntas, sin repetición dentro del intento; corrección inmediata y revisión final.
- Mi progreso: exámenes de 20 preguntas; 16 aciertos (80 %) desbloquean el examen siguiente. Intentos ilimitados. La lectura y práctica de todas las tareas siempre están disponibles. Criterio pedagógico propio, no simulacro oficial.
- Mis fallos: repaso de errores de las cinco tareas; un acierto retira la pregunta de pendientes, manteniendo el historial del intento.
- Guardado local versionado de intentos, respuestas, errores, mejores porcentajes por modo/tarea, tareas superadas, secciones leídas y último punto. No hay servidor ni cuenta. Un intento interrumpido no se reanuda ni cuenta como examen; las respuestas ya corregidas sí se conservan.

## Datos y corrección

`src/content.ts` importa los Markdown con Vite (`?raw`). Un cambio se refleja durante desarrollo; para producción hay que reconstruir. No existe un banco JSON duplicado.

Modelo: `Task → Unit (parentId, nivel, contenido Markdown, questionIds) → Question (id, prompt, answer, options, línea de origen)`. Los encabezados conservan su jerarquía. Las preguntas pertenecen al bloque de preguntas del documento: no se infiere una asociación temática que los archivos no proporcionan. Los bloques de repaso posteriores se conservan.

Formato admitido:

```md
## Categoría
### Unidad
Texto de estudio

1 (1001). Pregunta…

- Respuesta correcta.
```

También admite preguntas y respuestas rodeadas de `**`, como Tarea 5. Cada pregunta debe tener un identificador único de cuatro cifras, empezando por el número de tarea, y una respuesta en la siguiente línea no vacía como viñeta. IDs duplicados, respuestas ausentes o formatos ambiguos fallan explícitamente. Las pruebas verifican los 300 IDs actuales y cotejan cada respuesta con la línea literal del archivo. Si cambia deliberadamente la cantidad de preguntas, actualizar esa expectativa.

Los archivos contienen 120 + 36 + 24 + 36 + 84 preguntas. No contienen las alternativas originales: solo se ofrecen opciones verdadero/falso para esas preguntas. Las restantes usan respuesta escrita; no se inventan distractores. El campo `options` queda vacío donde faltan opciones.

La corrección es una comparación determinista: Unicode NFC, minúsculas, espacios normalizados y eliminación de puntuación final `. ! ? …`. Se conservan tildes, artículos, ceros iniciales y separadores decimales. No se aceptan sinónimos, respuestas aproximadas ni equivalencias semánticas: un texto conceptualmente equivalente puede contar como fallo. La interfaz explica esta limitación antes y durante el ejercicio. No interviene IA.

Discrepancias del material que NO se han corregido:

- Tarea 1, pregunta 1091: respuesta `60.` frente a `060` en la teoría. Se valida contra `60.`.
- Tarea 2: el encabezado menciona 120 preguntas, pero el archivo contiene 36. Los contadores se calculan al leer las preguntas.

Solo se ocultan marcadores de referencia de ChatGPT sin destino (`:chatgpt-content-reference{…}`) en la presentación; no se altera el archivo fuente. La app no certifica la actualidad ni el carácter oficial de estos resúmenes.

## Estructura

- `src/content.ts`: parser y carga de los cinco documentos.
- `src/engine.ts`: corrección, muestreo, resultados y validación de persistencia.
- `src/App.tsx`: navegación y modos de estudio.
- `src/style.css`: diseño responsive y Tailwind.
- `src/engine.test.ts`: integridad del banco y reglas del motor.

Configuración basada en las guías de [Vite](https://vite.dev/guide/) y [Tailwind para Vite](https://tailwindcss.com/docs/installation/using-vite).

## Pruebas en navegador

`npm run test:e2e` ejecuta tres recorridos en Microsoft Edge instalado: examen y desbloqueo, repaso y persistencia, lectura/búsqueda, diseño móvil, verdadero/falso y recuperación ante datos corruptos. Las capturas se guardan en `test-results/` (ignorado por Git). En equipos sin Edge, instalarlo o cambiar `channel` en `playwright.config.ts` e instalar el navegador de Playwright correspondiente.

Validación realizada: 9 pruebas del banco/motor y 3 recorridos de navegador aprobados; TypeScript y build de producción correctos; auditoría de dependencias sin vulnerabilidades. El archivo `package-lock.json` fija la instalación; `npm ci` permite reproducirla.
