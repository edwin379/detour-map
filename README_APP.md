# 俺たちの青春マップ - Youth Route Mapper

An interactive map visualization of GPX routes with synchronized playback and waypoint revelations. Features an animated opening sequence in brush stroke style.

## Features

- 🗺️ **Interactive MapLibre Map** - View all GPX routes on a beautiful, interactive map
- 🎨 **Social Media UI Design** - Modern, floating bottom panel with route toggles
- ⏱️ **Synchronized Playback** - Play all selected routes simultaneously with precise timestamp-based synchronization
- 📍 **Waypoint Revelations** - Waypoints appear dynamically as the route progresses, with custom styling
- ✨ **Animated Opening** - Beautiful kanji brush stroke animation that fades into the map
- 🎯 **Route Control** - Toggle individual routes on/off with intuitive UI
- ⏱️ **Time Progress Bar** - Visual timeline with play/pause control and seek functionality

## File Structure

```
project/
├── index.html              # Main HTML file
├── styles.css              # All styling
├── gpx-parser.js           # GPX file parsing
├── animation.js            # Opening animation logic
├── map-app.js              # Main application logic
├── server.py               # Local development server
└── gpx/                    # GPX route files
    ├── edwin_ru_7eleven_1.gpx
    ├── Misho_RU_Tenfuji.gpx
    ├── nozomu_ru_shinkashiwa.gpx
    ├── soichi_ru_shogakko.gpx
    ├── Takuya_ru_teimidaikouen.gpx
    ├── Yamato_ru_restaurant.gpx
    └── yoh_ru_cocos.gpx
```

## How to Run

### Option 1: Python (Recommended)
```bash
python server.py
```
Then open http://localhost:8000 in your browser

### Option 2: Node.js (if you have http-server installed)
```bash
npx http-server
```

### Option 3: Using Python's built-in server (Simple)
```bash
python -m http.server 8000
```
Then open http://localhost:8000

### Option 4: Using Live Server (VS Code Extension)
- Install the "Live Server" extension in VS Code
- Right-click index.html and select "Open with Live Server"

## How to Use

1. **Opening Animation**: When you first load the page, watch the animated kanji 俺たちの青春マップ brush strokes
2. **Map View**: After the animation completes, the map will fade in with all routes loaded
3. **Route Selection**: 
   - Click on route icons in the bottom floating panel to toggle routes on/off
   - All routes are enabled by default
4. **Playback Controls**:
   - Click the **Play** (▶) button to start playback
   - Click the **Pause** (⏸) button to pause
   - Drag the progress handle to seek to any point in time
5. **Waypoint Labels**: As routes play, waypoints will appear on the map with their names
6. **Color Coding**: Each route has a unique color for easy identification

## Technical Details

### GPX Parsing
- Reads track points (trkpt) for route paths
- Reads waypoints (wpt) for location markers
- Calculates time spans based on ISO 8601 timestamps
- Interpolates position between points for smooth animation

### Map Features
- **Route Lines**: Colored paths showing each route
- **Current Position Markers**: Circle markers showing current position for each active route
- **Waypoints**: Simple circle markers that appear as routes progress
- **Popups**: Square popup labels with leader lines appear for waypoints

### Synchronization
- All routes play simultaneously using a global timeline
- Local time within each route is calculated relative to its start time
- Position interpolation provides smooth movement between waypoints
- Waypoints appear when reached based on their timestamps

### Animation
- Opening animation uses Canvas API for brush stroke effect
- Kanji characters (俺たち) are larger than the rest of the text
- Smooth fade transition from animation to map
- 3.5-second total animation sequence

## Dependencies

- **MapLibre GL JS** - Open-source map library (CDN)
- **No external npm dependencies** - Pure JavaScript implementation

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 12+)
- Requires JavaScript enabled

## Customization

### Colors
To customize route colors, edit the `generateColor()` function in `gpx-parser.js`

### Map Style
To change the map style, modify the `style` property in the `initMap()` function in `map-app.js`:
```javascript
style: 'https://demotiles.maplibre.org/style.json', // Change this URL
```

### Opening Animation
To modify the animation duration or text, edit the `sequence` array in `animation.js`

### UI Styling
All UI styling is in `styles.css` and is fully customizable with CSS variables support

## Notes

- The application loads all GPX files asynchronously
- If a GPX file fails to load, it will be skipped with a warning in console
- The map auto-centers and zooms to fit all route bounds
- Mobile responsive design is included
- Performance is optimized for up to 7 simultaneous routes

## Troubleshooting

### Map not loading
- Check browser console (F12) for errors
- Ensure you're accessing via http:// not file:// protocol
- Verify the map tiles URL is accessible

### Routes not appearing
- Check that GPX files are in the `/gpx` folder
- Verify GPX file format and timestamps
- Check browser console for parsing errors

### Playback issues
- Ensure all routes have timestamps in ISO 8601 format
- Check that timestamps are in chronological order within each route
- Verify route duration calculations in console

## License

This project is provided as-is for educational and personal use.
