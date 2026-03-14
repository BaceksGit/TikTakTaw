import { useState, useEffect, useCallback } from "react";
import { useGame } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import { usePeer } from "./hooks/usePeer";
import Board from "./components/Board";
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
  const { theme, cycleTheme } = useTheme();

  // online state
  const [onlineState, setOnlineState] = useState("idle"); // idle | modal | waiting | playing | disconnected
  const [isHost, setIsHost] = useState(false);
  const [myMark, setMyMark] = useState(null); // "X" | "O"
  const [playerNames, setPlayerNames] = useState({ X: "", O: "" });
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 });

  const {
    board,
    current,
    winCombo,
    winStyle,
    status,
    dotClass,
    botThinking,
    scores: localScores,
    handleClick: localHandleClick,
    resetGame: localResetGame,
    resetAll,
    applyOpponentMove,
    applyReset,
    applyScores,
    gameOver,
  } = useGame(mode === "online" ? "online" : mode);

  const handleOpponentMove = useCallback((index) => {
    applyOpponentMove?.(index);
  }, [applyOpponentMove]);

  const handleOpponentReset = useCallback(() => {
    applyReset?.();
  }, [applyReset]);

  const handleOpponentScores = useCallback((incoming) => {
    applyScores?.(incoming);
  }, [applyScores]);

  const handleOpponentJoined = useCallback(() => {
    setOnlineState("playing");
  }, []);

  const handleOpponentLeft = useCallback(() => {
    setOnlineState("disconnected");
  }, []);

  const { peerId, connected, error, ready, connectToPeer, sendMove, sendReset, sendScores } = usePeer({
    onMove: handleOpponentMove,
    onReset: handleOpponentReset,
    onScores: handleOpponentScores,
    onOpponentJoined: handleOpponentJoined,
    onOpponentLeft: handleOpponentLeft,
  });

  // Auto-join if URL has ?room=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get("room");
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
      resetAll();
    } else {
      setMode(newMode);
      setOnlineState("idle");
      resetAll();
    }
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
  function handleClick(i) {
    if (mode !== "online") {
      localHandleClick(i);
      return;
    }
    // Only allow click if it's your turn
    if (current !== myMark) return;
    localHandleClick(i);
    sendMove(i);
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
    resetAll();
    // Remove ?room= from URL
    window.history.replaceState({}, "", window.location.pathname);
  }

  const activeScores = mode === "online" ? scores : localScores;

  // sync scores for online mode from game hook
  useEffect(() => {
    if (mode === "online") {
      setScores(localScores);
    }
  }, [localScores, mode]);

  function getSubtitle() {
    if (mode === "1v1") return "two players · same screen";
    if (mode === "bot") return "you are X · bot plays O";
    if (mode === "online" && onlineState === "playing") {
      return `you are ${myMark} · ${connected ? "friend connected" : "waiting…"}`;
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

      <p className="game-subtitle">{getSubtitle()}</p>

      <StatusBar dotClass={dotClass} status={status} />

      <Board
        board={board}
        winCombo={winCombo}
        winStyle={winStyle}
        onCellClick={handleClick}
        botThinking={botThinking}
        disabled={mode === "online" && current !== myMark}
      />

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
          playerName={playerNames.X}
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