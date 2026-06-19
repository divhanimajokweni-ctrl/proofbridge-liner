import React, { useRef, useEffect, useState } from 'react';

interface TileMapProps {
    gridSize: number;
    onTileClick: (index: number) => void;
    telemetry: number[];
    heatmap: number[];
    disabled?: boolean;
}

export const TileMap: React.FC<TileMapProps> = ({
    gridSize,
    onTileClick,
    telemetry,
    heatmap,
    disabled = false
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const tileSize = 40;
    const padding = 4;
    const totalSize = gridSize * (tileSize + padding) + padding;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const index = y * gridSize + x;
                const px = padding + x * (tileSize + padding);
                const py = padding + y * (tileSize + padding);

                const heatValue = heatmap[index] || 0;
                const intensity = Math.min(1, heatValue / 100);

                const r = 139 + intensity * 60;
                const g = 90 + intensity * 40;
                const b = 43 + intensity * 20;

                ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                ctx.fillRect(px, py, tileSize, tileSize);

                ctx.strokeStyle = 'rgba(255,255,255,0.1)';
                ctx.lineWidth = 1;
                ctx.strokeRect(px, py, tileSize, tileSize);

                const teleValue = telemetry[index] || 0;
                if (teleValue > 0) {
                    ctx.fillStyle = `rgba(204, 119, 34, ${Math.min(0.5, teleValue / 50)})`;
                    ctx.fillRect(px, py, tileSize, tileSize);
                }

                if (hoveredIndex === index) {
                    ctx.strokeStyle = 'rgba(204, 119, 34, 0.6)';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px, py, tileSize, tileSize);
                }

                if (teleValue > 20) {
                    ctx.fillStyle = 'rgba(138, 154, 91, 0.4)';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('🐜', px + tileSize / 2, py + tileSize / 2);
                }
            }
        }
    }, [gridSize, telemetry, heatmap, hoveredIndex]);

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const mx = (e.clientX - rect.left) * scaleX;
        const my = (e.clientY - rect.top) * scaleY;

        const x = Math.floor(mx / (tileSize + padding));
        const y = Math.floor(my / (tileSize + padding));

        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            setHoveredIndex(y * gridSize + x);
        } else {
            setHoveredIndex(null);
        }
    };

    const handleClick = () => {
        if (hoveredIndex !== null && !disabled) {
            onTileClick(hoveredIndex);
        }
    };

    return (
        <canvas
            ref={canvasRef}
            width={totalSize}
            height={totalSize}
            style={{
                width: '100%',
                height: 'auto',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.6 : 1
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={handleClick}
        />
    );
};
