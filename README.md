# Repaso CCSE 2026

Aplicación personal de estudio con React, TypeScript, Vite y Tailwind CSS. La teoría procede de `CCSE26/Tarea1.md` a `Tarea5.md`, las preguntas y su corrección exclusivamente de `CCSE26/PreguntasyRespuestas.md`, y el repaso rápido de `CCSE26/Repasos1a5.md`. Todos los Markdown se conservan sin modificaciones.

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

- Estudiar: cinco tareas, navegación jerárquica por los encabezados originales, búsqueda de texto/preguntas, respuestas desplegables, conceptos en bloques de lectura, tamaño de letra ajustable, modo lectura sin índice, secciones leídas y último punto consultado.
- Repaso rápido: pestañas por tarea, tarjetas compactas de conceptos, filtros de memorización/trampas, búsqueda por dato y tamaño de letra ajustable. Lee las diez secciones directamente de `Repasos1a5.md`.
- Consultar fuente: enlace en la corrección, respuestas desplegables e historial que abre un popup con el fragmento literal, archivo y líneas de `PreguntasyRespuestas.md`. Se cierra con Escape, el botón Cerrar o clic fuera; conserva el foco y el intento. Durante una pregunta solo aparece después de responder.
- Practicar: tandas aleatorias de 10, 20 o todas las preguntas, sin repetición dentro del intento; selección múltiple con opciones barajadas, corrección inmediata y revisión final.
- Mi progreso: exámenes de 20 preguntas; 16 aciertos (80 %) desbloquean el examen siguiente. Intentos ilimitados. La lectura y práctica de todas las tareas siempre están disponibles. Criterio pedagógico propio, no simulacro oficial.
- Mis fallos: repaso de errores de las cinco tareas; un acierto retira la pregunta de pendientes, manteniendo el historial del intento.
- Guardado local versionado de intentos, respuestas, errores, mejores porcentajes por modo/tarea, tareas superadas, secciones leídas y último punto. No hay servidor ni cuenta. Un intento interrumpido no se reanuda ni cuenta como examen; las respuestas ya corregidas sí se conservan.

## Datos y corrección

`src/content.ts`, `src/questionBank.ts` y `src/quickReviewData.ts` leen los Markdown con Vite (`?raw`). Un cambio se refleja durante desarrollo; para producción hay que reconstruir. No existe un banco JSON duplicado.

Modelo: `Task → Unit (parentId, nivel, contenido Markdown, questionIds) → Question (id, prompt, answer, options, línea de origen)`. Los encabezados conservan su jerarquía. Las preguntas pertenecen al bloque de preguntas del documento: no se infiere una asociación temática que los archivos no proporcionan. Los bloques de repaso posteriores se conservan.

Formato del banco central:

```md
1001. Pregunta…

- Respuesta correcta.
```

El parser del banco central admite preguntas y respuestas rodeadas de `**`. Las preguntas duplicadas en Tarea1–5.md solo sitúan el enlace en su sección de lectura y permiten advertir discrepancias; nunca validan las respuestas. La teoría también puede funcionar sin preguntas duplicadas; las nuevas preguntas del banco se sitúan en una sección propia. Cada pregunta debe tener un identificador único de cuatro cifras, empezando por el número de tarea, y una respuesta en la siguiente línea no vacía como viñeta. IDs duplicados, respuestas ausentes o formatos ambiguos fallan explícitamente. Las pruebas verifican los 300 IDs actuales y cotejan cada respuesta con la línea literal del archivo. Si cambia deliberadamente la cantidad de preguntas, actualizar esa expectativa.

El banco central contiene 120 + 36 + 24 + 36 + 84 preguntas. Es la única fuente de enunciados y respuestas tanto para práctica como para examen, repaso de fallos y preguntas del modo Estudiar. Las 36 preguntas de Tarea 2 usan verdadero/falso; las otras 264 ofrecen tres opciones y nunca piden escribir.

