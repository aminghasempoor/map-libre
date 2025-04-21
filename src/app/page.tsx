'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import { Map, Marker, Source, Layer } from '@vis.gl/react-maplibre';
import styled from 'styled-components';
import { useEffect, useState } from 'react';
import axios from 'axios';
import {motion, AnimatePresence} from "framer-motion";

const MapWrapper = styled.div`
  height: 100vh;
  width: 100%;
  position: relative;
`;
const MotionOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  font-size: 1.25rem;
  font-weight: bold;
`;

type Coord = [number, number];

export default function HomePage() {
    const [routePoints, setRoutePoints] = useState<Coord[]>([]);
    const [route, setRoute] = useState<any>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [isRouting, setIsRouting] = useState(false);

    const handleMapClick = (e: maplibregl.MapMouseEvent & maplibregl.EventData) => {
        const { lng, lat } = e.lngLat;

        setRoute(null); // clear route on every new click

        setRoutePoints(prev => {
            if (prev.length >= 2) {
                // reset if already have two points
                return [[lng, lat]];
            }
            return [...prev, [lng, lat]];
        });
    };

    // Fetch route when we have 2 points
    useEffect(() => {
        const fetchRoute = async () => {
            if (routePoints.length === 2) {
                const [from, to] = routePoints;
                setIsRouting(true);
                try {
                    const res = await axios.get(
                        `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`
                    );
                    setRoute(res.data.routes[0].geometry);
                } catch (err) {
                    console.error('Error fetching route:', err);
                } finally {
                    setIsRouting(false);
                }
            }
        };
        fetchRoute();
    }, [routePoints]);

    return (
        <MapWrapper>
            <AnimatePresence exitBeforeEnter>
                {(!mapLoaded || isRouting) && (
                    <MotionOverlay
                        key="loader"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                    >
                        {isRouting ? 'Calculating route...' : 'Loading map...'}
                    </MotionOverlay>
                )}
            </AnimatePresence>
            <Map
                onLoad={() => setMapLoaded(true)}
                mapLib={import('maplibre-gl')}
                initialViewState={{
                    longitude: 51.389,
                    latitude: 35.6892,
                    zoom: 12,
                }}
                mapStyle="https://api.maptiler.com/maps/topo-v2/style.json?key=m5eTHjiubOoWI9uX6XPB"
                onClick={handleMapClick}
            >
                {routePoints.map(([lng, lat], index) => (
                    <Marker key={index} longitude={lng} latitude={lat}>
                        <div style={{ fontSize: '20px' }}>
                            {index === 0 ? '🟢' : '🔴'}
                        </div>
                    </Marker>
                ))}

                {route && (
                    <Source id="route" type="geojson" data={{ type: 'Feature', geometry: route }}>
                        <Layer
                            id="route-line"
                            type="line"
                            paint={{
                                'line-color': '#0074D9',
                                'line-width': 4,
                            }}
                        />
                    </Source>
                )}
            </Map>
        </MapWrapper>
    );
}
