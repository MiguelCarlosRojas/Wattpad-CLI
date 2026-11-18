# Wattpad CLI — AI Writing Studio (v1.1.0)

> **Terminal User Interface (TUI) profesional y conversacional de nueva generación para escritores, construida con TypeScript estricto y Bun, conectada al backend cloud en Render (`https://wattpad-cli.onrender.com`), con persistencia remota en PostgreSQL y co-escritura con IA.**

**Repositorio oficial:** https://github.com/MiguelCarlosRojas/Wattpad-CLI  
**Backend cloud:** https://wattpad-cli.onrender.com  

Inspirada directamente en la experiencia de usuario, interacción conversacional, diseño tipográfico y estética minimalista de **Google Antigravity CLI**, **Claude Code**, **Grok CLI** y **ChatGPT CLI**.

---

## 🎨 Nuevo Concepto: AI Writing Studio

1. **Diseño Minimalista y Elegante**:
   - Paleta oficial con **Naranja Wattpad (`#FF6122`)** como acento elegante sobre superficies oscuras profundas (`#0D1117`, `#151A21`).
   - Jerarquía visual limpia mediante espacios, contrastes y tipografía cuidada sin recuadros toscos ni dashboards sobrecargados.
   - **Pantalla de Bienvenida Creativa**: Marca sutil, bienvenida inspiradora, acciones rápidas y proyectos recientes reales.
2. **Flujo Conversacional & Comandos Slash**:
   - Entrada de lenguaje natural directa o comandos contextuales con `/` (`/story`, `/chapters`, `/models`, `/sync`, `/publish`).
   - Menú de sugerencias flotante con autocompletado en tiempo real (`Tab`) y selector fino (`›`).
3. **Dos Modos de Renderizado**:
   - **Modo Full Screen**: Experiencia inmersiva en el Alternate Screen Buffer (`\x1b[?1049h`), restaurando la consola limpiamente al salir (`/mode fullscreen`).
   - **Modo Inline**: Conversación integrada fluidamente en el scrollback normal de la terminal (`/mode inline`).
4. **Soporte Multitema**:
   - `dark` (estudio nocturno por defecto).
   - `light` (modo claro minimalista).
   - `tokyo-night` (paleta moderna azul/naranja).
   - `terminal` (fallback monocromático ANSI estándar).
5. **Aislamiento Total de Entorno**:
   - Ejecución transparente desde cualquier directorio (`C:\Users\...`, `Documents`, etc.) sin interferencia de archivos `.env` externos ni ruido de consola.
   - Configuración oficial del usuario persistida de forma segura en `%USERPROFILE%/.wattpad-cli/config.json`.

---

## 🚀 Instalación Oficial

### Método 1 — Windows (PowerShell 5.1 / 7+)

```powershell
irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex
```

### Método 2 — Linux y macOS

```bash
curl -fsSL https://wattpad-cli.onrender.com/cli/install.sh | bash
```

### Método 3 — NPM (Multiplataforma)

```bash
npm install -g @wattpad/cli
```

Después, inicia tu estudio creativo desde cualquier terminal:

```bash
wattpad
```

---

## 🛠️ Estructura del Proyecto

