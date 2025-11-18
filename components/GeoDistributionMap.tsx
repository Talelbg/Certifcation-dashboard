import React, { useState } from 'react';
import { CountryCoordinates, COUNTRY_COORDINATES } from './countryCoordinates';

interface GeoData {
    name: string;
    developers: number;
}

interface GeoDistributionMapProps {
    geoData: GeoData[];
}

const WorldMapSVG = () => (
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 400" className="w-full h-full">
        <path d="M400,0L400,0C179.086,0,0,179.086,0,400h0v0h800V0H400z" fill="#1F2937"/>
        <path d="M400,0L400,0C179.086,0,0,179.086,0,400h0v0h800V0H400z" fill="#111827" transform="scale(1, -1) translate(0, -400)"/>
        <g fill="#374151" stroke="#1F2937" strokeWidth="0.5">
            <path d="M392.2,233.2l-0.5,0.4l-1.3-0.4l-1.3-1.3l-1.9,0.2l-0.5,1.1l-1.3,0.4l-2,1.3l-2.6-0.2l-2.4-1.3l-1-0.2l-1.1,0.5l-0.7,1.7 l-0.4,1.1l-1.7,0.7l-0.5-1.1l-1.1-0.4l-1.1,0.5l-1.7,2l-2.2,1.1l-1,1.1l-1.5,0.4l-0.9,1.1l-0.9,2l-1.5,1.5l-2,0.9l-1.1,1.1 l-1.1,2.2l-0.2,2.2l0.7,1.7l0.2,2l-1.3,1.5l-1.5,0.7l0,2.2l-0.7,1.1l-1.5,0.4l-0.7,0.9l-1.5,0.4l-0.5,1.1l-0.4,1.1l-0.4,0.7 l-1.3,1.1l-1.9,0.7l-1.3,0.7l-0.9,1.3l-0.5,1.3l0.4,1.1l0.7,0.9l1.7,1.1l0.5,1.1l0.9,0.9l0.9,0.5l1.3,0.5l1.1,0.7l0.5,1.1 l1.3,1.3l0.9,0.9l1.5,0.7l0.5,0.7l0.5,0.9l-0.4,0.9l-0.2,0.7l-0.5,0.5l-0.5,0.7l-0.9,0.5l-1.3,0.2l-1.3,0.2l-0.9-0.2 l-0.9-0.2l-0.7-0.5l-0.5-0.5l-0.5-0.7l-0.2-0.5l0-0.7l0.2-0.5l0.4-0.5l0.4-0.4l0.2-0.5l-0.2-0.4l-0.2-0.4l-0.4-0.2 l-0.4-0.2l-0.4,0l-0.5,0l-0.5-0.2l-0.4-0.2l-0.4-0.4l-0.2-0.4l-0.4-0.5l-0.2-0.5l-0.2-0.7l-0.2-0.7l-0.2-0.9l0-0.7 l0-0.9l0.2-0.7l0.2-0.7l0.4-0.7l0.2-0.5l0.4-0.5l0.4-0.4l0.4-0.4l0.5-0.2l0.5-0.2l0.5-0.2l0.5-0.2l0.7-0.2l0.5-0.2 l0.5-0.2l0.7,0l0.7,0l0.7-0.2l0.7-0.2l0.7-0.2l0.5-0.2l0.5-0.2l0.7-0.4l0.5-0.2l0.4-0.4l0.4-0.4l0.2-0.4l0.2-0.5 l0.2-0.5l0.2-0.5l0.2-0.7l0-0.7l0-0.7l-0.2-0.7l-0.2-0.7l-0.2-0.5l-0.2-0.5l-0.2-0.5l-0.2-0.4l-0.2-0.4 l-0.4-0.4l-0.4-0.2l-0.4-0.2l-0.5-0.2l-0.5-0.2l-0.5,0l-0.7,0l-0.7,0.2l-0.5,0.2l-0.5,0.2l-0.7,0.4l-0.7,0.4 l-0.7,0.5l-0.5,0.5l-0.5,0.5l-0.5,0.7l-0.5,0.7l-0.4,0.7l-0.4,0.9l-0.2,0.9l-0.2,0.9l0,0.9l0,0.9l0.2,0.9l0.2,0.9 l0.2,0.9l0.4,0.9l0.4,0.7l0.4,0.7l0.5,0.7l0.5,0.5l0.5,0.5l0.7,0.5l0.7,0.5l0.7,0.4l0.7,0.2l0.7,0.2l0.7,0.2 l0.9,0.2l0.9,0l0.9,0l0.9-0.2l0.9-0.2l0.7-0.2l0.7-0.2l0.7-0.4l0.7-0.4l0.5-0.4l0.5-0.4l0.5-0.5l0.5-0.5 l0.5-0.5l0.4-0.5l0.4-0.7l0.4-0.7l0.2-0.7l0.2-0.7l0.2-0.9l0.2-0.9l0.2-0.9l0-0.9l0-0.9l-0.2-0.9l-0.2-0.9 l-0.2-0.9l-0.4-0.7l-0.4-0.7l-0.4-0.7l-0.5-0.7l-0.5-0.5l-0.5-0.5l-0.5-0.5l-0.7-0.4l-0.7-0.4l-0.7-0.4 l-0.7-0.2l-0.7-0.2l-0.9-0.2l-0.9,0l-0.9,0l-0.9,0.2l-0.7,0.2l-0.7,0.2l-0.7,0.4l-0.7,0.4l-0.7,0.4l-0.5,0.4 l-0.5,0.5l-0.5,0.5l-0.5,0.5l-0.5,0.7l-0.4,0.7l-0.4,0.7l-0.4,0.7l-0.2,0.9l-0.2,0.9l-0.2,0.9l-0.2,0.9l0,0.9 l0,0.9l0.2,0.9l0.2,0.9l0.2,0.9l0.2,0.9l0.4,0.9l0.4,0.7l0.4,0.7l0.5,0.7l0.5,0.5l0.5,0.5l0.5,0.5l0.7,0.5 l0.7,0.4l0.7,0.4l0.7,0.2l0.7,0.2l0.9,0.2l0.9,0.2l0.9,0l0.9-0.2l0.9-0.2l0.7-0.2l0.7-0.2l0.7-0.4l0.7-0.4 l0.7-0.4l0.5-0.4l0.5-0.5l0.5-0.5l0.5-0.5l0.5-0.7l0.4-0.7l0.4-0.7l0.4-0.7l0.2-0.9l0.2-0.9l0.2-0.9l0."/>
        </g>
    </svg>
);

