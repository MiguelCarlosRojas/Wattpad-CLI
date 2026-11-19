# Wattpad CLI (v1.1.0)

> **Herramienta oficial de terminal exclusivamente dedicada a gestionar una cuenta de Wattpad, novelas, capítulos, documentos (Microsoft Word, Bloc de notas, Google Docs) y publicaciones.**

**Repositorio oficial:** https://github.com/MiguelCarlosRojas/Wattpad-CLI  
**Alojamiento de instaladores:** https://wattpad-cli.onrender.com  

---

## 🎯 Funcionalidades Exclusivas

Wattpad CLI está diseñada exclusivamente para gestionar tus novelas, manuscritos y cuenta de Wattpad de forma soberana, rápida y segura:

1. **Iniciar sesión en Wattpad (`/login`)**: Abre una ventana de navegador controlado mediante Playwright directo a `https://www.wattpad.com/login` para completar tus credenciales y verificaciones oficiales de seguridad. Conserva la sesión en un perfil de navegación seguro y persistente.
2. **Crear una cuenta de Wattpad (`/register`)**: Abre el registro oficial de Wattpad.
3. **Cerrar sesión y volver a conectar (`/logout`, `/login`)**: Invalida la sesión local, elimina el perfil de navegación persistente con confirmación y permite cambiar de cuenta.
4. **Consultar perfil de usuario (`/profile` o `/account`)**: Información real de tu perfil de Wattpad, seguidores, obras y biografía.
5. **Consultar novelas de la cuenta (`/stories`)**: Catálogo real de obras en borrador o públicas. Si no hay novelas, muestra estado vacío honesto sin datos ficticios.
6. **Buscar y seleccionar novelas (`/stories search`, `/story open`)**: Búsqueda en tu catálogo y selección de contexto de trabajo.
7. **Importar documentos de novelas (`/chapter import`)**: Importa archivos `.docx`, `.txt` o Google Docs detectando capítulos automáticamente, con vista previa y confirmación previa sin publicar automáticamente.
8. **Organizar documentos y capítulos (`/chapters`, `/story`)**: Visualiza episodios, conteo de palabras y fechas de modificación.
9. **Crear, editar y eliminar capítulos (`/chapter create`, `/chapter edit`, `/chapter delete`)**: Gestión completa de capítulos con confirmación obligatoria para operaciones destructivas.
10. **Publicar novelas y capítulos (`/story create`, `/chapter publish`)**: Flujo de publicación formal con confirmación explícita (`--confirm`).
11. **Cambiar la privacidad (`/story privacy [public|private]`)**: Alterna entre novela pública y borrador privado.
12. **Consultar el estado de publicación (`/chapter status`, `/publish`)**: Distingue claramente qué capítulos son borradores privados y cuáles están públicos.
13. **Actualizar Wattpad CLI (`/update`, `/config update`)**: Comprobación real contra GitHub Releases, descarga del binario con verificación SHA-256 e instalación consentida.

---

## 🚫 Cero Funcionalidades Ajenas y Cero Datos Falsos

- **Sin IA ni asistentes conversacionales**: Dedicada 100% a tus obras y tu cuenta.
- **Sin Render como backend de aplicación**: Eliminada la dependencia de bases de datos remotas PostgreSQL, APIs duplicadas y telemetría innecesaria.
- **Sin datos ficticios**: No existen novelas ni usuarios falsos. Muestra información auténtica o estados vacíos claros.
- **Arquitectura Soberana**: Base de datos SQLite local (`wattpad.db`) y archivos personales en tu equipo.

---

## 🚀 Instalación Oficial

### Método 1 — Windows (PowerShell 5.1 / 7+)

Ejecuta en tu terminal de PowerShell (con barra de progreso real en tiempo de descarga):

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

Una vez instalado, ejecuta en tu terminal:

```bash
wattpad
```

---

## 🎨 Nueva Interfaz de Usuario

