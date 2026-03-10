# Applied AI Automation - SauceDemo Login Automation

Proyecto de automatización web utilizando BDD/Gherkin con StageHand para automatizar procesos en SauceDemo.

## 📋 Requisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Chrome instalado (si ejecutas localmente)
- API Key para el modelo de IA seleccionado (Gemini, Perplexity u Ollama)

## 🚀 Instalación

1. **Instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**

Crea un archivo `.env` en la raíz del proyecto basándote en `env.example.txt`:

```env
# Selecciona el proveedor de IA (gemini, perplexity, ollama)
MODEL_PROVIDER=gemini

# Configura la API key según el proveedor seleccionado
GEMINI_API_KEY=tu_gemini_api_key
# O para Perplexity:
# PERPLEXITY_API_KEY=tu_perplexity_key
# O para Ollama (local, no requiere API key):
# MODEL_PROVIDER=ollama

ENV=LOCAL
```

**Nota importante**: No incluyas espacios alrededor del `=` en el archivo `.env`. Usa:
- ✅ Correcto: `GEMINI_API_KEY=tu_api_key`
- ❌ Incorrecto: `GEMINI_API_KEY = tu_api_key` (con espacios)

**Obtén API keys desde:**
- **Gemini**: https://aistudio.google.com/app/apikey
- **Perplexity**: https://www.perplexity.ai/settings/api
- **Ollama**: No requiere API key (ejecución local)

**📖 Para más información sobre configuración de modelos, consulta:** [CONFIGURACION_MODELOS_IA.md](./CONFIGURACION_MODELOS_IA.md)

## 🎯 Uso

### Ejecutar tests:

```bash
# Ejecutar todos los tests
npm start
npm test

# Ejecutar un test específico
npm start HomeTest
npm test HomeTest

# Ejecutar todos los tests explícitamente
npm run test:all

# Listar tests disponibles
npm run test:list
```

### Modo desarrollo (con recarga automática):

```bash
npm run dev
```

### Compilar TypeScript:

```bash
npm run build
```

## 📁 Estructura del Proyecto

```
applied-ai-automation/
├── src/
│   ├── configs/
│   │   ├── StagehandConfig.ts      # Configuración abstraída del framework
│   │   ├── AIModelConfig.ts        # Configuración de modelos de IA
│   │   └── AutomationClient.ts     # Cliente de automatización
│   ├── features/
│   │   └── home.feature            # Vista Home de Tu Crédito Online
│   ├── steps/
│   │   ├── home.steps.ts           # Pasos para vista Home
│   │   └── common.steps.ts         # Pasos comunes
│   ├── gherkin/
│   │   ├── GherkinParser.ts        # Parser de archivos .feature
│   │   ├── GherkinExecutor.ts      # Ejecutor de escenarios
│   │   └── StepRegistry.ts         # Registro de pasos
│   ├── hooks/
│   │   └── ReportGenerator.ts      # Sistema de reportes avanzado
│   ├── actions/
│   │   └── WebActions.ts           # Acciones reutilizables (Page Objects)
│   ├── constants/
│   │   └── LoginCredentials.ts     # Solo valores compartidos (URLs base)
│   └── tests/
│       └── HomeTest.ts             # Test que ejecuta home.feature (Tu Crédito Online)
├── reports/                        # Reportes generados (se crea automáticamente)
│   ├── screenshots/                # Capturas de cada paso
│   └── *.html                      # Reportes HTML
├── dist/                           # Archivos compilados (generados)
├── package.json                    # Dependencias y scripts
├── tsconfig.json                   # Configuración de TypeScript
├── env.example.txt                 # Ejemplo de variables de entorno
└── README.md                       # Este archivo
```

## 🏗️ Arquitectura BDD/Gherkin

### Principios de Diseño

1. **BDD (Behavior Driven Development)**: Tests escritos en Gherkin (lenguaje natural)
2. **Single Source of Truth**: Instrucciones y valores de prueba SOLO en archivos `.feature`
3. **Separación de Responsabilidades**: Cada carpeta tiene un propósito específico
4. **Reutilización**: Los pasos pueden ser reutilizados por múltiples tests
5. **Page Object Model**: Lógica de interacción en `actions/` y `steps/`

### Componentes Principales

#### `features/` - Archivos Gherkin (ÚNICA FUENTE DE VERDAD)
- **home.feature**: Escenarios en Gherkin para la vista Home de Tu Crédito Online
- Contiene TODAS las instrucciones (el texto del paso ES la instrucción)

#### `steps/` - Definiciones de Pasos Reutilizables
- **home.steps.ts**: Pasos específicos para vista Home (cambio de idioma)
- **common.steps.ts**: Pasos comunes (navegación, etc.)
- Generan instrucciones directamente desde el texto del paso Gherkin

#### `gherkin/` - Motor de Ejecución
- **GherkinParser.ts**: Parsea archivos `.feature`
- **GherkinExecutor.ts**: Ejecuta los escenarios
- **StepRegistry.ts**: Registro centralizado de pasos

