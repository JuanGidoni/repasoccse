# Alternativas de práctica

Este archivo TSV contiene solo distractores no oficiales; la respuesta correcta procede siempre de CCSE26/PreguntasyRespuestas.md. Cada línea contiene el ID, una huella FNV-1a del enunciado y respuesta normalizados por el parser, y dos distractores separados por tabuladores.

Para cambiar preguntas: editar el Markdown, revisar que ambos distractores sean incorrectos para el nuevo enunciado y actualizar la huella con fingerprint de src/choices.ts. No añadir variantes o sinónimos de la respuesta correcta. Las pruebas comprueban cobertura, unicidad, coincidencia con la fuente y revisión obligatoria ante cambios.