```text
wattpad-cli/
├── bin/
│   ├── wattpad.cjs         # Runner global para distribución vía npm
│   ├── wattpad             # Launcher para shells Unix/Linux
│   └── wattpad.cmd         # Launcher para consola Windows
├── docs/
│   └── MANUAL_RELEASE.md   # Guía oficial de compilación y publicación manual
├── installers/
│   ├── install.ps1         # Instalador oficial para Windows PowerShell
│   └── install.sh          # Instalador oficial para Linux/macOS con SHA-256
├── scripts/
│   ├── build-cli.ts        # Compilador nativo de CLI multiplataforma con Bun
│   └── generate-checksums.ts # Generador de sumas de integridad SHA-256
├── src/
│   ├── cli/                # Cliente Terminal TUI & AI Writing Studio
│   │   ├── main.ts         # Punto de entrada principal
│   │   ├── api/            # Cliente API REST HTTPS
│   │   ├── app/            # Coordinador cloud de aplicación
│   │   ├── integrations/   # Integraciones Cloud Word, Notepad y Google
│   │   └── terminal/       # AppShell, WelcomeScreen, ThemeManager y adaptadores
│   ├── api/                # Servidor Backend Cloud (Render)
│   │   ├── server.ts       # Servidor REST HTTP Bun.serve
│   │   ├── database/       # Conexión PostgreSQL y schema.sql
│   │   ├── storage/        # Almacenamiento cloud S3 / Object Storage
│   │   └── controllers/    # Controladores de API y descarga de instaladores
│   ├── config/             # Configuración centralizada y validada con Zod
│   ├── commands/           # Registro y enrutador de comandos '/'
│   ├── security/           # Almacenamiento seguro de credenciales (AES-256-GCM)
│   ├── sync/               # Motor de sincronización, respaldos y conflictos
│   ├── types/              # Definiciones de modelos y tipos de datos
│   └── utils/              # Utilidades multiplataforma, formato e i18n
├── ENVIRONMENT.md          # Documentación oficial de variables de entorno
├── package.json            # Metadatos del paquete @wattpad/cli y scripts locales
├── tsconfig.json           # Configuración TypeScript estricta
└── README.md               # Documentación general del proyecto
```
```

Para consultar el inventario completo de variables de entorno y guías de despliegue en Render, consulta [ENVIRONMENT.md](ENVIRONMENT.md). Para el proceso de compilación y publicación de releases, consulta [docs/MANUAL_RELEASE.md](docs/MANUAL_RELEASE.md).

---

## 🚀 Inicio Rápido

### Ejecutar Wattpad CLI

Desde cualquier terminal de Windows, escribe simplemente:

```bash
wattpad
```

En modo desarrollo:

```bash
bun run dev
```

### Iniciar el Backend Cloud API

```bash
bun run start:api
```

### Comprobar Tipos y Suite de Pruebas

```bash
bun run typecheck
bun test
```

### Compilar el Ejecutable CLI Local

```bash
bun run build:cli
```

### Generar Sumas de Verificación SHA-256

```bash
bun run build:checksums
```

### Compilar el Backend Cloud (Render)

```bash
bun run build:api
```

---

## 📦 Publicación y Distribución Manual (Cero GitHub Actions)

Wattpad CLI ha desacoplado completamente sus procesos de compilación y publicación de GitHub Actions:

- **Compilaciones 100% Locales:** Los binarios se construyen en el entorno local del desarrollador con `bun run build:cli`.
- **Integridad Verificable:** Cada versión genera su propio archivo `SHA256SUMS.txt` con `bun run build:checksums`.
- **Publicación Manual:** Los artefactos se adjuntan a GitHub Releases directamente mediante la herramienta de línea de comandos `gh` (`gh release create`) o a través de la interfaz web de GitHub.
- **Backend Continuo en Render:** El despliegue del servidor API en `https://wattpad-cli.onrender.com` se gestiona directamente desde la integración de Git con Render al actualizar `main`, sin depender de pipelines externos de CI/CD.

Para ver las instrucciones detalladas paso a paso, consulta [docs/MANUAL_RELEASE.md](docs/MANUAL_RELEASE.md).

---

## ⌨️ Comandos Disponibles dentro de la CLI

Todos los comandos se ejecutan dentro de la aplicación comenzando con `/`:

