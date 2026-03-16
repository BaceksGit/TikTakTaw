import { useState, useEffect, useCallback, useRef } from "react";
import { useGame } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import { usePeer } from "./hooks/usePeer";
import Board from "./components/Board";
import GridToggle from "./components/GridToggle";
import ModeToggle from "./components/ModeToggle";
import ScoreRow from "./components/ScoreRow";
import StatusBar from "./components/StatusBar";
import ThemeToggle from "./components/ThemeToggle";
import OnlineModal from "./components/OnlineModal";
import WaitingRoom from "./components/WaitingRoom";
import "./App.css";

// online session states
// idle → modal → waiting (host) / connecting (joiner) → playing → idle

export default function App() {
  const [mode, setMode] = useState("1v1");
  const [gridCount, setGridCount] = useState(1);
  const { theme, cycleTheme } = useTheme();

  // online state
  const [onlineState, setOnlineState] = useState("idle"); // idle | modal | waiting | playing | disconnected
  const [isHost, setIsHost] = useState(false);
  const [myMark, setMyMark] = useState(null); // "X" | "O"
  const [playerNames, setPlayerNames] = useState({ X: "", O: "" });
  const sentSettingsRef = useRef(false);

  const {
    boards,
    current,
    status,
    dotClass,
    botThinking,
    scores: localScores,
    handleClick: localHandleClick,
    resetGame: localResetGame,
    applyOpponentMove,
    applyReset,
    applyScores,
    gameOver,
  } = useGame(mode === "online" ? "online" : mode, gridCount);

  const handleOpponentMove = useCallback((index) => {
    applyOpponentMove?.(index);
  }, [applyOpponentMove]);

  const handleOpponentReset = useCallback(() => {
    applyReset?.();
  }, [applyReset]);

  const handleOpponentScores = useCallback((incoming) => {
    applyScores?.(incoming);
  }, [applyScores]);

  const handleOpponentSettings = useCallback((incoming) => {
    const next = Number(incoming?.grids);
    if (!Number.isFinite(next)) return;
    if (next < 1 || next > 3) return;
    setGridCount(next);
  }, []);

  const handleOpponentJoined = useCallback(() => {
    setOnlineState("playing");
  }, []);

  const handleOpponentLeft = useCallback(() => {
    setOnlineState("disconnected");
  }, []);

  const { peerId, connected, error, ready, peerDead, reconnect, connectToPeer, sendMove, sendReset, sendScores, sendSettings } = usePeer({
    onMove: handleOpponentMove,
    onReset: handleOpponentReset,
    onScores: handleOpponentScores,
    onSettings: handleOpponentSettings,
    onOpponentJoined: handleOpponentJoined,
    onOpponentLeft: handleOpponentLeft,
  });

  useEffect(() => {
    if (mode !== "online" || !connected) {
      sentSettingsRef.current = false;
      return;
    }
    if (!isHost) return;
    if (sentSettingsRef.current) return;
    sendSettings?.({ grids: gridCount });
    sentSettingsRef.current = true;
  }, [connected, gridCount, isHost, mode, sendSettings]);

  // Auto-join if URL has ?room=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
    const gridsParam = Number(params.get("grids"));
    if (Number.isFinite(gridsParam) && gridsParam >= 1 && gridsParam <= 3) {
      setGridCount(gridsParam);
    }
    if (room && ready) {
      setMode("online");
      setOnlineState("modal_join");
      // store room id for auto-fill
      window._autoRoomId = room;
    }
  }, [ready]);

  function handleModeChange(newMode) {
    if (newMode === "online") {
      setMode("online");
      setOnlineState("modal");
    } else {
      setMode(newMode);
      setOnlineState("idle");
    }
  }

  function handleGridChange(nextCount) {
    setGridCount(nextCount);
  }

  function handleHost(name) {
    setIsHost(true);
    setMyMark("X");
    setPlayerNames((p) => ({ ...p, X: name }));
    setOnlineState("waiting");
  }

  function handleJoin(name, roomId) {
    setIsHost(false);
    setMyMark("O");
    setPlayerNames((p) => ({ ...p, O: name }));
    connectToPeer(roomId);
    setOnlineState("connecting");
  }

  // When connected as joiner, move to playing
  useEffect(() => {
    if (connected && onlineState === "connecting") {
      setOnlineState("playing");
    }
  }, [connected, onlineState]);

  // Wrap handleClick for online mode
  function handleClick(boardIndex, cellIndex) {
    if (mode !== "online") {
      localHandleClick(boardIndex, cellIndex);
      return;
    }
    // Only allow click if it's your turn
    if (current !== myMark) return;
    localHandleClick(boardIndex, cellIndex);
    if (boards.length === 1) {
      sendMove(cellIndex);
      return;
    }
    sendMove({ boardIndex, cellIndex, boardCount: boards.length });
  }

  // After a score changes in online mode, send it to opponent
  useEffect(() => {
    if (mode === "online" && gameOver) {
      sendScores(localScores);
    }
  }, [localScores, gameOver, mode]);

  function handleReset() {
    localResetGame();
    if (mode === "online") sendReset();
  }

  function handleCancelOnline() {
    setMode("1v1");
    setOnlineState("idle");
    setMyMark(null);
    setPlayerNames({ X: "", O: "" });
    // Remove ?room= from URL
    window.history.replaceState({}, "", window.location.pathname);
  }

  const activeScores = localScores;

  function getSubtitle() {
    const gridLabel = gridCount === 1 ? "1 grid" : `${gridCount} grids`;
    if (mode === "1v1") return `${gridLabel} · two players · same screen`;
    if (mode === "bot") return `${gridLabel} · you are X · bot plays O`;
    if (mode === "online" && onlineState === "playing") {
      return `${gridLabel} · you are ${myMark} · ${connected ? "friend connected" : "waiting…"}`;
    }
    return "play with a friend online";
  }

  return (
    <div className="game-wrap">
      <div className="top-bar">
        <ThemeToggle theme={theme} onCycle={cycleTheme} />
      </div>

      <h1 className="game-title">TikTakTaw</h1>

      <ModeToggle mode={mode} onChange={handleModeChange} />

      {(mode !== "online" || onlineState === "modal" || onlineState === "modal_join") && (
        <GridToggle
          grids={gridCount}
          onChange={handleGridChange}
          disabled={mode === "online" && onlineState !== "modal" && onlineState !== "modal_join"}
        />
      )}

      <p className="game-subtitle">{getSubtitle()}</p>

      <StatusBar dotClass={dotClass} status={status} />

      <div className="boards-row">
        {boards.map((b, boardIndex) => (
          <Board
            key={boardIndex}
            board={b.cells}
            winCombo={b.winCombo}
            winStyle={b.winStyle}
            onCellClick={(cellIndex) => handleClick(boardIndex, cellIndex)}
            botThinking={botThinking}
            disabled={gameOver || b.gameOver || (mode === "online" && current !== myMark)}
          />
        ))}
      </div>

      <div className="controls">
        <ScoreRow scores={activeScores} mode={mode} playerNames={playerNames} />
        <button className="reset-btn" onClick={handleReset}>
          New game
        </button>
        {mode === "online" && onlineState === "playing" && (
          <button className="reset-btn" style={{ marginTop: "0.5rem", opacity: 0.6, fontSize: "0.8rem" }} onClick={handleCancelOnline}>
            Leave room
          </button>
        )}
      </div>

      {/* Modals */}
      {mode === "online" && (onlineState === "modal" || onlineState === "modal_join") && (
        <OnlineModal
          peerId={peerId}
          ready={ready}
          error={error}
          autoRoomId={window._autoRoomId}
          onHost={handleHost}
          onJoin={handleJoin}
          onClose={handleCancelOnline}
        />
      )}

      {mode === "online" && onlineState === "waiting" && (
        <WaitingRoom
          peerId={peerId}
          gridCount={gridCount}
          playerName={playerNames.X}
          peerDead={peerDead}
          onRefresh={() => { reconnect(); }}
          onCancel={handleCancelOnline}
        />
      )}

      {mode === "online" && onlineState === "connecting" && (
        <div className="modal-overlay">
          <div className="modal">
            <p className="modal-title">Connecting…</p>
            <p className="modal-sub">Joining room, please wait.</p>
          </div>
        </div>
      )}

      {mode === "online" && onlineState === "disconnected" && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">Friend disconnected</h2>
            <p className="modal-sub">Your friend left the game.</p>
            <button className="modal-btn primary" onClick={handleCancelOnline}>Back to menu</button>
          </div>
        </div>
      )}
    </div>
  );
}
