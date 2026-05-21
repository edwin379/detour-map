/**
 * GPX Parser - Loads and parses GPX files
 */
class GPXParser {
    static routeColors = [
        '#FF6B6B',
        '#4ECDC4',
        '#FFA726',
        '#6A5ACD',
        '#F7DC6F',
        '#8BC34A',
        '#FF8A65'
    ];

    static async loadGPXFiles() {
        const gpxFiles = [
            'edwin_ru_7eleven_1.gpx',
            'Misho_RU_Tenfuji.gpx',
            'nozomu_ru_shinkashiwa.gpx',
            'soichi_ru_shogakko.gpx',
            'Takuya_ru_teimidaikouen.gpx',
            'Yamato_ru_restaurant.gpx',
            'yoh_ru_cocos.gpx'
        ];

        const routes = [];

        for (let index = 0; index < gpxFiles.length; index++) {
            const file = gpxFiles[index];
            try {
                const response = await fetch(`gpx/${file}`);
                if (!response.ok) continue;
                
                const text = await response.text();
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(text, 'text/xml');

                const route = GPXParser.parseGPXDocument(xmlDoc, file);
                if (route && route.points.length > 0) {
                    route.color = GPXParser.routeColors[index % GPXParser.routeColors.length];
                    routes.push(route);
                }
            } catch (error) {
                console.warn(`Failed to load ${file}:`, error);
            }
        }

        return routes;
    }

    static parseGPXDocument(xmlDoc, filename) {
        // Get track points
        const trkpts = Array.from(xmlDoc.querySelectorAll('trkpt'));
        
        if (trkpts.length === 0) return null;

        // Extract route name from filename
        const name = filename.replace('.gpx', '').replace(/_/g, ' ');
        
        // Parse points with timestamps
        const points = trkpts.map((pt) => ({
            lat: parseFloat(pt.getAttribute('lat')),
            lon: parseFloat(pt.getAttribute('lon')),
            ele: parseFloat(pt.querySelector('ele')?.textContent || 0),
            time: new Date(pt.querySelector('time')?.textContent || new Date()),
            name: ''
        }));

        // Parse waypoints
        const waypoints = Array.from(xmlDoc.querySelectorAll('wpt')).map((wpt) => ({
            lat: parseFloat(wpt.getAttribute('lat')),
            lon: parseFloat(wpt.getAttribute('lon')),
            name: wpt.querySelector('name')?.textContent || 'Waypoint',
            time: new Date(wpt.querySelector('time')?.textContent || new Date()),
            ele: parseFloat(wpt.querySelector('ele')?.textContent || 0)
        }));

        // Sort points by time
        points.sort((a, b) => a.time - b.time);

        const startTime = points[0].time;
        const endTime = points[points.length - 1].time;
        const duration = endTime - startTime;

        return {
            name,
            filename,
            points,
            waypoints,
            startTime,
            endTime,
            duration,
            color: GPXParser.generateColor(name)
        };
    }

    static generateColor(name) {
        // Generate consistent colors for each route
        const colors = [
            '#FF6B6B',
            '#4ECDC4',
            '#45B7D1',
            '#FFA07A',
            '#98D8C8',
            '#F7DC6F',
            '#BB8FCE'
        ];
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    static interpolatePoint(point1, point2, fraction) {
        const lat = point1.lat + (point2.lat - point1.lat) * fraction;
        const lon = point1.lon + (point2.lon - point1.lon) * fraction;
        const ele = point1.ele + (point2.ele - point1.ele) * fraction;
        
        return { lat, lon, ele };
    }

    static formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}