// Pre-process coordinates into a Map for efficient O(1) lookups.
const coordinatesMap = new Map<string, CountryCoordinates>();
COUNTRY_COORDINATES.forEach(c => {
    coordinatesMap.set(c.name.toLowerCase(), c);
    coordinatesMap.set(c.country_code.toLowerCase(), c);
});

export const GeoDistributionMap = ({ geoData }: GeoDistributionMapProps) => {
    const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

    const maxDevelopers = Math.max(...geoData.map(d => d.developers), 1);

    const projectToSvg = (lat: number, lon: number): [number, number] => {
        const x = (lon + 180) * (800 / 360);
        const latRad = lat * Math.PI / 180;
        const mercN = Math.log(Math.tan((Math.PI / 4) + (latRad / 2)));
        const y = (400 / 2) - (800 * mercN / (2 * Math.PI));
        return [x, y];
    };

    return (
        <div className="relative w-full h-full">
            <WorldMapSVG />
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 400">
                {geoData.map(({ name, developers }) => {
                    if (!name || name === 'Unknown') return null;
                    const trimmedName = name.trim().toLowerCase();
                    const country = coordinatesMap.get(trimmedName);
                    
                    if (!country) {
                        console.warn(`Could not find coordinates for country: ${name}`);
                        return null;
                    }
                    const [x, y] = projectToSvg(country.lat, country.lon);
                    const radius = 3 + (developers / maxDevelopers) * 12;

                    return (
                        <g key={name}>
                            <circle
                                cx={x}
                                cy={y}
                                r={radius}
                                fill="#6366F1"
                                fillOpacity={0.6}
                                stroke="#A5B4FC"
                                strokeWidth="1"
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.ownerSVGElement?.getBoundingClientRect();
                                    if (!rect) return;
                                    setTooltip({
                                        x: e.clientX - rect.left + 10,
                                        y: e.clientY - rect.top + 10,
                                        content: `${country.name}: ${developers} developers`
                                    });
                                }}
                                onMouseLeave={() => setTooltip(null)}
                            />
                        </g>
                    );
                })}
            </svg>
            {tooltip && (
                <div
                    className="absolute p-2 text-sm bg-brand-bg border border-brand-border rounded-md shadow-lg pointer-events-none"
                    style={{ left: tooltip.x, top: tooltip.y }}
                >
                    {tooltip.content}
                </div>
            )}
        </div>
    );
};