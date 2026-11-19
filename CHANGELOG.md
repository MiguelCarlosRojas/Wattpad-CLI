# Registro de Cambios — Wattpad CLI

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.1.0] — 2026-11-19

### 🎨 Rediseño Visual Profesional y Ventana de Autenticación Emergente v1.1.0
- **Nueva Experiencia Visual TUI**: Interfaz minimalista inspirada en herramientas CLI profesionales de referencia (Antigravity CLI, Claude CLI) con identidad visual propia de Wattpad (`#FF6122`, `#0D0D0F`, `#17171B`, `#29292F`, `#F5F5F5`).
- **HomeView Dinámico**:
  - **Estado Desconectado**: Bienvenida elegante, estado `○ Sin conexión`, guía de inicio rápido con `/login`, `/register`, `/connect` y últimos comandos ejecutados.
  - **Estado Conectado**: Tarjeta de autor `@usuario`, métricas del catálogo local (obras y capítulos), estado de manuscritos vinculados (Word, Notepad, Google Docs) y accesos directos a operaciones principales.
- **Autenticación con Ventana Emergente Independiente**:
  - Reemplazo completo de modales de consola por una ventana gráfica dedicada controlada por Playwright.
  - Apertura centrada (1120x820) sin barras superfluas, permitiendo redimensionamiento libre, resolución de CAPTCHA y verificaciones oficiales de Wattpad.
  - Reporte de estados en tiempo real: `preparando`, `abriendo`, `esperando`, `verificando`, `guardando`, `conectado`, `cancelado`.
  - Cierre automático y limpio de la ventana emergente tras la verificación exitosa.
  - Prevención de ventanas duplicadas concurrentes.
- **Persistencia de Sesión en Segundo Plano**:
  - Estructuración de directorios en `~/.wattpad-cli/`: `browser-profile/`, `database/`, `cache/`, `logs/`, `config/`.
  - Reutilización de sesión entre reinicios de la CLI sin re-autenticación obligatoria.
  - Cierre seguro con `/logout --confirm` que elimina credenciales y el perfil local.
- **Comandos y Usabilidad**:
  - Alias `/commands` añadido como acceso directo a la ayuda clasificada.
  - Preservación completa de títulos con múltiples palabras y espacios en argumentos posicionales.
  - Búsqueda case-insensitive (`COLLATE NOCASE`) de identificadores en base de datos SQLite (`NOV-xxxx`, `CAP-xxxx`).

---

## [1.0.0] — 2026-11-19

### 🚀 Reconstrucción Funcional y Auditoría Integral v1.0.0

Reconstrucción completa de **Wattpad CLI** como una herramienta de terminal soberana y exclusivamente dedicada a gestionar una cuenta de Wattpad, novelas, capítulos, documentos y publicaciones.

### 🛡️ Autenticación Real de Wattpad con Navegador Controlado
- **Navegador Integrado con Playwright**: `/login` abre una ventana de navegador oficial dirigida a `https://www.wattpad.com/login` para que el usuario introduzca directamente sus credenciales y complete cualquier desafío de seguridad o autenticación en dos factores.
- **Detección Automática de Sesión**: Detecta cuándo la sesión ha iniciado exitosamente, valida la identidad del autor y guarda de forma persistente y segura el perfil de navegación local.
- **Registro Oficial**: Comando `/register` que abre directamente la página oficial de registro de Wattpad.
- **Cierre de Sesión Completo**: `/logout --confirm` invalida la sesión local, elimina el perfil del navegador de forma segura y restablece el estado a desconectado.
- **Cero Copia Manual de Tokens**: El usuario ya no necesita copiar manualmente cookies o tokens de la consola del navegador.

