# Wattpad CLI (v1.1.0)

> **Herramienta oficial de terminal dedicada exclusivamente a la gestión de novelas, capítulos, manuscritos locales (Microsoft Word, Bloc de notas, Google Docs) y sincronización con tu cuenta de Wattpad.**

**Repositorio oficial:** https://github.com/MiguelCarlosRojas/Wattpad-CLI  
**Backend cloud:** https://wattpad-cli.onrender.com  

Inspirada en la estética visual de herramientas modernas para desarrolladores como **Claude Code** y **Google Antigravity CLI**, con una experiencia de lienzo único centrada en la escritura literaria, tipografía cuidada y acento naranja Wattpad (`#FF6122`).

---

## 🎯 Propósito Único de Wattpad CLI

Wattpad CLI está diseñada exclusivamente para autores y escritores:

1. **Gestión de Cuenta Wattpad**: Conecta tu cuenta oficial de Wattpad con `/login`, regístrate en la plataforma con `/register`, consulta tu perfil con `/account` o cierra sesión con `/logout`.
2. **Biblioteca de Novelas**: Crea, organiza, edita, importa y exporta tus historias (`/stories`, `/story new`, `/story open`, `/story import`, `/story export`).
3. **Capítulos y Manuscritos**: Administra capítulos, reordena episodios, importa y exporta borradores (`/chapters`, `/chapter new`, `/chapter reorder`, `/chapter open`).
4. **Integración con Procesadores de Texto**: Escribe cómodamente en **Microsoft Word (.docx)** o **Bloc de notas (.txt UTF-8)** y mantén tus archivos organizados por novela (`/connect word`, `/connect notepad`, `/documents`).
5. **Conexión Cloud con Google Docs**: Vincula tus documentos de Google Docs de forma segura con OAuth2 HTTPS (**cero localhost**) mediante `/connect google`.
6. **Estructura Jerárquica de Archivos**: Visualiza el árbol de manuscritos y notas de cada novela con `/documents`.
7. **Publicación Oficial Controlada**: Consulta borradores y capítulos publicados con `/publish status`, y publica de manera explícita con `/publish story` y `/publish chapter`.

---

## 🚀 Instalación Oficial

### Método 1 — Windows (PowerShell 5.1 / 7+)

Ejecuta en tu terminal de Windows:

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

Una vez instalado, escribe en cualquier terminal:

```bash
wattpad
```

---

## 📂 Organización de Documentos (`/documents`)

Wattpad CLI estructura tus manuscritos locales organizados por historia:

```text
Mis novelas/
  ├── <Título Novela 1>/
  │     ├── Capitulos/
  │     │     ├── Capitulo_01_El_Despertar.docx (o .txt)
  │     │     └── Capitulo_02_El_Encuentro.docx (o .txt)
  │     └── Notas/
  │           └── notas_de_trama.txt
  └── <Título Novela 2>/
        ├── Capitulos/
        └── Notas/
```

- **Microsoft Word**: Trabaja con archivos `.docx` preservando formato y estilos.
- **Bloc de notas**: Formato `.txt` ligero con codificación UTF-8 pura.
- **Google Docs**: Sincronización en la nube mediante URLs oficiales de Google Workspace.

---

## ⌨️ Comandos Disponibles dentro de Wattpad CLI

Todos los comandos se introducen con el prefijo `/`:

### 👤 Cuenta Wattpad
- `/login [token]`: Abre el portal oficial de inicio de sesión de Wattpad en tu navegador (`https://www.wattpad.com/login`) y permite vincular tu Creator Token.
- `/register`: Abre la página oficial de Wattpad (`https://www.wattpad.com/`) en el navegador predeterminado para crear una cuenta nueva.
- `/account`: Muestra el estado real de tu cuenta Wattpad (usuario, seguidores, novelas en la nube).
- `/logout`: Revoca el token y elimina de forma segura las credenciales almacenadas.

### 📚 Administración de Novelas
- `/stories` o `/library`: Lista tus novelas con selector interactivo con flechas (`↑`/`↓`) y estados (`Borrador`, `Publicado`, `Al día`).
- `/story new "Título"`: Crea una nueva novela en Wattpad Cloud.
- `/story open NOV-xxxx`: Establece la historia como contexto activo de trabajo.
- `/story info NOV-xxxx`: Consulta los detalles, género, etiquetas y capítulos de la novela.
- `/story edit NOV-xxxx`: Edita título, sinopsis, género o editor preferido.
- `/story delete NOV-xxxx`: Elimina la novela previa confirmación.
- `/story import <ruta>`: Importa un archivo Word (.docx) o texto (.txt) como novela completa.
- `/story export [NOV-xxxx]`: Exporta el manuscrito completo de la novela.

