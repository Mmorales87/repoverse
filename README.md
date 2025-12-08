# RepoVerse Web

Visualize your GitHub repositories as an interactive 3D universe. Each repository becomes a planet with moons, rings, and dynamic visual effects.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 📋 Requirements

- Node.js 16+ 
- npm or yarn

## 🔑 GitHub API

**No authentication required!** This project uses the public GitHub API without tokens, just like [GithubCity](https://github.com/unixzii/GithubCity). The rate limit is **60 requests/hour per IP address**, which is sufficient for most use cases.

If you reach the rate limit, the application will automatically fall back to mock data for demonstration purposes.

## 🎮 Usage

1. Open the application in your browser
2. Enter a GitHub username
3. Click "Generate Universe"
4. Explore the interactive 3D universe

## 📊 Mapping Table

| Element           | Represents           | Visual Function                       |
|-------------------|---------------------|--------------------------------------|
| Sun               | User / organization | System center, global influence, particles; can radiate particles or energy pulse |
| Repo              | Planet              | Central unit, interaction point      |
| Size (KB)         | Planet radius / mass | Repository size determines planet size |
| Branches          | Orbital spheres     | Internal complexity (orbital spheres around planet) |
| PRs               | GLTF rockets (satellites) | Changes under review (orbital rockets) |
| Comets            | Recent commits (24-48h) | Rockets crossing system for recent activity |
| Main language      | Color / material    | Quick differentiation                 |
| Recent activity    | Orbital speed       | Dynamism / rhythm                     |
| Age                | Orbital radius      | Spatial timeline                      |
| Forks             | Planets with ISS (orbital station) | Forks appear as planets in shared orbit, each with an ISS orbiting around it |
| PRs from fork to original | Astronaut | Astronauts move in elliptical trajectory connecting fork to original repository |
| Releases          | Rings or capsules   | 🚧 Planned for future updates |
| Issues             | Storms / spots       | 🚧 Planned for future updates |
| Watchers           | Halo / glow         | 🚧 Planned for future updates |
| Contributors       | Particles / moons   | 🚧 Planned for future updates |

## 🔢 Visual Mapping Formulas

### Planet Radius
```
radius = clamp(log10(size) * 1.5, 1.6, 18.0)
```
The planet size represents the repository size in KB (not total commits).

### Orbital Speed
```
normalizedRecent = clamp(log10(commitsLast30 + 1) / log10(maxCommitsLast30 + 1), 0, 1)
orbitalSpeed = 0.005 + normalizedRecent * 0.005
```
The orbital speed represents recent activity.

### Orbital Radius
```
baseRadius = 30
ageFactor = 0.5
orbitalRadius = baseRadius + ageFactor * sqrt(daysSinceCreationAtSnapshot)
```
The distance from the sun represents repository age.

### Visual Mass (for LensPass)
```
mass = clamp(radius * (1 + log10(size)), 0.5, 100.0)
```
Mass affects the gravitational lensing effect in the background.

### Branch Orbit Dimensions
```
branchBaseGap = max(planetRadius * 0.15, 1.0)
branchSpacing = max(planetRadius * 0.12, 0.8)
branchOrbitRadius_i = planetRadius + branchBaseGap + i * branchSpacing
branchSize = clamp(log2(branchesCount) * 0.4, 0.2, planetRadius * 0.4)
```
Branches are rendered as orbital spheres around the planet.

### Halo Intensity
```
haloIntensity = clamp(log10(stars) * 0.6, 0.1, 3.0)
```
🚧 Planned for future updates - Currently calculated but not used in rendering.

### Number of Moons
```
numMoons = min(round(log2(forks + 1)), 8)
```
🚧 Planned for future updates - Moons will represent repository forks.

## 🎨 Features

- **Interactive 3D Universe**: Navigate through your repositories as planets
- **Dynamic Background**: Stars and nebulae with mouse-reactive parallax
- **Visual Effects**: Bloom, gravitational lensing (LensPass)
- **PNG Export**: Download the complete universe without HUD
- **Rate-Limit Handling**: Automatic fallback to mock data
- **Reactive HUD**: Statistics and interactive controls

## 🐛 Troubleshooting

### GitHub Rate Limit

If you reach the GitHub public API rate-limit (60 requests/hour per IP):
- The application will display a warning banner
- It will automatically use mock data for the demo
- Wait an hour for the rate limit to reset, or try from a different network

### WebGL Not Supported

If your device doesn't support WebGL:
- Advanced effects will be automatically disabled
- The application will continue working with basic rendering

## 📁 Project Structure

```
repoverse1/
├── public/
│   └── index.html          # Main HTML
├── src/
│   ├── main.js            # Entry point
│   ├── app.js             # Main app logic
│   ├── services/
│   │   └── github.js      # GitHub API service
│   ├── scene/
│   │   ├── sceneManager.js    # Three.js scene manager
│   │   ├── generators.js      # 3D object generators
│   │   ├── background.js       # Dynamic background
│   │   └── effects.js         # Post-processing effects
│   ├── ui/
│   │   ├── hud.js         # HUD overlay
│   │   ├── home.js        # Home screen
│   │   └── shareCard.js   # Information cards
│   └── mock/
│       └── mockData.json  # Mock data for demo
├── package.json
├── vite.config.js
└── README.md
```

## 🛠️ Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview build
npm run preview
```

## 📝 Notes

- The project uses Three.js for 3D rendering
- Vite as bundler and development server
- No framework dependencies (vanilla JavaScript)
- Compatible with modern browsers (Chrome, Firefox, Safari, Edge)

## 🌐 GitHub Pages

This project is configured to deploy automatically to GitHub Pages using GitHub Actions.

### Automatic Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys the site when you push to the `main` or `master` branch.

**To enable GitHub Pages:**

1. Go to your repository settings on GitHub
2. Navigate to **Pages** in the left sidebar
3. Under **Source**, select **GitHub Actions**
4. The site will be available at: `https://[your-username].github.io/repoverse/`

### Manual Deployment

If you prefer to deploy manually:

```bash
# Build the project
npm run build

# The dist/ folder contains the built files
# Upload the contents of dist/ to your GitHub Pages branch
```

### Configuration

The base path is configured in `vite.config.js`. If your repository name is different from `repoverse`, update the `REPO_NAME` variable in the config file.

## 📄 License

This project is part of RepoVerse.