### 📚 Novelas y Capítulos
- `/stories`: Muestra tus historias en una **lista interactiva navegable con flechas (↑/↓)**. Pulsa `Enter` para abrir la novela seleccionada.
- `/story new "Título"`: Crea una nueva novela en la nube (`NOV-xxxx`).
- `/story open NOV-xxxx`: Establece la novela como contexto de trabajo.
- `/story info NOV-xxxx`: Consulta la ficha técnica completa.
- `/story edit NOV-xxxx`: Modifica los metadatos de la historia.
- `/story delete NOV-xxxx`: Elimina la novela de la nube.
- `/chapters [NOV-xxxx]`: Despliega la **lista interactiva de capítulos con flechas (↑/↓)**. Al pulsar `Enter`, abre automáticamente el capítulo en Word o Bloc de Notas.
- `/chapter new "Título"`: Crea un nuevo capítulo (`CAP-xxxx`).
- `/chapter open NOV-xxxx CAP-xxxx`: Abre el capítulo en tu procesador preferido.
- `/chapter import NOV-xxxx CAP-xxxx`: Importa los cambios redactados y los sube a la nube.
- `/chapter export NOV-xxxx CAP-xxxx`: Descarga la versión cloud al archivo de trabajo.

### 🌐 Conexiones y Sincronización
- `/connect`: Estado en tiempo real de Word, Bloc de Notas, Google Docs y Wattpad.
- `/connect word`: Activa la caché de trabajo para Microsoft Word (.docx).
- `/connect notepad`: Activa la integración TXT UTF-8.
- `/connect google`: Inicia la autorización OAuth2 en la nube (**Cero localhost**).
- `/sync`: Resumen de sincronización con la nube.
- `/sync chapter NOV-xxxx CAP-xxxx`: Sincroniza un capítulo individual evaluando colisiones SHA-256.
- `/sync story NOV-xxxx`: Sincroniza la novela completa en PostgreSQL.
- `/sync history`: Muestra el historial de sincronizaciones.

### 🚀 Publicación Oficial
- `/publish story NOV-xxxx`: Solicita confirmación explícita antes de publicar.
- `/publish story NOV-xxxx --confirm`: Publica formalmente la novela en Wattpad Cloud.
- `/publish chapter NOV-xxxx CAP-xxxx --confirm`: Publica el capítulo en Wattpad Cloud.

### ⚙️ Generales y Navegación
- `/help`: Centro de ayuda con comandos agrupados por categoría.
- `/version`: Especificaciones del entorno y versiones de la API y CLI.
- `/models`: Catálogo de modelos de inteligencia artificial narrativa (Wattpad Writer Pro, Claude, Gemini).
- `/update`: Verificación de versiones y comandos de actualización oficial en la nube.
- `/status`: Estado en tiempo real del servidor, novela activa y sincronización.
- `/language set es` / `/language set en`: Selector de idioma.
- `/clear`: Restablece el área de contenido y despliega el Welcome Hero.
- `/back`: Regresa al nivel superior.
- `/exit`: Cierra la aplicación de forma segura.

---

## 🧪 Pruebas Automatizadas

El proyecto cuenta con **78 pruebas automatizadas** que validan el 100% de los requisitos:

- **AI Writing Studio & Welcome Screen**: Nueva pantalla de bienvenida minimalista, marca sutil y selector fino sin bordes pesados.
- **ThemeManager & Multitema**: 4 temas oficiales (Dark, Light, Tokyo Night, Terminal) con paleta dinámica TrueColor.
- **TerminalAdapter**: Alternancia limpia entre Modo Full Screen y Modo Inline con preservación y restauración del buffer de consola.
- **Distribución Multiplataforma**: Validación de `bin/wattpad.cjs` para npm sin dependencia de Bun, validación SHA-256 en `install.sh` e `install.ps1`.
- **Theme & TrueColor**: Validación de códigos ANSI 24-bit (`#FF6122`), fondo de selección y badges de estado.
- **Navegación Interactiva**: Control de flechas ↑/↓, indicador `›`, desplazamiento y prioridad de foco.
- **Responsive**: Verificación en dimensiones `60x20`, `80x24`, `100x30`, `120x40`, `160x50` y `200x60`.
- **Cloud REST API & Discovery**: Endpoints `/cli/config`, `/cli/install.ps1`, `/cli/install.sh`, `/api/stories`, `/api/publish`, `/api/sync` y OAuth HTTPS sin localhost.
- **Flujo End-to-End**: Creación, edición, sincronización y publicación sin base de datos SQLite local.

---

© 2026 Wattpad CLI — Arquitectura Cloud & OpenTUI.
