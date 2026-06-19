import React, { useState, useEffect, useCallback } from 'react';
import { WSClient } from './wsClient';

export interface Tile {
    index: number;
    x: number;
    y: number;
    content: 'worker' | 'multiplier' | 'soldier' | 'decoy' | 'empty';
    revealed: boolean;
    devoured: boolean;
    pheromone: number;
    soldierCount: number;
}

export interface GameState {
    matchId: string;
    phase: 'draft' | 'locked' | 'raid' | 'ended';
    grid: Tile[];
    stackHeight: number;
    soldierCount: number;
    pheromoneStress: number;
    anteater: {
        strikesLeft: number;
        snoutRadius: number;
        devoured: number;
    };
    colony: {
        remainingWorkers: number;
        totalStake: number;
    };
    telemetry: {
        heatmap: number[];
        soldierMap: number[];
        stackHeight: number;
        pheromoneStress: number;
    };
}

interface GameStateProps {
    lobbyId: string;
    token: string;
    sessionKey: string;
    playerId: string;
    role: 'colony' | 'anteater';
}

export const GameState: React.FC<GameStateProps> = ({
    lobbyId,
    token,
    sessionKey,
    playerId,
    role
}) => {
    const [state, setState] = useState<GameState | null>(null);
    const [ws, setWs] = useState<WSClient | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const url = `ws://localhost:8080/match/${lobbyId}`;
        const client = new WSClient({
            url,
            token,
            sessionKey,
            onMessage: (type, data) => {
                handleMessage(type, data);
            },
            onError: (code, message) => {
                setError(`${code}: ${message}`);
            },
            onClose: () => {
                console.log('[GameState] WebSocket closed');
            }
        });

        setWs(client);

        return () => {
            client.disconnect();
        };
    }, [lobbyId, token, sessionKey]);

    const handleMessage = useCallback((type: string, data: any) => {
        switch (type) {
            case 'lobby_update':
                break;
            case 'tile_revealed':
                setState(prev => {
                    if (!prev) return prev;
                    const newGrid = [...prev.grid];
                    const tile = newGrid[data.index];
                    if (tile) {
                        tile.revealed = true;
                        tile.content = data.contentMask;
                    }
                    return {
                        ...prev,
                        grid: newGrid,
                        stackHeight: prev.stackHeight + data.stackDelta,
                        pheromoneStress: data.pheromone
                    };
                });
                break;
            case 'telemetry_update':
                setState(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        telemetry: {
                            heatmap: data.heatmap,
                            soldierMap: data.soldierMap,
                            stackHeight: data.stackHeight,
                            pheromoneStress: data.pheromoneStress
                        }
                    };
                });
                break;
            case 'strike_result':
                setState(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        colony: {
                            ...prev.colony,
                            remainingWorkers: data.remainingWorkers
                        },
                        anteater: {
                            ...prev.anteater,
                            devoured: data.devouredTotal
                        }
                    };
                });
                break;
            case 'match_end':
                setState(prev => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        phase: 'ended'
                    };
                });
                break;
            default:
                console.log('[GameState] Unhandled message:', type, data);
        }
    }, []);

    const revealTile = useCallback((index: number) => {
        if (ws?.isConnected()) {
            ws.send('reveal_tile', { tileIndex: index });
        }
    }, [ws]);

    const voteSeal = useCallback((sectorId: string, vote: 'seal' | 'continue') => {
        if (ws?.isConnected()) {
            ws.send('vote_seal', { sectorId, vote });
        }
    }, [ws]);

    const plantDecoy = useCallback((tileIndex: number, cost: number) => {
        if (ws?.isConnected()) {
            ws.send('plant_decoy', { tileIndex, cost });
        }
    }, [ws]);

    const strike = useCallback((targetSector: number) => {
        if (ws?.isConnected() && role === 'anteater') {
            ws.send('anteater_strike', { targetSector });
        }
    }, [ws, role]);

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    if (!state) {
        return <div className="loading">Loading match...</div>;
    }

    return (
        <div className="game-container">
            {/* Game UI rendered by parent */}
        </div>
    );
};
