# Wattpad CLI (v1.0.0)

> **Herramienta oficial de terminal dedicada exclusivamente a la gestión de novelas, capítulos, manuscritos locales (Microsoft Word, Bloc de notas, Google Docs) y administración soberana de tu cuenta de Wattpad.**

**Repositorio oficial:** https://github.com/MiguelCarlosRojas/Wattpad-CLI  
**Backend cloud:** https://wattpad-cli.onrender.com  

---

## 🎯 Propósito de Wattpad CLI

Wattpad CLI está diseñada exclusivamente para autores y administradores literarios:

1. **Gestión de Cuenta Wattpad**: Conecta tu cuenta oficial con `/login` mediante navegador y modal seguro en terminal, consulta tu perfil con `/account` o cierra sesión con `/logout --confirm`.
2. **Administración de Novelas**: Crea, organiza, edita y busca tus historias (`/stories`, `/stories search`, `/story new`, `/story open`, `/story info`, `/story edit`, `/story delete --confirm`).
3. **Capítulos y Manuscritos**: Administra capítulos por novela, reordena episodios, importa y exporta borradores con cálculo de palabras y hashes criptográficos (`/chapters`, `/chapter new`, `/chapter open`, `/chapter edit`, `/chapter delete --confirm`, `/chapter publish`, `/chapter unpublish`).
4. **Integración con Procesadores de Texto**: Escribe cómodamente en **Microsoft Word (.docx)** o **Bloc de notas (.txt UTF-8)** con asociación automática por novela y capítulo (`/connect word`, `/connect notepad`, `/connect`).
5. **Conexión Cloud con Google Docs**: Vincula tus documentos de Google Docs de forma segura con OAuth2 HTTPS (**cero localhost**) mediante `/connect google`.
6. **Publicación Oficial Asistida**: Consulta el estado de borradores y publicaciones con `/publish status`, y gestiona la preparación y apertura del portal oficial de Wattpad con `/publish story` y `/publish chapter`.
7. **Cero Datos Ficticios**: La CLI opera únicamente con tu cuenta real y tus documentos reales.

---

## 🚀 Instalación Oficial

### Método 1 — Windows (PowerShell 5.1 / 7+)

Ejecuta en tu consola de PowerShell:

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

## 📂 Organización de Documentos

Tus manuscritos personales se organizan de forma local en la carpeta raíz del autor:

```text
Mis novelas/
  ├── <Título Novela 1>/
  │     ├── Capitulos/
  │     │     ├── 001 - Capitulo_1.docx (o .txt)
  │     │     └── 002 - Capitulo_2.docx (o .txt)
  │     └── Informacion/
  │           ├── metadatos.json
  │           └── sinopsis.txt
  └── <Título Novela 2>/
        ├── Capitulos/
        └── Informacion/
```

- **Microsoft Word**: Archivos nativos `.docx` con formato enriquecido.
- **Bloc de notas**: Archivos `.txt` con codificación UTF-8 pura.
- **Google Docs**: Sincronización oficial con Google Drive / Docs.
- **Protección Git**: La carpeta `Mis novelas/` se encuentra ignorada por Git en `.gitignore` para salvaguardar tu privacidad y derechos de autor.

---

## ⌨️ Comandos Disponibles dentro de Wattpad CLI

Todos los comandos se introducen con el prefijo `/`:

### 👤 Cuenta Wattpad
- `/login [token]`: Abre el portal oficial de Wattpad en tu navegador (`https://www.wattpad.com/login`) y despliega la ventana emergente para vincular tu token oficial verificado directamente contra la API de Wattpad.
- `/account`: Consulta y muestra los datos reales de tu cuenta de Wattpad. Si no estás autenticado, indica `Wattpad: Desconectado`.
- `/logout`: Solicita confirmación (`/logout --confirm`), revoca y elimina las credenciales del vault cifrado local y cierra la sesión en memoria.

