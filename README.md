# Wattpad CLI — Arquitectura Cloud & TUI Interactiva Responsive

> **Aplicación de terminal moderna y profesional de nueva generación construida con TypeScript, Bun y OpenTUI, conectada al backend cloud en Render (`https://wattpad-cli.onrender.com`), con persistencia remota en PostgreSQL y almacenamiento cloud de documentos.**

Backend cloud:
https://wattpad-cli.onrender.com

Inspirada directamente en la experiencia de usuario, diseño responsive, interacción por teclado y estética de **Grok CLI**, **Antigravity CLI**, **Claude CLI** y **ChatGPT CLI**.

---

## 📋 Resumen de Mejoras y Arquitectura

1. **Diseño Visual & TrueColor**:
   - Paleta oficial con **Naranja Wattpad (`#FF6122`)** de acento principal.
   - Textos de alto contraste, bordes modernos redondeados (`╭`, `╮`, `╯`, `╰`), paneles informativos y badges cromáticos (`[PUBLICADO EN WATTPAD]`, `[SINCRONIZADO]`, `[BORRADOR LOCAL]`).
   - Sin tablas de texto rústicas ni menús planos.
2. **Navegación Interactiva por Teclado**:
   - Navegación real con flechas **Arriba (↑)** y **Abajo (↓)** en listas interactivas (`/stories`, `/chapters`, etc.).
   - Indicador visual inmediato: fondo naranja con texto en negrita blanco y flecha de foco `›`.
   - `Enter` para abrir o seleccionar; `Esc` para regresar o cancelar; `Tab` para autocompletar o alternar el foco entre el selector y el campo de entrada.
   - Desplazamiento automático (*auto-scroll*) en listas largas.
3. **Diseño Responsive Automático**:
   - Detección y adaptación en tiempo real ante cambios de dimensiones de la terminal (`process.stdout.on('resize')`).
   - Soporte verificado en breakpoints: `60x20`, `80x24`, `100x30`, `120x40`, `160x50` y `200x60`.
4. **Arquitectura 100% Cloud (Sin Localhost ni SQLite Local)**:
   - Backend centralizado en Render: `https://wattpad-cli.onrender.com`.
   - Base de datos cloud: **PostgreSQL** mediante `DATABASE_URL`.
   - Almacenamiento de documentos en la nube: S3 / Object Storage.
   - Flujo de autorización OAuth2 de Google Docs con redirección HTTPS oficial en la nube (**Cero servidores o puertos localhost**).
5. **Configuración Centralizada en `.env`**:
   - Todas las URLs, rutas de API y credenciales están centralizadas y validadas con **Zod**.
   - Descubrimiento dinámico de configuración en `/cli/config`.
   - Cambio de dominio cloud con solo modificar `WATTPAD_API_BASE_URL` en `.env`.
6. **Mecanismos de Instalación**:

### Windows

```powershell
irm https://wattpad-cli.onrender.com/cli/install.ps1 | iex
```

### Linux / macOS

```bash
curl -fsSL https://wattpad-cli.onrender.com/cli/install.sh | bash
```

### NPM

```bash
npm install -g @wattpad/cli
```

El comando de ejecución continúa siendo:

```bash
wattpad
```

---

## 🛠️ Estructura del Proyecto

```text
wattpad-cli/
├── installers/
│   ├── install.ps1         # Instalador oficial para Windows PowerShell
│   └── install.sh          # Instalador oficial para Linux/macOS
├── src/
│   ├── cli/                # Cliente Terminal TUI (OpenTUI)
│   │   ├── main.ts         # Entrada principal del CLI (@wattpad/cli)
│   │   ├── api/            # Cliente API REST HTTPS
│   │   ├── app/            # Coordinador de aplicación TUI
│   │   ├── integrations/   # Integraciones Cloud Word, Notepad y Google
│   │   └── terminal/       # Motor OpenTUI, Theme, Responsive y SelectorList
│   ├── api/                # Servidor Backend Cloud (Render)
│   │   ├── server.ts       # Servidor REST HTTP con Bun.serve
│   │   ├── database/       # Conexión PostgreSQL y schema.sql
│   │   ├── storage/        # Almacenamiento cloud S3 / Object Storage
│   │   └── controllers/    # Controladores de API y descarga de instaladores
│   ├── config/             # Configuración centralizada tipada (Zod)
│   │   ├── env.ts          # Única lectura y validación de variables de entorno
│   │   ├── env-schema.ts   # Esquema Zod exhaustivo de variables
│   │   └── config.ts       # Configuración unificada de la aplicación
│   ├── commands/           # Registro y enrutador de comandos '/'
│   ├── security/           # Almacenamiento seguro de credenciales (AES-256-GCM)
│   ├── sync/               # Motor de sincronización, respaldos y conflictos
│   ├── types/              # Definiciones de modelos y tipos de datos
│   ├── utils/              # Utilidades multiplataforma, formato e i18n
│   └── shared/             # Tipos compartidos y adaptadores
├── ENVIRONMENT.md          # Documentación oficial de variables de entorno
├── package.json            # Metadatos del paquete @wattpad/cli
├── tsconfig.json           # Configuración TypeScript estricta
└── README.md               # Documentación general del proyecto
```

Para consultar el inventario completo de variables de entorno y guías de despliegue en Render, consulta [ENVIRONMENT.md](ENVIRONMENT.md).

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

### Ejecutar la Suite de Pruebas

```bash
bun test
```

### Compilar el Ejecutable CLI Multiplataforma

```bash
bun run build:cli
```

### Compilar y Validar el Backend Cloud (Render)

```bash
bun run build:api
```

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

El proyecto cuenta con **49 pruebas automatizadas** que validan el 100% de los requisitos:

- **Theme & TrueColor**: Validación de códigos ANSI 24-bit (`#FF6122`), fondo naranja de selección y badges.
- **Navegación Interactiva**: Control de flechas ↑/↓, indicador `›`, desplazamiento automático y prioridad de foco.
- **Responsive**: Verificación en dimensiones `60x20`, `80x24`, `100x30`, `120x40`, `160x50` y `200x60`.
- **Cloud REST API & Discovery**: Endpoints `/cli/config`, `/cli/install.ps1`, `/cli/install.sh`, `/api/stories`, `/api/publish`, `/api/sync` y OAuth HTTPS sin localhost.
- **Flujo End-to-End**: Creación, edición, sincronización y publicación sin base de datos SQLite local.

---

© 2026 Wattpad CLI — Arquitectura Cloud & OpenTUI.
