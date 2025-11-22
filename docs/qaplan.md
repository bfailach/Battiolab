# Plan de Calidad (Resumen)

## Alcance
Documento resumen con métricas y propuestas para mejorar calidad del proyecto Battiolab.

## Modelos y estándares
- ISO/IEC 25010 (calidad del producto)
- ISO/IEC 25012 (calidad de datos)
- ISO/IEC 25020/21/22/23/24 (medición y métricas)

## Métricas propuestas (ejemplos)
- Coverage: objetivo 80% en lógica crítica (medir con jest coverage)
- Defect density: < 1 defect/KLOC por release
- Build success rate: 100% en rama `master`
- MTTR: < 48h para bugs críticos
- Tiempo de arranque: < 4s en máquinas de prueba
- Uso de memoria por ventana: < 200 MB (Electron)

## Prioridades de mejora
1. CI/CD (GitHub Actions) — ALTA
2. Pruebas unitarias/integración (Jest, testing-library) — ALTA
3. Seguridad (SCA, audit, secrets) — ALTA
4. Lint y formateo (ESLint + Prettier) — MEDIA
5. Observabilidad y profiling — MEDIA

## Artefactos añadidos
- `.github/workflows/nodejs-ci.yml` — pipeline CI básico
- `jest.config.js` — configuración de pruebas
- `.eslintrc.js`, `.prettierrc` — reglas de lint y formato
- `tests/main.test.js` — prueba ejemplo para `main.js`

## Próximos pasos
- Añadir pruebas de integración para endpoints críticos
- Añadir cobertura en CI y regla de calidad
- Añadir análisis SCA (npm audit en CI) y dependabot configurado

