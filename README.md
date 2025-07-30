# CLM LCD Preview

A web-based LCD device simulator for the CLM (Connected Learning Machine) project. This simulator provides an interactive preview of the LCD display states and animations used in the CLM device.

## 🚀 Features

- **Interactive LCD Simulator**: Real-time preview of LCD display states
- **Multiple Flow States**: Navigate through different device states and animations
- **Animation Support**: GIF and PNG transitions with proper timing
- **Sound Effects**: Audio feedback for various states and interactions
- **Responsive Design**: Scales appropriately for different screen sizes
- **Custom Fonts**: Barlow Light font integration for consistent typography

## 📁 Project Structure

```
CLM_LCD Preview/
├── Assets/
│   ├── Battery/           # Battery level indicators
│   ├── game sounds/       # Audio effects
│   ├── Main Gif/          # Primary animations
│   ├── Reference/         # Reference materials
│   └── ...               # Other assets
├── fonts/                 # Custom fonts (Barlow family)
├── Lotties/              # Lottie animation files
├── index.html            # Main HTML file
├── script.js             # Core JavaScript logic
├── styles.css            # Styling
└── README.md            # This file
```

## 🎮 States & Animations

### Ball States
- **Place Ball**: `Place.gif` → `Place0537.png` (plays once, then static)
- **Multiple Balls**: `multiple.gif` → `multiple0537.png` (plays once, then static)
- **Ready State**: `Ready.gif` → `Ready0537.png` (plays once, then static)

### Loading & Error States
- **Loading Animation**: `Loading.gif` (continuous loop)
- **Error States**: 
  - `Error.gif` (2 seconds) → `Error Cycle.gif` (2 seconds) → `Error.png` (static)
  - Error messages with sound effects (`error3.mp3`)
  - Full-screen animations with text overlay

### Error Messages
1. **Firmware Update Failed**
2. **Unit Disconnected**
3. **Unit Overheating**
4. **Calibration Error**
5. **Contact Support**

## 🛠️ Technical Implementation

### Core Technologies
- **HTML5 Canvas**: For LCD display rendering
- **JavaScript**: State management and animations
- **CSS3**: Styling and responsive design
- **Web Audio API**: Sound effect playback

### Key Features
- **State Management**: `flows` object with state transitions
- **DOM Overlays**: GIF/PNG animations overlaid on canvas
- **Font Loading**: Custom Barlow Light font integration
- **Z-Index Management**: Proper layering of elements
- **Timing Control**: Precise animation timing with `setTimeout`

## 🚀 Getting Started

### Prerequisites
- Modern web browser with JavaScript enabled
- Local HTTP server (for font loading)

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone https://github.com/samwhitcomb/CLM-LCD-Preview.git
   cd CLM-LCD-Preview
   ```

2. **Start local server**
   ```bash
   python3 -m http.server 8001
   ```

3. **Open in browser**
   ```
   http://localhost:8001
   ```

## 🎯 Usage

### Navigation
- Use the **Previous** and **Next** buttons to navigate through states
- Select different flows from the dropdown menu
- Watch the ball counter for interactive states

### States Overview
- **Welcome**: Initial device state
- **Shot States**: Ball placement and ready animations
- **Error States**: Various error conditions with animations
- **Loading States**: Progress indicators and transitions

## 🎨 Customization

### Adding New States
1. Add state definition to `flows` object in `script.js`
2. Create corresponding animation files in `Assets/`
3. Update navigation logic if needed

### Modifying Animations
- GIF files: Place in `Assets/Main Gif/`
- PNG files: Static end states for animations
- Sound effects: Add to `Assets/game sounds/`

### Font Changes
- Font files: Place in `fonts/` directory
- Update `@font-face` declarations in `index.html`
- Modify `ctx.font` properties in `script.js`

## 📝 Recent Updates

### Animation Improvements
- ✅ **GIF-to-PNG Transitions**: All animations now end with static PNGs
- ✅ **Proper Timing**: 2-second transitions for smooth animations
- ✅ **Full-Screen Error States**: Error animations now use full width
- ✅ **Sound Integration**: Error states include audio feedback
- ✅ **Font Optimization**: Barlow Light font for better readability

### Technical Fixes
- ✅ **Z-Index Management**: Text appears above animations
- ✅ **Font Loading**: Proper Barlow Light font integration
- ✅ **State Transitions**: Smooth transitions between states
- ✅ **Error Message Correction**: Each error state shows correct message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the CLM (Connected Learning Machine) initiative.

## 👤 Author

**Sam Whitcomb** - [GitHub Profile](https://github.com/samwhitcomb)

---

*Built with ❤️ for the CLM project* 