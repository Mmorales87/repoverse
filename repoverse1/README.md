# RepoVerse Web

Visualiza tus repositorios de GitHub como un universo 3D interactivo. Cada repositorio se convierte en un planeta con lunas, anillos y efectos visuales dinámicos.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📋 Requisitos

- Node.js 16+ 
- npm o yarn

## 🔑 Tokens y Autenticación

**IMPORTANTE**: Por defecto, el proyecto usa la API pública de GitHub **sin tokens**. No se requieren tokens para usar la aplicación.

### Token Opcional

Si deseas usar un token opcional (para aumentar el rate-limit o acceder a repos privados):

1. Copia `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Agrega tu token en `.env`:
   ```
   VITE_GITHUB_TOKEN=tu_token_aqui
   ```

3. Habilita el token manualmente en la UI (funcionalidad futura).

**Nota**: Para ver repositorios privados se requiere un backend con OAuth - esto no está incluido en esta versión.

## 🎮 Uso

1. Abre la aplicación en tu navegador
2. Ingresa un usuario de GitHub (por defecto: `mmorales87`)
3. Haz clic en "Generar Universo"
4. Explora el universo 3D interactivo

### Parámetros URL

Puedes pre-cargar un usuario usando el parámetro `user`:
```
http://localhost:5173/?user=mmorales87
```

## 📊 Tabla de Correspondencias

| Elemento           | Representa           | Función visual                       |
|-------------------|--------------------|-------------------------------------|
| Sol               | Usuario / organización | Centro del sistema, influencia global, brillo/halo; puede irradiar partículas o pulso de energía |
| Repo              | Planeta            | Unidad central, punto de interacción |
| Commits totales   | Tamaño / masa      | Evolución y actividad global        |
| Forks             | Lunas              | Popularidad / difusión              |
| Branches          | Anillos            | Complejidad interna                 |
| Releases          | Anillos o cápsulas | Hitos importantes                   |
| PRs               | Satélites          | Cambios en revisión                 |
| Issues            | Tormentas / manchas| Problemas pendientes                |
| Watchers          | Halo / brillo      | Atención / popularidad              |
| Contributors      | Partículas / lunas | Comunidad y colaboración            |
| Lenguaje principal| Color / material   | Diferenciación rápida               |
| Actividad reciente| Velocidad / pulso  | Dinamismo / ritmo                   |
| Edad              | Radio orbital      | Timeline espacial                   |

## 🔢 Fórmulas de Mapeo Visual

### Radio del Planeta
```
radius = clamp(log10(totalCommits + 1) * 8.0, 1.6, 18.0)
```
El tamaño del planeta representa la cantidad total de commits.

### Intensidad del Halo
```
haloIntensity = clamp(log10(stars + 1) * 0.6, 0.1, 3.0)
```
El brillo del halo representa la popularidad (estrellas).

### Número de Lunas
```
numMoons = min(round(log2(forks + 1)), 8)
```
Cada luna representa forks del repositorio.

### Velocidad Orbital
```
normalizedRecent = clamp(log10(commitsLast30 + 1) / log10(maxCommitsLast30 + 1), 0, 1)
orbitalSpeed = 0.0005 + normalizedRecent * 0.003
```
La velocidad de órbita representa la actividad reciente.

### Radio Orbital
```
baseRadius = 30
ageFactor = 0.5
orbitalRadius = baseRadius + ageFactor * sqrt(daysSinceCreation)
```
La distancia al sol representa la antigüedad del repositorio.

### Masa Visual (para LensPass)
```
mass = clamp(radius * (1 + log10(totalCommits + 1)), 0.5, 100.0)
```
La masa afecta el efecto de lente gravitacional en el fondo.

### Dimensiones de Anillos (FIX: fuera del planeta)
```
ringInnerGap = max(planetRadiusWorld * 0.05, 0.5)
ringThickness = clamp(branchesCount * 0.2, 0.5, 6.0)
ringInnerRadius = planetRadiusWorld + ringInnerGap
ringOuterRadius = ringInnerRadius + ringThickness
```

### Órbitas de Lunas (FIX: fuera de los anillos)
```
moonBaseGap = max(planetRadiusWorld * 0.15, 1.0)
moonSpacing = max(planetRadiusWorld * 0.12, 0.8)
moonOrbitRadius_i = ringOuterRadius + moonBaseGap + i * moonSpacing
moonSize = clamp(log2(forks+1) * 0.4, 0.2, planetRadiusWorld * 0.4)
```

## 🎨 Características

- **Universo 3D Interactivo**: Navega por tus repositorios como planetas
- **Fondo Dinámico**: Estrellas y nebulosas con parallax reactivo al mouse
- **Efectos Visuales**: Bloom, lensing gravitacional (LensPass)
- **Export PNG**: Descarga el universo completo sin HUD
- **Rate-Limit Handling**: Fallback automático a datos mock
- **HUD Reactivo**: Estadísticas y controles interactivos

## 🐛 Solución de Problemas

### Rate Limit de GitHub

Si alcanzas el rate-limit de la API pública de GitHub:
- La aplicación mostrará un banner de advertencia
- Automáticamente usará datos mock para la demo
- Puedes usar un token opcional para aumentar el límite

### WebGL no soportado

Si tu dispositivo no soporta WebGL:
- Los efectos avanzados se desactivarán automáticamente
- La aplicación seguirá funcionando con renderizado básico

## 📁 Estructura del Proyecto

```
repoverse1/
├── public/
│   └── index.html          # HTML principal
├── src/
│   ├── main.js            # Punto de entrada
│   ├── app.js             # Lógica principal de la app
│   ├── services/
│   │   └── github.js      # Servicio de GitHub API
│   ├── scene/
│   │   ├── sceneManager.js    # Gestor de escena Three.js
│   │   ├── generators.js      # Generadores de objetos 3D
│   │   ├── background.js      # Fondo dinámico
│   │   └── effects.js         # Efectos post-procesamiento
│   ├── ui/
│   │   ├── hud.js         # HUD overlay
│   │   ├── home.js        # Pantalla inicial
│   │   └── shareCard.js   # Cards de información
│   └── mock/
│       └── mockData.json  # Datos mock para demo
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Desarrollo

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
```

## 📝 Notas

- El proyecto usa Three.js para renderizado 3D
- Vite como bundler y servidor de desarrollo
- Sin dependencias de frameworks (vanilla JavaScript)
- Compatible con navegadores modernos (Chrome, Firefox, Safari, Edge)

## 📄 Licencia

Este proyecto es parte de RepoVerse.

## 👤 Usuario de Prueba

El usuario de ejemplo usado en demos y screenshots es: `mmorales87`