### 📚 Administración de Novelas
- `/stories`: Lista tus novelas locales registradas.
- `/stories search <término>`: Busca localmente en tus novelas por título, género o etiquetas.
- `/story new "Título" [--genre=Género]`: Crea una nueva novela en tu catálogo local.
- `/story open NOV-xxxx`: Selecciona una novela como contexto activo de trabajo.
- `/story info NOV-xxxx`: Consulta los metadatos completos y sinopsis de la novela.
- `/story edit NOV-xxxx`: Modifica el título, sinopsis, género o editor preferido.
- `/story delete NOV-xxxx --confirm`: Elimina una novela tras confirmación explícita obligatoria.

### 📝 Capítulos y Manuscritos
- `/chapters [NOV-xxxx]`: Lista todos los capítulos de la novela seleccionada con estado y conteo de palabras.
- `/chapter new "Título"`: Crea un nuevo capítulo en la novela activa.
- `/chapter open NOV-xxxx CAP-xxxx`: Abre el capítulo directamente en tu editor configurado (Word o Notepad).
- `/chapter edit NOV-xxxx CAP-xxxx`: Modifica el título o contenido de un capítulo.
- `/chapter delete NOV-xxxx CAP-xxxx --confirm`: Elimina un capítulo tras confirmación obligatoria.
- `/chapter publish NOV-xxxx CAP-xxxx --confirm`: Prepara el manuscrito, abre el portal oficial de autor de Wattpad y confirma la publicación.
- `/chapter unpublish NOV-xxxx CAP-xxxx`: Reinvierte el capítulo a estado de borrador local.

### 🔌 Conexiones Externas
- `/connect`: Muestra el estado de las integraciones activas (Word, Notepad, Google Docs, Wattpad).
- `/connect word`: Vincula Microsoft Word (`.docx`) como editor de manuscritos.
- `/connect notepad`: Vincula Bloc de notas (`.txt UTF-8`) como editor de manuscritos.
- `/connect google`: Inicia la autorización con Google Docs mediante flujo seguro OAuth2 HTTPS.
- `/disconnect [word|notepad|google]`: Desconecta una integración.

### 🚀 Publicación y Sincronización
- `/publish`: Panel general del estado de publicación.
- `/publish status`: Distingue cuáles obras son borradores locales y cuáles están publicadas en Wattpad.
- `/publish story NOV-xxxx --confirm`: Prepara la novela y asiste la publicación formal.
- `/publish chapter NOV-xxxx CAP-xxxx --confirm`: Asiste la publicación de un capítulo individual.
- `/sync`: Resumen de sincronización con la base de datos cloud.
- `/sync story NOV-xxxx`: Sincroniza la novela con la nube.
- `/sync chapter NOV-xxxx CAP-xxxx`: Sincroniza un capítulo individual.

### ⚙️ Sistema y Terminal
- `/theme [dark|light|tokyo-night|terminal]`: Cambia el tema visual en tiempo real.
- `/mode [fullscreen|inline]`: Alterna entre pantalla completa (alternate buffer) y modo inline.
- `/help`: Despliega la ayuda organizada por categorías.
- `/version`: Muestra la versión oficial `v1.0.0` y las especificaciones técnicas del entorno.
- `/status`: Estado general del sistema y contexto de trabajo.
- `/clear`: Limpia la pantalla de la terminal.
- `/exit`: Finaliza la sesión restaurando la terminal limpiamente.

---

## 🛠️ Desarrollo y Compilación Local

```bash
# Instalar dependencias
bun install

# Comprobación de tipos TypeScript
bun run typecheck

# Ejecución de la suite completa de pruebas (83 pruebas)
bun test

# Compilación de la CLI nativa
bun run build:cli

# Generación de sumas de integridad SHA-256
bun run build:checksums

# Compilación del servidor backend
bun run build:api
```

---

## 🛡️ Seguridad de Credenciales

- **Cifrado Fuerte Local**: Todas las credenciales sensibles se custodian en `vault.enc` utilizando el estándar criptográfico **AES-256-GCM**.
- **Aislamiento Total**: Las credenciales de Wattpad nunca se comparten con servidores de terceros ni se transmiten a Render.
- **Protección de Datos Personales**: Manuscritos, capítulos y borradores se conservan de forma soberana en tu disco local.

---

© 2026 Wattpad CLI — Herramienta Oficial de Terminal para Autores y Escritores.
