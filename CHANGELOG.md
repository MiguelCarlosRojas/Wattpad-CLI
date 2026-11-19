# Registro de Cambios — Wattpad CLI

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

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
