# Arquitectura RepoVerse - SOLID & Clean Code

## Estructura del Proyecto

```
src/
├── core/                    # Núcleo del sistema
│   ├── interfaces/          # Interfaces (ISP, DIP)
│   │   ├── IRenderer.js
│   │   ├── IBackground.js
│   │   ├── IDataSource.js
│   │   └── IUniverseGenerator.js
│   ├── factories/           # Factories (OCP)
│   │   ├── RendererFactory.js
│   │   └── DataSourceFactory.js
│   └── config/              # Configuración centralizada
│       └── AppConfig.js
│
├── rendering/               # Componentes de renderizado
│   ├── scene/
│   │   ├── SceneManager.js  # Gestión de escena 3D
│   │   └── Generators.js    # Generación de objetos
│   ├── background/
│   │   ├── GalaxyRenderer.js      # Shader Galaxy OGL
│   │   ├── StarfieldFallback.js   # Fallback procedimental
│   │   └── BackgroundManager.js   # Gestión de fondo
│   └── effects/
│       └── EffectsManager.js      # Post-processing
│
├── services/                # Servicios externos
│   └── dataSources/
│       └── GitHubDataSource.js   # API GitHub
│
├── ui/                      # Componentes UI
│   ├── hud/
│   │   └── HUDManager.js
│   ├── home/
│   │   └── HomeScreen.js
│   ├── controls/
│   │   └── YearSelector.js
│   └── panels/
│       └── PlanetDetailsPanel.js
│
├── utils/                   # Utilidades
│   ├── ErrorHandler.js
│   └── Logger.js
│
├── mock/                    # Datos mock
│   └── mockData.json
│
├── app.js                   # Orquestador principal
└── main.js                  # Entry point
```

## Principios SOLID Aplicados

### Single Responsibility Principle (SRP)
- **SceneManager**: Solo gestiona la escena 3D
- **Generators**: Solo genera objetos 3D
- **GitHubDataSource**: Solo comunica con GitHub API
- **ErrorHandler**: Solo maneja errores
- **Logger**: Solo logging

### Open/Closed Principle (OCP)
- **RendererFactory**: Extensible para nuevos renderers sin modificar
- **DataSourceFactory**: Extensible para Bitbucket/GitLab sin modificar código existente
- **Interfaces**: Permiten nuevas implementaciones sin cambiar dependencias

### Liskov Substitution Principle (LSP)
- **GalaxyRenderer** y **StarfieldFallback** implementan **IBackground**
- Cualquiera puede sustituir al otro sin romper el sistema

### Interface Segregation Principle (ISP)
- **IRenderer**: Solo métodos de renderizado
- **IBackground**: Solo métodos de fondo
- **IDataSource**: Solo métodos de datos
- Interfaces pequeñas y específicas

### Dependency Inversion Principle (DIP)
- **App** depende de **RendererFactory** (abstracción), no de implementaciones
- **App** usa **fetchUserRepositories** (función), no clase concreta
- Fácil cambiar implementaciones sin afectar dependientes

## Extensibilidad

### Añadir nuevo tipo de planeta
1. Crear función en `Generators.js`: `generateCustomPlanet()`
2. Usar en `SceneManager.generateUniverse()`
3. Sin modificar código existente

### Añadir nueva fuente de datos (Bitbucket)
1. Crear `BitbucketDataSource.js` implementando `IDataSource`
2. Añadir a `DataSourceFactory`
3. Sin modificar código existente

### Añadir nuevo fondo
1. Crear clase implementando `IBackground`
2. Añadir a `RendererFactory.createBackgroundRenderer()`
3. Fallback automático si falla

### Añadir nuevo efecto visual
1. Crear en `rendering/effects/`
2. Integrar en `EffectsManager`
3. Sin afectar otros componentes

## Manejo de Errores

- **ErrorHandler**: Centralizado, consistente
- **Logger**: Estructurado con prefijos
- **Fallbacks**: Galaxy → Starfield, GitHub → Mock Data
- **Nunca bloquea**: Si un componente falla, el resto funciona

## Testing

Cada módulo es testeable independientemente:
- Funciones puras en `Generators.js`
- Clases con dependencias inyectadas
- Interfaces permiten mocks fáciles

