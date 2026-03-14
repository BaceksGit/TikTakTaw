import { useState } from "react";
import { useGame } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import Board from "./components/Board";
import ModeToggle from "./components/ModeToggle";
import ScoreRow from "./components/ScoreRow";
import StatusBar from "./components/StatusBar";
import ThemeToggle from "./components/ThemeToggle";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("1v1");
  const { theme, cycleTheme } = useTheme();
  const {
    board,
    winCombo,
    winStyle,
    status,
    dotClass,
    botThinking,
    scores,
    handleClick,
    resetGame,
    resetAll,
  } = useGame(mode);

  function handleModeChange(newMode) {
    setMode(newMode);
    resetAll();
  }

  return (
    <div className="game-wrap">
      <div className="top-bar">
        <ThemeToggle theme={theme} onCycle={cycleTheme} />
      </div>

      <h1 className="game-title">TikTakTaw</h1>

      <ModeToggle mode={mode} onChange={handleModeChange} />

      <p className="game-subtitle">
        {mode === "1v1" ? "two players · same screen" : "you are X · bot plays O"}
      </p>

      <StatusBar dotClass={dotClass} status={status} />

      <Board
        board={board}
        winCombo={winCombo}
        winStyle={winStyle}
        onCellClick={handleClick}
        botThinking={botThinking}
      />

      <div className="controls">
        <ScoreRow scores={scores} mode={mode} />
        <button className="reset-btn" onClick={resetGame}>
          New game
        </button>
      </div>
    </div>
  );
}