### 🧹 Eliminación de Render como Backend Funcional
- **Retirada de PostgreSQL y APIs Duplicadas**: Eliminadas todas las conexiones innecesarias a PostgreSQL, endpoints falsos de autenticación cloud (`/api/auth/start`), CRUDs de novelas remotos y almacenamiento duplicado.
- **Servidor de Distribución Puro**: El servidor web se mantiene exclusivamente para alojar y servir los instaladores (`/cli/install.ps1`, `/cli/install.sh`, `/cli/config`, `/cli/download/`) y comprobar salud (`/api/health`).
- **Eliminación de Render de `/connect`**: Render Cloud Backend ya no aparece como integración en la interfaz de usuario.
- **Persistencia Local Soberana**: Base de datos SQLite nativa (`bun:sqlite`) con integridad referencial y modo WAL.

### 📄 Administrador Documental Reconstruido (`/connect` y `/chapter import`)
- **Microsoft Word (.docx)**: Lectura nativa mediante `mammoth` y exportación con `docx`, preservando títulos y contenido íntegro.
- **Bloc de Notas (.txt)**: Lectura en UTF-8 con detección automática de separaciones de capítulos.
- **Google Docs**: Integración oficial con Google OAuth 2.0 y Drive/Docs API solicitando permisos mínimos necesarios de lectura (`documents.readonly`, `drive.readonly`).
- **Segmentación Inteligente con Vista Previa**: `/chapter import` analiza los documentos, detecta capítulos automáticamente y muestra una vista previa completa antes de incorporar los capítulos. **No publica automáticamente.**

### 📚 Gestión Real de Novelas y Capítulos
- `/stories`: Consulta novelas reales de la cuenta o muestra honestamente `No tienes novelas disponibles en esta cuenta`.
- `/story create` / `/story open` / `/story info` / `/story edit` / `/story delete`: Gestión con confirmación obligatoria `--confirm` para borrado.
- `/story privacy [public|private]`: Gestión de visibilidad pública o borrador privado.
- `/chapters`: Lista capítulos reales con conteo exacto de palabras.
- `/chapter create` / `/chapter edit` / `/chapter delete`: Gestión de capítulos con confirmación obligatoria.
- `/chapter publish`: Publicación formal en Wattpad con confirmación expresa `--confirm`.
- `/chapter status`: Consulta de estado de publicación real.

### 🔄 Actualización Real de Wattpad CLI
- `/update`: Consulta real a GitHub Releases (`api.github.com/repos/.../releases/latest`), compara versiones semánticas, muestra versión instalada, última versión, fecha, cambios y tamaño. Permite instalar con `--install` verificando SHA-256.
- Si no hay versión nueva: Muestra `Wattpad CLI está actualizado. No hay actualizaciones disponibles.` sin descargar innecesariamente.
- `/config update`: Permite configurar actualizaciones automáticas, comprobación al iniciar y canal de actualización (`stable`).

### 🎨 Rediseño Minimalista de la Interfaz
- **Línea Superior Exclusiva**:
  `WATTPAD CLI v1.0.0     ● @usuario     Conectado`
  o si está desconectado:
  `WATTPAD CLI v1.0.0     ○ Sin conexión`
- **Caja de Entrada Estilizada**: Marco minimalista con bordes redondeados (`╭`, `╯`), prompt `❯` y atajos: `? Ayuda · / Comandos · Ctrl+C Salir`.
- **Eliminación Total de Bloques Ajenos**: Sin dashboards complejos, sin asistentes conversacionales, sin tarjetas ficticias ni telemetría.

### 📥 Instalador de Windows con Barra de Progreso Real
- `installers/install.ps1`: Descarga en streaming continuo con visualización en tiempo real:
  `████████████████░░░░░░░░  65%  |  72.4 MB / 111.3 MB  |  Velocidad: 8.2 MB/s`
- Medición real de bytes y velocidad, comprobación estricta de encabezado PE `MZ` y hash SHA-256 antes de instalar.

### 🧪 Pruebas y Tipos
- 76 pruebas automatizadas aprobadas al 100% (0 fallos).
- Verificación de tipos estricta `tsc --noEmit` con 0 errores.
- Binario nativo generado y verificado con sumas SHA-256 en `dist/SHA256SUMS.txt`.
