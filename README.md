# RepoVerse

Your Git Universe. Reimagined - 3D visualization of GitHub and Bitbucket repositories

## Description

RepoVerse is a Flutter Web application that creates a beautiful 3D universe visualization of your GitHub and Bitbucket repositories. Each repository becomes a planet orbiting in space, with visualizations based on repository activity, languages, and other metrics.

## Visual Design

The 3D universe uses a rich visual language to represent different repository metrics:

| Elemento           | Representa           | Función visual                       |
|-------------------|---------------------|-------------------------------------|
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
| Edad              | Radio orbital      | Timeline espacial                    |

### Current Implementation

Currently implemented visual elements:
- **Planets (Repositories)**: Colored spheres representing repositories, with color based on primary programming language
- **Moons (Forks)**: Small gray spheres orbiting around planets, representing the number of forks
- **Rings (Branches)**: Semi-transparent colored rings around planets, representing complexity (based on commit count as a proxy for branches)
- **Stars**: White dots in the background creating a starfield effect

### Controls

- **Left-click + Drag**: Rotate the camera around the scene
- **Right-click + Drag**: Pan the camera (move the view)
- **Scroll Wheel**: Zoom in/out
- **Reset Button**: Return camera to initial position

## Getting Started

### Prerequisites

- Flutter SDK (3.10.1 or higher)
- Dart SDK
- Chrome browser (for web development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd repoverse
```

2. Install dependencies:
```bash
flutter pub get
```

3. Run the application:
```bash
flutter run -d chrome
```

## Configuration

### Environment Variables

The application can use GitHub and Bitbucket tokens to fetch your repositories. Tokens are optional - the app will work in demo mode with mock data if no tokens are provided.

#### Setting up tokens (optional)

1. Create `assets/.env` file (copy from `assets/.env.example` if it exists):
```bash
cp assets/.env.example assets/.env
```

2. Edit `assets/.env` and add your tokens:
```
GITHUB_TOKEN=your_github_token_here
BITBUCKET_TOKEN=your_bitbucket_token_here
```

#### Getting a GitHub Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Generate a new token (classic)
3. Select scope: `public_repo` (for public repositories)
4. Copy the token and add it to `assets/.env`

#### Getting a Bitbucket Token

1. Go to [Bitbucket Settings > App passwords](https://bitbucket.org/account/settings/app-passwords/)
2. Create a new app password
3. Select permission: `Repositories: Read`
4. Copy the password and add it to `assets/.env`

### Important Security Note

**⚠️ WARNING: Do not put permanent tokens in frontend code for production!**

The `.env` file is bundled with the Flutter web app, which means tokens are visible in the client-side code. This is acceptable for:
- Local development
- Personal/demo projects
- Testing

For production deployments, consider:
- Using a backend service (e.g., Firebase Functions, AWS Lambda) to proxy API requests
- Implementing OAuth flow for user authentication
- Using environment variables at build time (not bundled in the app)

## Usage

1. Launch the app: `flutter run -d chrome`
2. Enter your GitHub username (optional)
3. Enter your Bitbucket username (optional)
4. Click "Generate Universe" to create your 3D visualization

### Demo Mode

If no tokens are provided, the app runs in demo mode with mock repository data. This is perfect for:
- Testing the 3D visualization
- Demonstrating the app without API access
- Development when rate limits are reached

## Troubleshooting

### Rate Limit Errors

If you see a "Rate limit reached" error:

**GitHub:**
- Unauthenticated requests: 60 requests/hour
- Authenticated requests: 5,000 requests/hour
- Solution: Add a `GITHUB_TOKEN` to `assets/.env` or wait for the rate limit to reset

**Bitbucket:**
- Rate limits vary by account type
- Solution: Add a `BITBUCKET_TOKEN` to `assets/.env` or wait for the rate limit to reset

The app will automatically fall back to mock data if rate limits are reached.

### Three.js Not Loading

If you see a "Three.js failed to load" error:

1. Check the browser console for JavaScript errors
2. Verify your internet connection (Three.js loads from CDN)
3. Try refreshing the page
4. Check that `web/index.html` includes the Three.js script tag

The app will retry loading Three.js up to 5 times before showing an error.

### Environment File Not Found

If you see warnings about `.env` file not found:

- This is normal if you haven't created `assets/.env`
- The app will work in demo mode without tokens
- Create `assets/.env` only if you want to use real API data

### Build Errors

If you encounter build errors:

1. Run `flutter clean`
2. Run `flutter pub get`
3. Delete `build/` directory if it exists
4. Try building again: `flutter run -d chrome`

## Project Structure

```
lib/
├── core/              # Core services and models
│   ├── github/       # GitHub API service
│   ├── bitbucket/    # Bitbucket API service
│   └── models/       # Data models
├── engine/           # Three.js rendering engine
│   ├── generators/  # 3D object generators
│   └── effects/     # Visual effects
└── ui/               # Flutter UI components
    ├── screens/      # Main screens
    └── widgets/      # Reusable widgets

web/
├── index.html        # HTML entry point
└── three_bridge.js   # JavaScript bridge for Three.js

assets/
└── .env              # Environment variables (not in git)
```

## Development

### Running Tests

```bash
flutter test
```

### Building for Production

```bash
flutter build web
```

The output will be in `build/web/`.

## Technologies Used

- **Flutter** - UI framework
- **Three.js** - 3D graphics library
- **Dart** - Programming language
- **GitHub API** - Repository data
- **Bitbucket API** - Repository data

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
