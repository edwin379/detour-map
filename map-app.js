/**
 * Main Map Application
 */
class MapApp {
    constructor() {
        this.map = null;
        this.routes = [];
        this.activeRoutes = new Set();
        this.isPlaying = false;
        this.currentTime = 0;
        this.startTime = null;
        this.playStartTime = null;
        this.routeMarkers = {};
        this.routePopups = {};
        this.visibleWaypoints = new Set();
        this.init();
    }

    async init() {
        // Load GPX files
        this.routes = await GPXParser.loadGPXFiles();
        
        if (this.routes.length === 0) {
            console.error('No routes loaded');
            return;
        }

        // Calculate global time span
        const allStartTimes = this.routes.map(r => r.startTime.getTime());
        const allEndTimes = this.routes.map(r => r.endTime.getTime());
        this.globalStartTime = new Date(Math.min(...allStartTimes));
        this.globalEndTime = new Date(Math.max(...allEndTimes));
        this.activeStartTime = new Date(this.globalStartTime);
        this.activeEndTime = new Date(this.globalEndTime);
        this.totalDuration = this.activeEndTime - this.activeStartTime;

        // Initialize map
        this.initMap();

        // Create UI
        this.createRoutesList();
        this.setupTimebar();
        this.setupEventListeners();

        // Activate all routes by default
        this.routes.forEach((route, index) => {
            this.toggleRoute(index, true);
        });

        this.updateActiveTimeBounds();
        this.updateTimeDisplay();

        // Show map when the splash animation is complete
        setTimeout(() => {
            document.getElementById('map-container').classList.remove('hidden');
        }, 5800);
    }

    initMap() {
        let minLat = Infinity, maxLat = -Infinity;
        let minLon = Infinity, maxLon = -Infinity;

        this.routes.forEach(route => {
            route.points.forEach(point => {
                minLat = Math.min(minLat, point.lat);
                maxLat = Math.max(maxLat, point.lat);
                minLon = Math.min(minLon, point.lon);
                maxLon = Math.max(maxLon, point.lon);
            });
        });

        this.map = new maplibregl.Map({
            container: 'map',
            style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
            center: [(minLon + maxLon) / 2, (minLat + maxLat) / 2],
            zoom: 12,
            pitch: 20,
            bearing: 0
        });

        this.map.on('load', () => {
            this.addRouteSources();
            this.addRouteLayers();

            const bounds = [
                [minLon, minLat],
                [maxLon, maxLat]
            ];
            this.map.fitBounds(bounds, { padding: 40, maxZoom: 18, duration: 1500 });
        });
    }