#### `actions/` - Page Objects
- **WebActions.ts**: Métodos genéricos de interacción web
- Lógica de interacción reutilizable

#### `constants/` - Valores Compartidos
- **HomeConstants.ts**: URLs base de Tu Crédito Online y títulos de secciones

#### `hooks/` - Sistema de Reportes
- **ReportGenerator.ts**: Genera reportes HTML profesionales estilo Serenity BDD
- Capturas automáticas en cada paso
- Gráficos y métricas visuales

#### `tests/` - Tests
- **HomeTest.ts**: Test que ejecuta home.feature para la vista Home de Tu Crédito Online (cambio de idioma)

## 🔧 Funcionalidades

El test `HomeTest.ts` ejecuta el archivo `home.feature` que contiene:

1. **Background**: Inicializa el navegador
2. **Scenarios**: Escenario de cambio de idioma a inglés en la vista home
3. **Reporte**: Genera reporte completo con capturas y métricas

## 📊 Sistema de Reportes

Cada ejecución genera:

- **Reporte HTML**: Visual estilo Serenity BDD con gráficos interactivos
- **Reporte JSON**: Datos estructurados para procesamiento
- **Capturas**: Screenshot de cada paso ejecutado
- **Métricas**: Resumen de pasos exitosos, fallidos y duración
- **Gráficos**: Pie charts, bar charts y coverage charts
- **Tablas interactivas**: Con filtrado y búsqueda usando DataTables

Los reportes se guardan en la carpeta `reports/`.

## 🎨 Convenciones de Código

- **CamelCase** para nombres de archivos, variables, funciones y clases
- TypeScript con tipos estrictos
- Comentarios descriptivos en español
- Manejo de errores robusto
- BDD/Gherkin para definir tests
- Sin duplicación de instrucciones o valores

## 🔑 Tu Crédito Online

La URL de la aplicación está definida en `constants/HomeConstants.ts`:

- **BASE_URL**: http://18.217.121.166:92/

## 🐛 Solución de Problemas

### Error: "Quota exceeded" / "Cuota excedida"
**Síntoma**: `You exceeded your current quota, please check your plan and billing details`

**Soluciones**:
1. **Espera unos minutos** - Las cuotas gratuitas se renuevan periódicamente
2. **Verifica tu uso** en: https://ai.dev/rate-limit
3. **Usa una API key diferente** si tienes acceso a múltiples cuentas
4. **Consulta** `SOLUCION_ERRORES_API.md` para más detalles

### Error: "API Key no encontrada" o "API key inválida"
- Verifica que el archivo `.env` existe y contiene `GEMINI_API_KEY` o `GOOGLE_API_KEY`
- Asegúrate de que la API key no sea `your_google_api_key_here`
- Obtén una nueva API key desde: https://aistudio.google.com/app/apikey
- Verifica que la API de Gemini esté habilitada en Google Cloud Console

### Error: "Chrome no encontrado" (modo LOCAL)
- Instala Chrome en tu sistema
- Asegúrate de que Chrome está en el PATH del sistema

### Error: "Stagehand no ha sido inicializado"
- Verifica que llamas a `initialize()` antes de usar el cliente
- Revisa los logs para más detalles del error

### Error: "Step definition no encontrada"
- Verifica que el paso está registrado en `gherkin/StepRegistry.ts`
- Asegúrate de que el texto del paso coincide exactamente con el registro

### Documentación de Errores
Para más información sobre errores comunes, consulta:
- [SOLUCION_ERRORES_API.md](./SOLUCION_ERRORES_API.md) - Guía completa de solución de errores

## 📝 Notas

- El proyecto usa **BDD/Gherkin** para definir tests en lenguaje natural
- Las instrucciones están SOLO en los archivos `.feature` (no duplicadas)
- Los valores de prueba están en los `Examples` del `.feature` (no en constants)
- Los pasos son reutilizables entre diferentes tests
- El proyecto soporta múltiples modelos de IA: Gemini, Perplexity y Ollama
- Puedes cambiar de modelo configurando `MODEL_PROVIDER` en el archivo `.env`
- Las acciones se realizan usando lenguaje natural a través de StageHand
- Los reportes se generan automáticamente en cada ejecución

## 📚 Documentación Adicional

- [BDD_STRUCTURE.md](./src/BDD_STRUCTURE.md) - Guía completa de la estructura BDD/Gherkin
- [REFACTORING_SUMMARY.md](./src/REFACTORING_SUMMARY.md) - Resumen de refactorización y eliminación de duplicaciones
- [CONFIGURACION_MODELOS_IA.md](./CONFIGURACION_MODELOS_IA.md) - Guía completa de configuración de modelos de IA
- [SOLUCION_ERRORES_API.md](./SOLUCION_ERRORES_API.md) - Guía completa para solucionar errores de API

## 📄 Licencia

ISC
