# Registro de Cambios — Wattpad CLI

Todas las modificaciones notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto se adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [1.0.0] — 2026-11-19

### 🚀 Nueva Línea de Versiones Oficial v1.0.0

Lanzamiento oficial de **Wattpad CLI v1.0.0**, consolidado como una herramienta de terminal limpia, profesional, segura y dedicada exclusivamente a la administración de tu cuenta de Wattpad, novelas, capítulos, documentos e integraciones.

### 🛡️ Autenticación Soberana y Segura
- **Nuevo Flujo de Conexión Real**: Al invocar `/login`, se abre el portal oficial de Wattpad en el navegador predeterminado (`https://www.wattpad.com/login`) y se despliega una ventana emergente interactiva (`AuthModal`) con entrada enmascarada para introducir el Creator Token oficial.
- **Verificación Criptográfica Directa**: Las credenciales se validan en tiempo real contra `https://api.wattpad.com/v4/users/me`. Si el token es inválido, falla honestamente sin recurrir a datos ficticios ni usuarios simulados.
- **Aislamiento Total de Secretos**: Las credenciales de Wattpad **jamás se envían a Render**. Quedan cifradas localmente con **AES-256-GCM** en `vault.enc`.
- **Cierre de Sesión Protegido**: `/logout` exige confirmación explícita con `--confirm`, revoca las credenciales del vault, limpia la memoria y devuelve el estado formal `Wattpad: Desconectado` manteniendo intactos los manuscritos del autor.
- **Perfil Real**: `/account` consulta y muestra únicamente la identidad real verificada de la cuenta autenticada.

### 🎨 Rediseño Total de la Terminal (Single-Canvas TUI)
- **Lienzo Único Moderno**: Eliminación de dashboards complejos de tres columnas y paneles innecesarios.
- **Caja de Entrada Protagonista**: Caja delimitada con bordes TrueColor naranja Wattpad (`#FF6122`), título centrado ` Wattpad CLI `, prompt `  ❯ `, e indicador inferior de atajos.
- **Nuevo Status-Bar Minimalista**: Línea inferior limpia con atajos reales (`↑↓ Historial · Enter Ejecutar · Tab Autocompletar · / Comandos · Ctrl+C Salir`), con adaptación responsiva en terminales estrechas.
- **Menú de Sugerencias Flotante**: Desplegable ordenado sobre la caja de comandos al escribir `/`.

### 📚 Gestión Literaria y Documentos
- **Gestión de Novelas**: Creación, edición, consulta, borrado destructivo protegido con confirmación y búsqueda local exacta (`/stories`, `/story new`, `/story open`, `/story info`, `/story edit`, `/story delete --confirm`, `/stories search`).
- **Gestión de Capítulos**: Organización por novela, conteo exacto de palabras, hash de contenido y estados (`/chapters`, `/chapter new`, `/chapter open`, `/chapter edit`, `/chapter delete --confirm`, `/chapter publish --confirm`, `/chapter unpublish`).
- **Integraciones Consolidadas**:
  - **Microsoft Word**: Exportación y apertura directa en `.docx`.
  - **Bloc de Notas**: Exportación y apertura directa en `.txt` con codificación UTF-8.
  - **Google Docs**: Vinculación segura vía OAuth2 HTTPS (cero localhost).
- **Protección de Manuscritos Personales**: Carpeta `Mis novelas/` excluida de Git en `.gitignore`.

### 🧹 Limpieza Radical del Repositorio
- Eliminación de controladores y modelos de IA, asistentes y chats ajenos a Wattpad.
- Eliminación de todas las carpetas, vistas y selectores antiguos (`src/cli/terminal/views/`, `header-bar.ts`, `selector-list.ts`, `workspace-navigation.ts`, `focus-manager.ts`, etc.).
- Eliminación de copias duplicadas de integraciones (`src/cli/integrations/`).
- Eliminación de almacenamiento S3 simulado (`src/api/storage/`).
- Eliminación de datos y usuarios ficticios (`wattpad_author`, `El Secreto de las Sombras`, seguidores y estadísticas simuladas).
- Eliminación de lanzamientos y tags antiguos en GitHub para reiniciar el ciclo en v1.0.0.

### 📦 Distribución y Verificación
- Tres canales oficiales de instalación: **PowerShell** (Windows), **Shell curl** (Linux/macOS) y **NPM** (`@wattpad/cli`).
- Suite de pruebas automatizadas con **83 pruebas pasando al 100%** (0 fallos).
- Verificación estricta de tipos TypeScript con `tsc --noEmit` (0 errores).
- Compilación limpia de ejecutables binarios nativos independientes de GitHub Actions.
