# Optimización del CI Pipeline — Panel de Resultados Unificado

**Fecha:** 2026-03-17  
**Pipeline:** `.github/workflows/ci-pipeline.yml`  
**Versión:** 1.0  
**Autor:** Equipo de Ingeniería — Stefanini Applied AI

---

## Resumen Ejecutivo

Se realizó una optimización integral del flujo visual del CI Pipeline, consolidando **8 tarjetas informativas independientes** en un **único panel de resultados unificado** que se actualiza progresivamente conforme cada fase del pipeline finaliza. Esta mejora reduce la fragmentación de la información y brinda una experiencia más clara para clientes y operarios.

---

## Cambios Realizados

### 1. Tarjetas Individuales Eliminadas

Se eliminaron las siguientes secciones de `GITHUB_STEP_SUMMARY` que generaban tarjetas independientes:

| # | Tarjeta Eliminada |
|---|-------------------|
| 1 | SonarQube Backend (.NET) summary |
| 2 | SonarQube Frontend (React/Vite) summary |
| 3 | Backend Unit Tests (.NET) summary |
| 4 | Frontend Unit Tests (Jest) summary |
| 5 | Deploy Preview with Surge summary |
| 6 | Build and Quality Tests summary |
| 7 | Functional Tests - Web (AURA) summary |
| 8 | Pipeline Summary summary |

### 2. Panel de Resultados Unificado (Nuevo)

Se creó un **comentario de PR** que actúa como panel central de resultados. Características:

- **Progresivo**: Se crea al inicio del pipeline y cada job lo actualiza al finalizar
- **Dinámico**: Usa marcadores HTML (`<!-- section:nombre -->`) para que cada fase actualice solo su sección
- **Visual**: Emojis e iconografía consistente para identificar estados rápidamente
- **Sin referencias a tecnologías**: Los nombres de herramientas internas no se exponen al usuario final

### 3. Renombrado de Artefactos

| Nombre Anterior | Nombre Nuevo |
|-----------------|--------------|
| `backend-unit-test-results` | `backend-unit-test-report` |
| `frontend-unit-test-results` | `frontend-unit-test-report` |
| `integration-test-results` | `integration-test-report` |
| `security-test-results` | `security-test-report` |
| `aura-functional-report` | `functional-report` |

### 4. Artefacto Eliminado

- Se eliminó el artefacto `frontend-dist` (distribución de build del frontend) ya que no era consumido por ningún job downstream.

### 5. Eliminación de Referencias a Tecnologías

- Se removieron todas las menciones a "AURA", "Jest", ".NET", "React/Vite", "OWASP ZAP" de nombres de jobs, labels visibles y comentarios de PR.
- Las variables de entorno internas del framework de pruebas funcionales se mantienen sin cambios (son consumidas internamente).

### 6. Renombrado de Variables de Entorno

| Anterior | Nueva |
|----------|-------|
| `AURA_REPORT_DOMAIN` | `FUNCTIONAL_REPORT_DOMAIN` |
| `AURA_REPORT_URL` | `FUNCTIONAL_REPORT_URL` |

### 7. Job Eliminado

- Se eliminó el job `pipeline-summary` (resumen final). Su funcionalidad fue absorbida por el panel de resultados progresivo.

### 8. Nuevo Job Añadido

- `init-dashboard`: Se ejecuta primero, crea el esqueleto del panel de resultados en el PR con todas las secciones en estado "pendiente".

---

## URLs Dinámicas de SonarQube

Las URLs de los dashboards de SonarQube se construyen dinámicamente usando dos fuentes:

1. **Fuente primaria**: La URL reportada por el escáner de SonarQube (`report-task.txt` → `dashboardUrl`)
2. **Fuente de respaldo**: Construcción dinámica a partir del secret `SONAR_HOST_URL_APPLIED_AI_TEAM` + el project key

```
${SONAR_HOST_URL_APPLIED_AI_TEAM}/dashboard?id=applied-ai-team-sai3-backend
${SONAR_HOST_URL_APPLIED_AI_TEAM}/dashboard?id=applied-ai-team-sai3-frontend
```

