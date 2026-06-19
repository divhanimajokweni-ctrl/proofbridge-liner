import React from 'react';
import { TileMap } from './TileMap';
import { GameState, GameState as GameStateType } from './GameState';
import { wsClient } from './wsClient';

interface AppProps {
    lobbyId: string;
    token: string;
    sessionKey: string;
    playerId: string;
    role: 'colony' | 'anteater';
}

const App: React.FC<AppProps> = ({ lobbyId, token, sessionKey, playerId, role }) => {
    const [gameState, setGameState] = React.useState<GameStateType | null>(null);
    const [lastEvent, setLastEvent] = React.useState<string>('');

    const handleTileClick = (index: number) => {
        setLastEvent(`tile ${index}`);
    };

    return (
        <div className="app">
            <header className="header">
                <h1>Ant Stack: Food Chain</h1>
                <div className="phase">Phase: {gameState?.phase ?? 'lobby'}</div>
            </header>
            <main className="main">
                <GameState
                    lobbyId={lobbyId}
                    token={token}
                    sessionKey={sessionKey}
                    playerId={playerId}
                    role={role}
                />
            </main>
            <footer className="footer">
                <div className="event-log">{lastEvent}</div>
            </footer>
        </div>
    );
};

export default App;