Los Markdown no incluyen opciones originales. Se han redactado dos distractores de práctica por pregunta en `src/data/distractors.tsv`, identificados como no oficiales en la interfaz. No se extraen respuestas al azar de otras preguntas, lo que podría introducir varias opciones verdaderas. La respuesta correcta se inserta siempre desde el Markdown. `src/choices.ts` comprueba que las opciones sean únicas y que una huella del enunciado/respuesta coincida con el contenido revisado. Si editas una pregunta en `PreguntasyRespuestas.md`, revisa sus dos distractores y actualiza su huella con `fingerprint(prompt, answer)`; si no coincide, esa pregunta se excluye de los intentos y aparece un aviso; el resto de la web sigue funcionando. La compilación de producción ejecuta las pruebas de integridad para impedir publicar una versión con alternativas pendientes. Esa huella detecta cambios, no certifica por sí sola la calidad semántica de las alternativas.

En cada intento se barajan las tres opciones una sola vez; su posición se mantiene hasta responder. Verdadero/falso conserva su orden convencional. Al responder se deshabilitan los botones, se marca la opción correcta y, si procede, la elección errónea. La validación compara de forma determinista la opción seleccionada con la respuesta del archivo. No interviene IA. La normalización tipográfica anterior se conserva para mantener compatibles los intentos y fallos guardados; no se cambian la clave ni el formato de localStorage.

`StudyContent.tsx` y `studyFormat.ts` presentan asociaciones independientes del tipo «concepto → dato» como listas de definiciones; conservan el texto, las listas anidadas y las advertencias. Las mejoras no requieren modificar los archivos Markdown. Los controles de lectura cambian la letra entre 15 y 22 px y permiten ocultar el índice.

Discrepancias del material que NO se han corregido:

- Pregunta 1091: se conserva la corrección del banco a `"060".` y se han revisado sus alternativas (112 y 016).
- Pregunta 5059: corregida a `"016".` según la indicación del usuario. La app conserva `016.` como texto.
- Tarea 2: el encabezado menciona 120 preguntas, pero el archivo contiene 36. Los contadores se calculan al leer las preguntas.

Solo se ocultan marcadores de referencia de ChatGPT sin destino (`:chatgpt-content-reference{…}`) en la presentación; no se altera el archivo fuente. La app no certifica la actualidad ni el carácter oficial de estos resúmenes.

## Estructura

- `src/content.ts`: teoría, secciones y asociación con el banco central.
- `src/questionBank.ts`: parser del banco único, referencias y fragmentos originales.
- `src/quickReviewData.ts` y `src/QuickReview.tsx`: datos y vista del repaso rápido.
- `src/SourceLink.tsx`: popup accesible con fragmentos del banco.
- `src/central.test.ts`: prioridad del banco central, referencias y cobertura del repaso.
- `src/engine.ts`: corrección, muestreo, resultados y validación de persistencia.
- `src/App.tsx`: navegación y modos de estudio.
- `src/style.css`: diseño responsive y Tailwind.
- `src/engine.test.ts`: integridad del banco y reglas del motor.
- `src/choices.ts` y `src/data/distractors.tsv`: alternativas de práctica y revisión de cambios.
- `src/StudyContent.tsx` y `src/studyFormat.ts`: presentación legible sin reescribir los apuntes.
- `src/format.test.ts`: integridad de alternativas y formato de lectura.

Configuración basada en las guías de [Vite](https://vite.dev/guide/) y [Tailwind para Vite](https://tailwindcss.com/docs/installation/using-vite).

## Pruebas en navegador

`npm run test:e2e` ejecuta siete recorridos en Microsoft Edge instalado: examen y desbloqueo, repaso y persistencia, lectura/búsqueda, diseño móvil, verdadero/falso, recuperación ante datos corruptos, los cinco repasos rápidos, búsqueda/filtros y apertura/cierre de fuentes. Las capturas se guardan en `test-results/` (ignorado por Git). En equipos sin Edge, instalarlo o cambiar `channel` en `playwright.config.ts` e instalar el navegador de Playwright correspondiente.

Validación realizada: 26 pruebas del banco/motor/formato y 7 recorridos de navegador (incluyen responder las 264 preguntas de tres opciones) aprobados; TypeScript y build de producción correctos; auditoría de dependencias sin vulnerabilidades. El archivo `package-lock.json` fija la instalación; `npm ci` permite reproducirla.

Las respuestas numéricas entre comillas, como `"060".` y `"016".`, se interpretan como cadenas conservando los ceros; solo se retiran las comillas de protección. El popup mantiene el fragmento literal. La compilación ejecuta las pruebas antes de generar la web, para que un banco inválido nunca sustituya una publicación funcional.