Esto garantiza que los enlaces al análisis de calidad de código estén siempre disponibles, incluso si la tarea de análisis no genera `report-task.txt`.

---

## Flujo del Pipeline Actualizado

```
init-dashboard ──────────────────────────────────────────────┐
  │                                                          │
  ├── sonarqube-backend ──→ actualiza sección sonar-backend  │
  ├── sonarqube-frontend ──→ actualiza sección sonar-frontend│
  ├── backend-unit-tests ──→ actualiza sección unit-backend  │
  ├── frontend-unit-tests ──→ actualiza sección unit-frontend│
  ├── deploy-preview ──→ actualiza sección preview           │
  │     └── functional-tests-web ──→ actualiza sección       │
  │                                    functional            │
  └── build-and-quality-tests ──→ actualiza secciones        │
        (depende de unit tests)     integration + security   │
                                                             │
  teardown-preview (solo en PR closed) ──→ marca panel       │
                                           como cerrado      │
```

---

## Vista Previa del Panel de Resultados

A continuación se muestra cómo se presenta el panel de resultados una vez el pipeline ha finalizado completamente todas sus fases:

---

### Ejemplo: Panel Completo (todas las fases finalizadas)

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║            🚀 Panel de Resultados — CI Pipeline                  ║
║                                                                  ║
║     Pull Request #47 · Ejecución #156                            ║
║     Los resultados se actualizan automáticamente conforme        ║
║     cada fase del pipeline finaliza.                             ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🌐 Sitio Web — Previsualización del Pull Request               ║
║  ─────────────────────────────────────────────────               ║
║                                                                  ║
║  🟢 Sitio desplegado exitosamente                                ║
║                                                                  ║
║  🔗 Abrir sitio de previsualización                              ║
║     → https://pr-47-sai-app-3-0.surge.sh                        ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🔍 Análisis de Calidad de Código                                ║
║  ─────────────────────────────────                               ║
║                                                                  ║
║  ✅ Backend · Quality Gate Aprobado                               ║
║     🔗 Ver análisis en detalle                                   ║
║                                                                  ║
║  ✅ Frontend · Quality Gate Aprobado                              ║
║     🔗 Ver análisis en detalle                                   ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📊 Reportes de Pruebas                                         ║
║  ───────────────────────                                         ║
║                                                                  ║
║  ▼ 🧪 Pruebas Unitarias                                         ║
║  │                                                               ║
║  │ ✅ Backend · Pruebas completadas                               ║
║  │    📄 Ver reporte detallado                                   ║
║  │                                                               ║
║  │ ✅ Frontend · Pruebas completadas                              ║
║  │    📄 Ver reporte detallado                                   ║
║  │                                                               ║
║  ▼ 🔗 Pruebas de Integración                                    ║
║  │                                                               ║
║  │ ✅ Pruebas completadas exitosamente                            ║
║  │    📦 Resultados en artefacto integration-test-report         ║
║  │                                                               ║
║  ▼ 🛡️ Pruebas de Seguridad                                      ║
║  │                                                               ║
║  │ ✅ Pruebas de seguridad completadas                            ║
║  │    📄 Reporte de seguridad — Frontend                         ║
║  │    📄 Reporte de seguridad — API                              ║
║  │                                                               ║
║  ▼ ✅ Pruebas Funcionales                                        ║
║  │                                                               ║
║  │ ✅ Pruebas funcionales completadas                             ║
║  │    📄 Ver reporte de pruebas funcionales                      ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📦 Artefactos Descargables                                     ║
║  ──────────────────────────                                      ║
║                                                                  ║
║  📦 backend-unit-test-report    Pruebas unitarias — Backend      ║
║  📦 frontend-unit-test-report   Pruebas unitarias — Frontend     ║
║  📦 integration-test-report     Pruebas de integración           ║
║  📦 security-test-report        Pruebas de seguridad             ║
║  📦 functional-report           Pruebas funcionales              ║
║                                                                  ║
║  📥 Ir a la página de artefactos                                 ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🤖 Generado automáticamente por el pipeline de CI               ║
║     Ver ejecución completa                                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