### 📝 Capítulos y Manuscritos
- `/chapters [NOV-xxxx]`: Lista los capítulos de la novela seleccionada.
- `/chapter new "Título"`: Añade un nuevo capítulo a la historia activa.
- `/chapter open NOV-xxxx CAP-xxxx`: Abre el capítulo directamente en Word o Bloc de notas.
- `/chapter edit NOV-xxxx CAP-xxxx`: Modifica el título o número de capítulo.
- `/chapter import <ruta>`: Importa el contenido de un archivo local al capítulo activo.
- `/chapter export NOV-xxxx CAP-xxxx`: Guarda el capítulo en formato `.docx` o `.txt`.
- `/chapter reorder NOV-xxxx CAP-xxxx <nuevo_orden>`: Cambia la posición del capítulo.
- `/chapter delete NOV-xxxx CAP-xxxx`: Elimina un capítulo.
- `/chapter publish NOV-xxxx CAP-xxxx --confirm`: Publica el capítulo en Wattpad.
- `/chapter unpublish NOV-xxxx CAP-xxxx`: Revierte el capítulo a estado borrador.

### 🔌 Conexiones y Documentos
- `/documents`: Muestra el árbol jerárquico de tus novelas y manuscritos locales (`Mis novelas/...`).
- `/connect`: Estado de conexiones locales y cloud (Word, Notepad, Google Docs).
- `/connect word`: Vincula Microsoft Word como editor de trabajo por defecto.
- `/connect notepad`: Vincula Bloc de notas (archivos .txt UTF-8) por defecto.
- `/connect google`: Inicia la vinculación con Google Docs vía OAuth2 HTTPS.
- `/disconnect google`: Desvincula la cuenta de Google Docs.

### 🚀 Publicación y Sincronización
- `/publish`: Panel general de estado de publicación y preparación de historias.
- `/publish status`: Distingue claramente qué novelas y capítulos son **Borradores** y cuáles están **Publicados**.
- `/publish story NOV-xxxx --confirm`: Publica la novela completa en Wattpad Cloud.
- `/publish chapter NOV-xxxx CAP-xxxx --confirm`: Publica un capítulo específico.
- `/sync`: Resumen de sincronización con la base de datos cloud en PostgreSQL.
- `/sync story NOV-xxxx`: Sincroniza la novela completa.
- `/sync chapter NOV-xxxx CAP-xxxx`: Sincroniza un capítulo individual.

### 🎨 Entorno y Terminal
- `/theme [dark|light|tokyo-night|terminal]`: Cambia el tema visual en tiempo real.
- `/mode [fullscreen|inline]`: Alterna entre pantalla completa y modo inline en la consola.
- `/help`: Muestra la guía rápida de comandos clasificada por categorías.
- `/status`: Estado general del sistema, conexión a Render y novela activa.
- `/clear` o `/home`: Vuelve a la pantalla principal de bienvenida.
- `/exit`: Sale de la aplicación restaurando la terminal limpiamente.

---

## 🛠️ Desarrollo y Compilación Local

```bash
# Ejecutar en modo desarrollo
bun run dev

# Ejecutar suite de pruebas (77 pruebas)
bun test

# Verificar tipos estrictos
bun run typecheck

# Compilar ejecutable binario de CLI
bun run build:cli

# Generar sumas de integridad SHA-256
bun run build:checksums

# Compilar el servidor de Backend (Render)
bun run build:api
```

---

## 📦 Despliegue y Publicaciones Manuales

Wattpad CLI utiliza un pipeline de distribución manual libre de dependencias de GitHub Actions:

- **Binarios Locales:** Se compilan en el entorno local con `bun run build:cli`.
- **Integridad:** Las sumas SHA-256 se generan con `bun run build:checksums`.
- **Releases en GitHub:** Se publican manualmente mediante `gh release create` o la web de GitHub.
- **Backend Cloud:** Desplegado automáticamente en **Render** (`https://wattpad-cli.onrender.com`) con base de datos **PostgreSQL**, almacenamiento de instaladores y endpoints REST HTTPS.

Para más detalles, consulta [docs/MANUAL_RELEASE.md](docs/MANUAL_RELEASE.md) y [ENVIRONMENT.md](ENVIRONMENT.md).

---

© 2026 Wattpad CLI — Herramienta de Terminal Oficial para Escritores.