Inspirada en herramientas CLI modernas con bordes limpios, acentos de Wattpad y minimalismo:

```text
    WATTPAD CLI v1.0.0     ● @usuario     Conectado

    WATTPAD
    ❯ ~ Wattpad CLI

    ╭───────────────────────────────────────────────────────────────╮
    │                                                               │
    │  ❯ Escribe un comando o selecciona una operación              │
    │                                                               │
    ╰───────────────────────────────────────────────────────────────╯
      ? Ayuda · / Comandos · Ctrl+C Salir
```

---

## 📂 Administrador Documental e Importaciones

### Microsoft Word (.docx)
- Importa archivos `.docx` preservando el texto original.
- Identifica encabezados y cortes de capítulos automáticamente.
- Exporta manuscritos estructurados para escribir en Word o LibreOffice.

### Bloc de Notas (.txt)
- Lectura en UTF-8 nativo.
- Detección inteligente de capítulos por palabras clave (`Capítulo X`, `Chapter X`, separadores).

### Google Docs (OAuth 2.0 y Drive API)
- Selección de documentos reales desde Google Drive con permisos mínimos de lectura (`documents.readonly`, `drive.readonly`).
- Importación y segmentación directa a capítulos locales.

---

## ⌨️ Referencia Rápida de Comandos

| Comando | Acción |
| :--- | :--- |
| `/login` | Inicia sesión en Wattpad en el navegador oficial Playwright |
| `/register` | Abre la página de registro oficial de Wattpad |
| `/logout [--confirm]` | Cierra la sesión y elimina el perfil de forma segura |
| `/profile` | Consulta tu perfil de autor conectado en Wattpad |
| `/stories` | Lista las novelas de tu cuenta |
| `/stories search <término>` | Busca novelas por título o etiqueta |
| `/story create <título>` | Crea una nueva novela en tu cuenta |
| `/story open NOV-xxxx` | Selecciona una novela como contexto activo |
| `/story info NOV-xxxx` | Consulta información y metadatos de la novela |
| `/story edit NOV-xxxx` | Modifica título, sinopsis, género o etiquetas |
| `/story delete NOV-xxxx --confirm` | Elimina una novela (requiere confirmación) |
| `/story privacy NOV-xxxx [public\|private]` | Modifica la visibilidad de la novela |
| `/chapters` | Lista los capítulos de la novela activa |
| `/chapter create <título>` | Añade un nuevo capítulo a la novela activa |
| `/chapter edit CAP-xxxx` | Edita título o contenido del capítulo |
| `/chapter delete CAP-xxxx --confirm` | Elimina un capítulo con confirmación |
| `/chapter import <archivo>` | Vista previa de importación de capítulos |
| `/chapter import <archivo> --confirm` | Confirma e incorpora los capítulos a tu novela |
| `/chapter publish CAP-xxxx --confirm` | Publica el capítulo en Wattpad |
| `/chapter status CAP-xxxx` | Consulta el estado de publicación |
| `/connect` | Administrador de documentos (Word, Notepad, Google Docs) |
| `/connect google` | Inicia la autorización con Google Docs |
| `/update` | Comprobación real de versiones con GitHub Releases |
| `/update --install` | Descarga, verifica SHA-256 e instala la actualización |
| `/config update` | Configura preferencias de comprobación y actualización |
| `/help` | Lista detallada de comandos |
| `/version` | Versión y especificaciones del entorno |
| `/exit` | Cierra y sale limpiamente de la terminal |

---

## 🛠️ Pruebas y Compilación

```bash
# Comprobación de tipos estricta (TypeScript 5.x)
bun run typecheck

# Suite completa de pruebas automatizadas
bun test

# Compilación de binario ejecutable para Windows
bun run build:cli

# Generación de sumas criptográficas SHA-256
bun run build:checksums
```

---

© 2026 Wattpad CLI — Herramienta Oficial de Terminal.