### Ejemplo: Panel en Progreso (fase intermedia)

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║            🚀 Panel de Resultados — CI Pipeline                  ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🌐 Sitio Web — Previsualización del Pull Request               ║
║  🟢 Sitio desplegado exitosamente                                ║
║  🔗 Abrir sitio de previsualización                              ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🔍 Análisis de Calidad de Código                                ║
║  ✅ Backend · Quality Gate Aprobado · 🔗 Ver análisis            ║
║  🔲 Frontend · ⏳ Analizando código fuente...                     ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  📊 Reportes de Pruebas                                         ║
║                                                                  ║
║  🧪 Pruebas Unitarias                                           ║
║  ✅ Backend · Pruebas completadas · 📄 Ver reporte              ║
║  🔲 Frontend · ⏳ Ejecutando pruebas...                           ║
║                                                                  ║
║  🔗 Pruebas de Integración                                      ║
║  ⏳ Pendiente — se ejecutarán una vez finalicen las unitarias... ║
║                                                                  ║
║  🛡️ Pruebas de Seguridad                                        ║
║  ⏳ Pendiente — se ejecutarán una vez finalicen las unitarias... ║
║                                                                  ║
║  ✅ Pruebas Funcionales                                          ║
║  ⏳ Pendiente — se ejecutarán una vez el sitio esté disponible.. ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

### Ejemplo: Panel Cerrado (PR merged/closed)

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║            🚀 Panel de Resultados — CI Pipeline                  ║
║                                                                  ║
║     Pull Request #47 · Cerrado                                   ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  🔒 Los sitios de previsualización y reportes en línea han      ║
║     sido desactivados al cerrar este Pull Request.               ║
║                                                                  ║
║  📦 Los artefactos descargables permanecen disponibles en la    ║
║     pestaña de Actions del repositorio.                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Iconografía Utilizada

| Emoji | Significado |
|:-----:|-------------|
| 🚀 | Encabezado del panel |
| 🌐 | Sitio web de previsualización |
| 🔍 | Análisis de calidad de código |
| 📊 | Sección de reportes de pruebas |
| 🧪 | Pruebas unitarias |
| 🔗 | Pruebas de integración / Enlaces |
| 🛡️ | Pruebas de seguridad |
| ✅ | Pruebas funcionales / Estado aprobado |
| ❌ | Estado fallido |
| ⚠️ | Advertencia / No disponible |
| ⏳ | En progreso / Pendiente |
| 🔲 | En cola de ejecución |
| 🟢 | Despliegue exitoso |
| 📄 | Enlace a reporte |
| 📦 | Artefacto disponible |
| 📥 | Descarga de artefactos |
| 🔒 | Recursos desactivados |
| 🤖 | Generado automáticamente |

---

## Consideraciones Técnicas

### Actualizaciones Concurrentes

Los jobs del pipeline que se ejecutan en paralelo (SonarQube Backend/Frontend, Pruebas Unitarias Backend/Frontend, Deploy Preview) actualizan el panel de resultados de forma independiente. Cada uno actualiza únicamente su sección mediante marcadores HTML, minimizando el riesgo de conflictos.

### Mecanismo de Actualización

Cada job utiliza `actions/github-script@v8` con una función `updateDashboard()` que:

1. Busca el comentario del PR que contiene el marcador `<!-- ci-dashboard -->`
2. Localiza los delimitadores de sección (`<!-- section:nombre -->` / `<!-- /section:nombre -->`)
3. Reemplaza el contenido de la sección con los resultados actualizados
4. Escribe el comentario actualizado de vuelta

### Compatibilidad con Re-ejecuciones

Si el pipeline se re-ejecuta en el mismo PR, el job `init-dashboard` detecta el comentario existente y lo reemplaza con el nuevo esqueleto, reiniciando todas las secciones.
