import React from 'react';
import { UserStateVector } from '../types.ts';

interface UsvRadarProps {
    usv: UserStateVector;
}

const UsvRadar: React.FC<UsvRadarProps> = ({ usv }) => {
    const size = 300;
    const center = size / 2;
    const labels = ['Espiritual', 'Financeiro', 'Físico', 'Emocional'];
    const values = [
        usv.spiritual, 
        usv.financial, 
        usv.physical, 
        100 - usv.emotional // Invert emotional for display
    ];

    const points = values.map((value, i) => {
        const angle = (i / labels.length) * 2 * Math.PI - (Math.PI / 2);
        const radius = (value / 100) * (center * 0.8);
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');
    
    const labelPoints = labels.map((label, i) => {
        const angle = (i / labels.length) * 2 * Math.PI - (Math.PI / 2);
        const radius = center * 0.95;
        return {
            x: center + radius * Math.cos(angle),
            y: center + radius * Math.sin(angle),
            label,
        };
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Concentric Circles */}
            {[0.25, 0.5, 0.75, 1].map(r => (
                 <circle
                    key={r}
                    cx={center}
                    cy={center}
                    r={center * 0.8 * r}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="1"
                />
            ))}
             {/* Radial Lines */}
            {values.map((_, i) => {
                 const angle = (i / labels.length) * 2 * Math.PI;
                 return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={center + center * 0.8 * Math.cos(angle - Math.PI / 2)}
                        y2={center + center * 0.8 * Math.sin(angle - Math.PI / 2)}
                        stroke="rgba(255, 255, 255, 0.1)"
                        strokeWidth="1"
                    />
                 )
            })}
           
            {/* Data Polygon */}
            <polygon
                points={points}
                fill="rgba(79, 70, 229, 0.3)" 
                stroke="#4F46E5"
                strokeWidth="2"
            />

            {/* Labels */}
            {labelPoints.map(({ x, y, label }) => (
                <text
                    key={label}
                    x={x}
                    y={y}
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize="12"
                    textAnchor="middle"
                    dominantBaseline="central"
                >
                    {label}
                </text>
            ))}
        </svg>
    );
};

export default UsvRadar;