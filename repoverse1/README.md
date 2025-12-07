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

## 🔑 Tokens and Authentication

**IMPORTANT**: By default, the project uses the public GitHub API **without tokens**. No tokens are required to use the application.

### Optional Token

If you want to use an optional token (to increase rate-limit or access private repos):

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your token in `.env`:
   ```
   VITE_GITHUB_TOKEN=your_token_here
   ```

3. Enable the token manually in the UI (future feature).

**Note**: To view private repositories, a backend with OAuth is required - this is not included in this version.

## 🎮 Usage

1. Open the application in your browser
2. Enter a GitHub username
3. Click "Generate Universe"
4. Explore the interactive 3D universe

## 📊 Mapping Table

| Element           | Represents           | Visual Function                       |
|-------------------|---------------------|--------------------------------------|
| Sun               | User / organization | System center, global influence, glow/halo; can radiate particles or energy pulse |
| Repo              | Planet              | Central unit, interaction point      |
| Total commits     | Size / mass         | Evolution and global activity        |
| Forks             | Moons               | Popularity / diffusion               |
| Branches          | Rings               | Internal complexity                  |
| Releases          | Rings or capsules   | Important milestones                 |
| PRs               | Satellites          | Changes under review                 |
| Issues             | Storms / spots       | Pending problems                      |
| Watchers           | Halo / glow         | Attention / popularity                |
| Contributors       | Particles / moons   | Community and collaboration          |
| Main language      | Color / material    | Quick differentiation                 |
| Recent activity    | Speed / pulse       | Dynamism / rhythm                     |
| Age                | Orbital radius      | Spatial timeline                      |

## 🔢 Visual Mapping Formulas

### Planet Radius
```
radius = clamp(log10(totalCommits + 1) * 8.0, 1.6, 18.0)
```
The planet size represents the total number of commits.

### Halo Intensity
```
haloIntensity = clamp(log10(stars + 1) * 0.6, 0.1, 3.0)
```
The halo brightness represents popularity (stars).

### Number of Moons
```
numMoons = min(round(log2(forks + 1)), 8)
```
Each moon represents repository forks.

### Orbital Speed
```
normalizedRecent = clamp(log10(commitsLast30 + 1) / log10(maxCommitsLast30 + 1), 0, 1)
orbitalSpeed = 0.0005 + normalizedRecent * 0.003
```
The orbital speed represents recent activity.

### Orbital Radius
```
baseRadius = 30
ageFactor = 0.5
orbitalRadius = baseRadius + ageFactor * sqrt(daysSinceCreation)
```
The distance from the sun represents repository age.

### Visual Mass (for LensPass)
```
mass = clamp(radius * (1 + log10(totalCommits + 1)), 0.5, 100.0)
```
Mass affects the gravitational lensing effect in the background.

### Ring Dimensions (FIX: outside planet)
```
ringInnerGap = max(planetRadiusWorld * 0.05, 0.5)
ringThickness = clamp(branchesCount * 0.2, 0.5, 6.0)
ringInnerRadius = planetRadiusWorld + ringInnerGap
ringOuterRadius = ringInnerRadius + ringThickness
```

### Moon Orbits (FIX: outside rings)
```
moonBaseGap = max(planetRadiusWorld * 0.15, 1.0)
moonSpacing = max(planetRadiusWorld * 0.12, 0.8)
moonOrbitRadius_i = ringOuterRadius + moonBaseGap + i * moonSpacing
moonSize = clamp(log2(forks+1) * 0.4, 0.2, planetRadiusWorld * 0.4)
```

## 🎨 Features

- **Interactive 3D Universe**: Navigate through your repositories as planets
- **Dynamic Background**: Stars and nebulae with mouse-reactive parallax
- **Visual Effects**: Bloom, gravitational lensing (LensPass)
- **PNG Export**: Download the complete universe without HUD
- **Rate-Limit Handling**: Automatic fallback to mock data
- **Reactive HUD**: Statistics and interactive controls

## 🐛 Troubleshooting

### GitHub Rate Limit

If you reach the GitHub public API rate-limit:
- The application will display a warning banner
- It will automatically use mock data for the demo
- You can use an optional token to increase the limit

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

## 📄 License

This project is part of RepoVerse.