    addRouteSources() {
        this.routes.forEach((route, index) => {
            // Create GeoJSON from route points
            const coordinates = route.points.map(p => [p.lon, p.lat]);
            const lineString = {
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: coordinates
                },
                properties: {
                    routeIndex: index
                }
            };

            this.map.addSource(`route-${index}`, {
                type: 'geojson',
                data: lineString
            });

            // Add waypoint source
            const waypointFeatures = route.waypoints.map((wp, wpIdx) => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [wp.lon, wp.lat]
                },
                properties: {
                    routeIndex: index,
                    waypointIndex: wpIdx,
                    name: wp.name
                }
            }));

            this.map.addSource(`waypoints-${index}`, {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: waypointFeatures
                }
            });
        });
    }

    addRouteLayers() {
        this.routes.forEach((route, index) => {
            this.map.addLayer({
                id: `route-line-outline-${index}`,
                type: 'line',
                source: `route-${index}`,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#000',
                    'line-width': 8,
                    'line-opacity': 0.12
                }
            });

            this.map.addLayer({
                id: `route-line-${index}`,
                type: 'line',
                source: `route-${index}`,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': route.color,
                    'line-width': 4,
                    'line-opacity': 0.95,
                    'line-blur': 0.5
                }
            });

            this.map.addLayer({
                id: `waypoints-${index}`,
                type: 'circle',
                source: `waypoints-${index}`,
                paint: {
                    'circle-radius': 5,
                    'circle-color': '#ffffff',
                    'circle-stroke-color': route.color,
                    'circle-stroke-width': 2,
                    'circle-opacity': 0.7
                }
            });

            this.map.on('click', `waypoints-${index}`, (e) => {
                const feature = e.features[0];
                const coords = feature.geometry.coordinates;
                const name = feature.properties.name;

                if (!this.routePopups[`waypoint-${index}-${feature.properties.waypointIndex}`]) {
                    const popup = new maplibregl.Popup({ offset: [0, -12] })
                        .setLngLat(coords)
                        .setHTML(`<div class="waypoint-popup">${name}</div>`)
                        .addTo(this.map);

                    this.routePopups[`waypoint-${index}-${feature.properties.waypointIndex}`] = popup;
                }
            });

            this.map.on('mouseenter', `waypoints-${index}`, () => {
                this.map.getCanvas().style.cursor = 'pointer';
            });
            this.map.on('mouseleave', `waypoints-${index}`, () => {
                this.map.getCanvas().style.cursor = '';
            });
        });
    }

    createRoutesList() {
        const routesList = document.getElementById('routes-list');
        routesList.innerHTML = '';

        this.routes.forEach((route, index) => {
            const card = document.createElement('div');
            card.className = 'route-card';

            const item = document.createElement('div');
            item.className = 'route-item active';
            item.dataset.routeIndex = index;
            item.title = route.name;
            item.style.background = `linear-gradient(135deg, ${route.color} 0%, ${this.adjustColor(route.color, 0.7)} 100%)`;

            if (/soichi/i.test(route.filename) || /soichi/i.test(route.name)) {
                const image = document.createElement('img');
                image.src = '図1.png';
                image.alt = route.name;
                item.appendChild(image);
            } else {
                item.textContent = route.name.substring(0, 3);
            }

            item.addEventListener('click', () => {
                this.toggleRoute(index);
            });

            const label = document.createElement('div');
            label.className = 'route-label';
            label.textContent = route.name;

            card.appendChild(item);
            card.appendChild(label);
            routesList.appendChild(card);
        });
    }

    adjustColor(color, factor) {
        const usePound = color[0] === '#';
        const col = usePound ? color.slice(1) : color;
        const num = parseInt(col, 16);
        const amt = Math.round(2.55 * factor);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 +
            (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255))
            .toString(16).slice(1);
    }

    toggleRoute(index, forceState = null) {
        const routeItem = document.querySelector(`[data-route-index="${index}"]`);
        
        if (forceState !== null) {
            if (forceState) {
                this.activeRoutes.add(index);
                routeItem.classList.add('active');
                routeItem.classList.remove('disabled');
            } else {
                this.activeRoutes.delete(index);
                routeItem.classList.remove('active');
                routeItem.classList.add('disabled');
            }
        } else {
            if (this.activeRoutes.has(index)) {
                this.activeRoutes.delete(index);
                routeItem.classList.remove('active');
                routeItem.classList.add('disabled');
            } else {
                this.activeRoutes.add(index);
                routeItem.classList.add('active');
                routeItem.classList.remove('disabled');
            }
        }

        this.updateRouteVisibility();
        this.updateActiveTimeBounds();
        this.updateTimeDisplay();
    }

    updateRouteVisibility() {
        this.routes.forEach((route, index) => {
            const isActive = this.activeRoutes.has(index);
            
            if (this.map.getLayer(`route-line-${index}`)) {
                this.map.setLayoutProperty(`route-line-${index}`, 'visibility', isActive ? 'visible' : 'none');
            }
            if (this.map.getLayer(`waypoints-${index}`)) {
                this.map.setLayoutProperty(`waypoints-${index}`, 'visibility', isActive ? 'visible' : 'none');
            }
        });

        this.updateCurrentMarkers();
    }

    setupTimebar() {
        document.getElementById('total-time').textContent = GPXParser.formatTime(this.totalDuration);
        
        const progressBar = document.getElementById('progress-bar');
        progressBar.addEventListener('click', (e) => {
            if (!this.totalDuration) return;
            const rect = progressBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.currentTime = percent * this.totalDuration;
            this.updateTimeDisplay();
            this.updateCurrentMarkers();
        });

        const handle = document.getElementById('progress-handle');
        let isDragging = false;

        handle.addEventListener('mousedown', () => {
            isDragging = true;
            this.isPlaying = false;
            document.getElementById('play-btn').classList.remove('playing');
            document.getElementById('play-btn').textContent = '▶';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const rect = document.getElementById('progress-bar').getBoundingClientRect();
                const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                this.currentTime = percent * this.totalDuration;
                this.updateTimeDisplay();
                this.updateCurrentMarkers();
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    setupEventListeners() {
        const playBtn = document.getElementById('play-btn');
        playBtn.addEventListener('click', () => {
            this.togglePlayback();
        });
    }

    togglePlayback() {
        if (!this.totalDuration) return;

        this.isPlaying = !this.isPlaying;
        const playBtn = document.getElementById('play-btn');

        if (this.isPlaying) {
            playBtn.classList.add('playing');
            playBtn.textContent = '⏸';
            this.playStartTime = Date.now() - this.currentTime;
            this.animate();
        } else {
            playBtn.classList.remove('playing');
            playBtn.textContent = '▶';
        }
    }

    animate() {
        if (!this.isPlaying) return;

        this.currentTime = Date.now() - this.playStartTime;

        if (this.currentTime >= this.totalDuration) {
            this.currentTime = this.totalDuration;
            this.isPlaying = false;
            document.getElementById('play-btn').classList.remove('playing');
            document.getElementById('play-btn').textContent = '▶';
        }

        this.updateTimeDisplay();
        this.updateCurrentMarkers();

        if (this.isPlaying) {
            requestAnimationFrame(() => this.animate());
        }
    }

    updateTimeDisplay() {
        document.getElementById('current-time').textContent = GPXParser.formatTime(this.currentTime);
        document.getElementById('total-time').textContent = GPXParser.formatTime(this.totalDuration);

        const progress = this.totalDuration ? this.currentTime / this.totalDuration : 0;
        document.getElementById('progress-fill').style.width = (progress * 100) + '%';
        document.getElementById('progress-handle').style.left = (progress * 100) + '%';
    }

    updateActiveTimeBounds() {
        if (!this.activeRoutes.size) {
            this.activeStartTime = new Date();
            this.activeEndTime = new Date();
            this.totalDuration = 0;
            this.currentTime = 0;
            return;
        }

        const activeStartTimes = Array.from(this.activeRoutes).map(index => this.routes[index].startTime.getTime());
        const activeEndTimes = Array.from(this.activeRoutes).map(index => this.routes[index].endTime.getTime());

        this.activeStartTime = new Date(Math.min(...activeStartTimes));
        this.activeEndTime = new Date(Math.max(...activeEndTimes));
        this.totalDuration = this.activeEndTime - this.activeStartTime;

        if (this.currentTime > this.totalDuration) {
            this.currentTime = this.totalDuration;
        }
    }

    updateCurrentMarkers() {
        // Clear old markers
        Object.values(this.routeMarkers).forEach(marker => {
            if (marker.marker) marker.marker.remove();
        });
        this.routeMarkers = {};

        if (!this.activeRoutes.size) return;

        const globalTimeOffset = this.activeStartTime.getTime();

        this.activeRoutes.forEach(routeIndex => {
            const route = this.routes[routeIndex];
            const routeStartTime = route.startTime.getTime();
            
            const localTime = this.currentTime + globalTimeOffset;
            let routeElapsed = localTime - routeStartTime;

            if (routeElapsed >= 0) {
                routeElapsed = Math.min(routeElapsed, route.duration);

                const point = this.getPointAtTime(route, routeElapsed);
                if (point) {
                    this.createRouteMarker(routeIndex, point);
                }

                this.updateVisibleWaypoints(routeIndex, routeElapsed);
            }
        });
    }

    getPointAtTime(route, elapsedTime) {
        // Find the two points that bracket the elapsed time
        let startIdx = 0;
        for (let i = 1; i < route.points.length; i++) {
            const pointTime = route.points[i].time.getTime() - route.startTime.getTime();
            if (pointTime > elapsedTime) {
                startIdx = i - 1;
                break;
            }
            if (i === route.points.length - 1) {
                startIdx = i;
            }
        }

        const point1 = route.points[startIdx];
        const point2 = startIdx < route.points.length - 1 ? route.points[startIdx + 1] : point1;

        if (point1 === point2) {
            return point1;
        }

        const time1 = point1.time.getTime() - route.startTime.getTime();
        const time2 = point2.time.getTime() - route.startTime.getTime();
        const fraction = (elapsedTime - time1) / (time2 - time1);

        return GPXParser.interpolatePoint(point1, point2, Math.max(0, Math.min(1, fraction)));
    }

    createRouteMarker(routeIndex, point) {
        const route = this.routes[routeIndex];
        const key = `route-${routeIndex}`;

        // Create circle marker element
        const markerEl = document.createElement('div');
        markerEl.style.width = '12px';
        markerEl.style.height = '12px';
        markerEl.style.backgroundColor = route.color;
        markerEl.style.borderRadius = '50%';
        markerEl.style.border = '2px solid white';
        markerEl.style.boxShadow = `0 2px 8px rgba(0, 0, 0, 0.3)`;

        const marker = new maplibregl.Marker({ element: markerEl })
            .setLngLat([point.lon, point.lat])
            .addTo(this.map);

        this.routeMarkers[key] = { marker, point };
    }

    updateVisibleWaypoints(routeIndex, routeElapsed) {
        // Waypoints only appear when user clicks on them
        // This function is kept for compatibility but does nothing
    }
}

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for splash screen animation to finish
    setTimeout(() => {
        window.mapApp = new MapApp();
    }, 100);
});
