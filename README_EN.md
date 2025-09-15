# 🥞 JianBingMan - Professional Pancake Timer

<div align="center">

[![Language: 中文](https://img.shields.io/badge/Language-中文-red.svg)](README.md) [![Language: English](https://img.shields.io/badge/Language-English-blue.svg)](README_EN.md)

**Professional pancake flipping timer app for perfect pancakes every time!**

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-brightgreen.svg)](https://cc11001100.github.io/JianBingMan/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Material-UI](https://img.shields.io/badge/Material--UI-5.14.20-0081CB.svg?logo=mui)](https://mui.com/)

</div>

## ✨ Introduction

JianBingMan (煎饼侠, "Pancake Hero" in Chinese) is an intelligent timer application designed specifically for pancake making. Whether you're a street food vendor or a cooking enthusiast making delicious pancakes at home, this app helps you master the perfect timing for flipping pancakes, ensuring each one achieves that ideal golden-brown color.

## 🚀 Live Demo

🌟 **[Try JianBingMan Now](https://cc11001100.github.io/JianBingMan/)**

Supports both desktop and mobile devices. Recommended for use on mobile browsers for the best experience.

## 📱 Screenshots

<!-- Mobile interface screenshots will be generated and displayed -->
*Mobile interface screenshots will be generated and showcased through automated testing tools*

## 🎯 Core Features

### ⏱️ Precise Timing
- **Smart Timer**: Default 20-second pancake flipping timer, flexibly adjustable as needed
- **Real-time Progress**: Circular progress bar intuitively displays remaining time  
- **Quick Adjustment**: Support for ±5 second quick time adjustments

### 🔄 Flexible Control
- **Pause/Resume**: Pause and resume timing at any moment
- **One-Click Reset**: Quickly restart a new timing cycle
- **Runtime Adjustment**: Adjust time even during active timing

### 🎚️ Time Calibration
- **Professional Calibration**: Calibrate optimal flipping time through actual pancake testing
- **Smart Synchronization**: Automatically adjust current timing progress after calibration
- **Accurate Recording**: Save your personal optimal flipping time

### 🔊 Multiple Alerts
- **Voice Alerts**: Support custom voice recording and system speech synthesis
- **Sound Effects**: Multiple notification sound options available
- **Vibration Alerts**: Phone vibration notifications (mobile devices)
- **Personalized Settings**: Adjustable volume, speech speed, pitch and other parameters

### 📱 Mobile Optimized
- **Screen Wake Lock**: Prevent phone from locking during timing
- **Responsive Design**: Perfect adaptation to various screen sizes
- **Touch-Friendly**: User interface optimized for touchscreen operations

### 💾 Smart Storage
- **Settings Persistence**: Automatically save personal preference settings
- **History Records**: Record each timing session history
- **Offline Support**: PWA offline usage capability

## 🛠️ Technology Stack

| Technology | Version | Description |
|------------|---------|-------------|
| **React** | 18.2.0 | Modern frontend framework |
| **TypeScript** | 5.2.2 | Type-safe JavaScript |
| **Vite** | 5.0.8 | Fast build tool |
| **Material-UI** | 5.14.20 | Google Material Design component library |
| **Emotion** | 11.11.1 | CSS-in-JS styling solution |

## 📁 Project Structure

```
JianBingMan/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   └── PancakeTimer/   # Main timer components
│   │       ├── PancakeTimer.tsx       # Main timer component
│   │       ├── SettingsDialog.tsx     # Settings dialog
│   │       ├── CalibrationDialog.tsx  # Calibration dialog
│   │       ├── TimeIntervalSelector.tsx # Time selector
│   │       ├── VoiceRecorder.tsx      # Voice recorder
│   │       └── *.css                  # Component styles
│   ├── utils/              # Utility functions
│   │   ├── storage.ts      # Local storage management
│   │   ├── speechSynthesis.ts # Speech synthesis features
│   │   ├── soundEffects.ts # Sound effects management
│   │   └── wakeLock.ts     # Screen wake lock functionality
│   ├── App.tsx             # Main application component
│   ├── main.tsx            # Application entry point
│   └── index.css           # Global styles
├── index.html              # HTML entry file
├── package.json            # Project configuration
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── README.md              # Project documentation
```

## 🚀 Quick Start

### Requirements
- Node.js 16.0+
- npm or yarn

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/cc11001100/JianBingMan.git
   cd JianBingMan
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open Browser**
   Visit `http://localhost:5173` to use the application

### Build & Deploy

**Production Build**
```bash
npm run build
# or
yarn build
```

**Preview Build Result**
```bash
npm run preview
# or
yarn preview
```

**GitHub Pages Deployment**
```bash
npm run build:gh-pages
# After building, deploy the dist directory content to GitHub Pages
```

## 📖 User Guide

### Basic Usage

1. **Set Time**: Use +/- buttons to adjust pancake flipping time
2. **Start Timer**: Click the "Start" button to begin timing
3. **Monitor Progress**: Watch the circular progress bar and countdown display
4. **Flipping Alert**: Receive voice, sound, and vibration alerts when time is up
5. **Continue Timing**: Timer automatically restarts after flipping

### Advanced Features

1. **Time Calibration**: 
   - Click the "Time Calibration" button
   - Actually cook a pancake to test optimal timing
   - Save calibration results as default time

2. **Personalized Settings**:
   - Click "Settings" button to open settings panel
   - Adjust voice, sound effects, vibration and other alert methods
   - Record personal custom reminder voice
   - Adjust volume, speech speed and other parameters

3. **Screen Wake Lock**:
   - Automatically activates screen wake lock when timing starts
   - Light bulb icon in top-right corner shows wake lock status
   - Automatically cancels wake lock when timing stops

## 🎨 Design Features

### User Interface Design
- **Proximity**: Related functions grouped together with clear operational logic
- **Alignment**: All elements neatly aligned with unified visual effects
- **Repetition**: Consistent color schemes and interaction styles
- **Contrast**: Important buttons and status information prominently displayed

### Mobile Optimization
- Button sizes designed specifically for touchscreen operations
- Icons and text adapted for different screen densities
- Support for automatic landscape/portrait orientation
- Optimized touch feedback and visual effects

## 🤝 Contributing

Welcome to submit Issues and Pull Requests to help improve this project!

### Development Environment Setup
1. Fork this repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Standards
- Develop using TypeScript
- Follow ESLint configuration code style
- Each component should have corresponding style files
- Add appropriate comments and documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - Excellent frontend framework
- [Material-UI](https://mui.com/) - Beautiful component library
- [Vite](https://vitejs.dev/) - Fast build tool
- All developers who contributed code and suggestions to this project

## 📞 Contact

For questions or suggestions, feel free to contact us through:

- **GitHub Issues**: [Submit Issues](https://github.com/cc11001100/JianBingMan/issues)
- **Project Homepage**: [GitHub Repository](https://github.com/cc11001100/JianBingMan)

---

<div align="center">
<p>Crafted with care for that perfect pancake moment 🥞</p>
<p>© 2024 JianBingMan - Perfect flipping for every pancake</p>
</div>
