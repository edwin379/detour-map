#!/usr/bin/env python3
"""
Simple HTTP Server for the GPX Route Mapper
Run this script to serve the website locally
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

PORT = 8000
HANDLER = http.server.SimpleHTTPRequestHandler

# Change to script directory
os.chdir(Path(__file__).parent)

try:
    with socketserver.TCPServer(("", PORT), HANDLER) as httpd:
        url = f"http://localhost:{PORT}"
        print(f"Server running at {url}")
        print("Press Ctrl+C to stop the server")
        
        # Try to open browser automatically
        try:
            webbrowser.open(url)
        except:
            print(f"Please open {url} in your browser")
        
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped")
except OSError as e:
    if "Address already in use" in str(e):
        print(f"Port {PORT} is already in use. Try a different port or kill the process using that port.")
    else:
        print(f"Error: {e}")
