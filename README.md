<div align="center">

# 🎙️ HrissaPlay

**Stream Tunisian Radio Stations Beautifully**

A modern, responsive desktop application for listening to Tunisian radio stations with auto-update support and professional UI.

[![GitHub Release](https://img.shields.io/github/release/yassindaboussi/HrissaPlay.svg?style=flat-square)](https://github.com/yassindaboussi/HrissaPlay/releases)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![Electron](https://img.shields.io/badge/electron-latest-blue.svg?style=flat-square)](https://www.electronjs.org/)

[🌐 Website](https://yassindaboussi.github.io/HrissaPlay) • [📥 Download](https://github.com/yassindaboussi/HrissaPlay/releases) • [🐛 Issues](https://github.com/yassindaboussi/HrissaPlay/issues)

</div>

---

## ✨ Features

- 🎵 **Live Radio Streaming** - Stream Tunisian radio stations directly
- 🎨 **Modern UI** - Beautiful glassmorphism design with smooth animations
- 🔄 **Auto-Update** - Automatic checking with beautiful progress modal
- 📱 **Fully Responsive** - Works on desktop, tablet, mobile, and widget sizes
- 🎚️ **Audio Visualizer** - Real-time wave visualization synced with audio
- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support
- 🌙 **Dark Theme** - Easy on the eyes, optimized for listening
- 🌍 **Arabic Support** - Full RTL language support

---

## 📻 Available Stations (29 Tunisian Radios)

| Station Name | Station Name | Station Name |
|---|---|---|
| 🎙️ Mosaique FM | 🎙️ Express FM | 🎙️ Jawhara FM |
| 🎙️ Diwan FM | 🎙️ Knooz FM | 🎙️ Zitouna FM |
| 🎙️ Radio Nationale | 🎙️ Sabra FM | 🎙️ Quran FM |
| 🎙️ RTCI | 🎙️ RadioMed FM | 🎙️ Oxygene FM |
| 🎙️ Babnet FM | 🎙️ Radio Tataouine | 🎙️ Radio Sfax |
| 🎙️ Radio Jeunes FM | 🎙️ Radio Kef | 🎙️ Radio Gafsa |
| 🎙️ Karama FM | 🎙️ Ulysse FM | 🎙️ Djerid FM |
| 🎙️ Misk FM | 🎙️ Dream FM | 🎙️ Radio culturelle |
| 🎙️ Radio Nabeul | 🎙️ Oasis FM | 🎙️ Radio monastir |
| 🎙️ Cap FM | 🎙️ Radio Orient | |

**To add or modify stations**, edit `src/renderer/scripts/stations.js`

---

## 🚀 Quick Start

### Download
Get the latest version from [GitHub Releases](https://github.com/yassindaboussi/HrissaPlay/releases):
- **Windows**: `HrissaPlay-Setup.exe`
- **macOS**: `HrissaPlay.dmg`
- **Linux**: `HrissaPlay.AppImage`

### Install & Run
1. Download the installer for your platform
2. Install the application
3. Launch HrissaPlay
4. Select a station and enjoy! 🎵

---

## 📥 Installation from Source

### Prerequisites
- Node.js 16+
- npm or yarn

### Steps
```bash
# Clone repository
git clone https://github.com/yassindaboussi/HrissaPlay.git
cd HrissaPlay

# Install dependencies
npm install

# Start development
npm start

# Build for your platform
npm run build
```

---

## 🎛️ Usage

1. **Select a Station** - Click on any radio station
2. **Control Playback** - Use play, pause, restart, or stop buttons
3. **Adjust Volume** - Use the volume slider
4. **Watch Visualizer** - Enjoy the real-time wave animation

---

## 🔄 Auto-Updates

The app automatically checks for updates:
- First check: 5 seconds after startup
- Regular checks: Every 24 hours
- Users see a beautiful modal when updates are available
- Downloads and installs automatically in the background

---

## 💻 Build for Distribution

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📁 Project Structure

```
📦 HrissaPlay/
├── 📂 src/
│   ├── 📂 main/                      # ⚙️ Electron Main Process
│   │   ├── 📄 main.js               # 🚀 App entry point & window setup
│   │   ├── 📄 auto-updater.js       # 🔄 Auto-update logic
│   │   └── 📄 preload.js            # 🔐 IPC security layer
│   │
│   └── 📂 renderer/                 # 🎨 Frontend UI Code
│       ├── 📂 scripts/
│       │   ├── 📄 player.js         # 🎵 Audio player logic
│       │   ├── 📄 visualizer.js     # 📊 Wave visualizer
│       │   ├── 📄 stations.js       # 📻 Station data (29 stations)
│       │   ├── 📄 ui.js             # 🖱️ UI interactions
│       │   ├── 📄 version.js        # 📌 Version display
│       │   └── 📄 updater-ui.js     # 🔔 Update modal UI
│       │
│       └── 📂 styles/
│           ├── 📄 main.css          # 🎨 Main styles
│           ├── 📄 player.css        # 🎚️ Player styles
│           └── 📄 visualizer.css    # 📈 Visualizer styles
│
├── 📂 docs/                         # 🌐 Website
│   └── 📄 index.html               # 💻 Landing page
│
├── 📂 .github/workflows/            # ⚙️ CI/CD Pipelines
│   ├── 📄 ci.yml                   # ✅ Build & test workflow
│   └── 📄 release.yml              # 🚀 Release automation
│
├── 📂 public/                       # 🖼️ Static Assets
│   ├── 📂 icons/                   # 🎯 App icons
│   └── 📂 images/                  # 🎨 Station logos
│
├── 📄 index.html                    # 📱 Main HTML file
├── 📄 package.json                  # 📦 Dependencies & config
├── 📄 README.md                     # 📖 Documentation
└── 📄 LICENSE                       # ⚖️ MIT License
```

---

## 🤝 Contributing

Found a bug or have an idea? [Open an issue](https://github.com/yassindaboussi/HrissaPlay/issues)

---

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

---

## 👨‍💻 Author

**Yassin Daboussi**
- GitHub: [@yassindaboussi](https://github.com/yassindaboussi)
- LinkedIn: [yassindaboussi](https://linkedin.com/in/yassindaboussi)

---

<div align="center">

Made with ❤️ for Tunisian radio lovers

[⭐ Star on GitHub](https://github.com/yassindaboussi/HrissaPlay)

</div>
