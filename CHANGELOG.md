# Registro de Cambios — Wattpad CLI

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] — 2026-11-18

### 🎨 Nuevo Concepto e Interfaz de Usuario
- **WATTPAD CLI — AI WRITING STUDIO**: Rediseño visual absoluto inspirado en Antigravity CLI, Claude Code, Grok CLI y ChatGPT CLI.
- **Pantalla de Bienvenida Minimalista (`WelcomeScreen`)**: Composición elegante con marca Wattpad, estado cloud discreto, acciones rápidas en línea y visualización de proyectos recientes reales sin recuadros pesados.
- **Flujo Conversacional Prioritario (`ConversationView`)**: Interfaz centrada en la interacción de escritura literaria, streaming de respuestas de IA y ejecución natural de comandos sin dashboards fijos de tres columnas.
- **Soporte Multitema (`ThemeManager`)**: Incorporación de 4 temas oficiales: `dark` (estudio por defecto), `light`, `tokyo-night` y `terminal` (ANSI monocromático).
- **Dos Modos de Renderizado (`TerminalAdapter`)**: Soporte para **Modo Full Screen** (alternate screen buffer `\x1b[?1049h`) y **Modo Inline** (flujo continuo integrado en el scrollback de la terminal).

### 🛡️ Aislamiento y Corrección del Arranque
- **Aislamiento Total de Dotenv**: Eliminación definitiva del mensaje intrusivo `◇ injected env (...) from .env`. La CLI global nunca lee ni inyecta variables de proyectos externos desde el directorio actual.
- **Almacenamiento Global en Usuario**: Persistencia oficial en `%USERPROFILE%/.wattpad-cli/config.json`.
- **Motor Asíncrono Robusto (`AppShell`)**: Ciclo de eventos con Promesa viva y manejo seguro de señales `SIGINT` / `SIGTERM`.

### 📦 Distribución Multiplataforma y npm
- **Runner Global npm (`bin/wattpad.cjs`)**: Paquete `@wattpad/cli` sin dependencias externas obligatorias para Node.js (>= 18.0.0). Descarga y valida el ejecutable oficial mediante sumas criptográficas SHA-256.
- **Instalador Linux/macOS Mejorado (`installers/install.sh`)**: Incorporación de verificación de sumas criptográficas SHA-256 contra el manifiesto cloud oficial.
- **Auditoría del Registro npm**: Detección del estado de sesión y registro público documentado como pendiente de autenticación por el propietario (`npm login`).

### 🧹 Limpieza y Optimización del Repositorio
- Eliminación de componentes visuales duplicados y obsoletos (`suggestion-list.ts`, héroes heredados).
- Consolidación y actualización de la suite de pruebas a **78 pruebas automatizadas** (100% aprobadas).
- Actualización de los manifiestos de compilación e integridad (`SHA256SUMS.txt`).

---

## [1.0.0] — 2026-11-18

### ✨ Lanzamiento Inicial
- Arquitectura cloud conectada a `https://wattpad-cli.onrender.com`.
- Persistencia remota en PostgreSQL y almacenamiento cloud S3.
- Integraciones para Microsoft Word (.docx), Bloc de Notas (.txt) y Google Docs.
- Comandos para gestión de novelas (`/story`), capítulos (`/chapter`), sincronización (`/sync`) y publicación (`/publish`).
- Suite inicial de 49 pruebas automatizadas.
