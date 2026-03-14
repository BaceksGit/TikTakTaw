import { useEffect, useState, useCallback } from "react";
import { checkWin, isDraw } from "../logic/checkWin";
import { getBotMove } from "../logic/minimax";

const CELL_SIZE = 96;
const BOT_THINK_DELAY_MS = 220;

const INITIAL_STATE = {
  board: Array(9).fill(""),
  current: "X",
  gameOver: false,
  winCombo: null,
  winStyle: {},
  status: "Player X's turn",
  dotClass: "turn-dot dot-x",
  botThinking: false,
};

function getWinLineStyle(combo) {
  const pos = (i) => ({
    x: (i % 3) * CELL_SIZE + CELL_SIZE / 2,
    y: Math.floor(i / 3) * CELL_SIZE + CELL_SIZE / 2,
  });

  const p1 = pos(combo[0]);
  const p2 = pos(combo[2]);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy) + 20;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cx = (p1.x + p2.x) / 2;
  const cy = (p1.y + p2.y) / 2;

  return {
    width: len,
    top: cy,
    left: cx,
    transform: `translate(-50%,-50%) rotate(${angle}deg)`,
    opacity: 1,
  };
}

export function useGame(mode) {
  const [state, setState] = useState(INITIAL_STATE);
  const [scores, setScores] = useState({ X: 0, O: 0, D: 0 });

  const { board, current, gameOver, winCombo, winStyle, status, dotClass, botThinking } = state;

  const patch = (updates) => setState((s) => ({ ...s, ...updates }));

  function applyMove(boardSnapshot, mark) {
    const win = checkWin(boardSnapshot);
    const draw = !win && isDraw(boardSnapshot);

    if (win) {
      setScores((s) => ({ ...s, [mark]: s[mark] + 1 }));
      setState((s) => ({
        ...s,
        board: boardSnapshot,
        winCombo: win,
        status: mode === "online" ? `${mark} wins!` : `Player ${mark} wins!`,
        dotClass: "turn-dot dot-win",
        gameOver: true,
      }));
      setTimeout(() => patch({ winStyle: getWinLineStyle(win) }), 10);
      return true;
    }

    if (draw) {
      setScores((s) => ({ ...s, D: s.D + 1 }));
      setState((s) => ({
        ...s,
        board: boardSnapshot,
        status: "It's a draw!",
        dotClass: "turn-dot",
        gameOver: true,
      }));
      return true;
    }

    return false;
  }

  function handleClick(i) {
    if (gameOver || board[i] || botThinking) return;
    if (mode === "bot" && current === "O") return;

    const newBoard = [...board];
    newBoard[i] = current;

    const ended = applyMove(newBoard, current);
    if (ended) return;

    const next = current === "X" ? "O" : "X";
    setState((s) => ({
      ...s,
      board: newBoard,
      current: next,
      status: mode === "bot" && next === "O"
        ? "Bot is thinking…"
        : mode === "online"
        ? `${next}'s turn`
        : `Player ${next}'s turn`,
      dotClass: `turn-dot dot-${next.toLowerCase()}`,
    }));
  }

  // For online mode: apply opponent's move
  const applyOpponentMove = useCallback((i) => {
    setState((prev) => {
      if (prev.gameOver || prev.board[i]) return prev;
      const newBoard = [...prev.board];
      const mark = prev.current;
      newBoard[i] = mark;

      const win = checkWin(newBoard);
      const draw = !win && isDraw(newBoard);

      if (win) {
        setTimeout(() => patch({ winStyle: getWinLineStyle(win) }), 10);
        return {
          ...prev,
          board: newBoard,
          winCombo: win,
          status: `${mark} wins!`,
          dotClass: "turn-dot dot-win",
          gameOver: true,
        };
      }

      if (draw) {
        return {
          ...prev,
          board: newBoard,
          status: "It's a draw!",
          dotClass: "turn-dot",
          gameOver: true,
        };
      }

      const next = mark === "X" ? "O" : "X";
      return {
        ...prev,
        board: newBoard,
        current: next,
        status: `${next}'s turn`,
        dotClass: `turn-dot dot-${next.toLowerCase()}`,
      };
    });
  }, []);

  // For online mode: apply scores sent by opponent
  const applyScores = useCallback((incoming) => {
    setScores(incoming);
  }, []);

  // For online mode: apply opponent's reset
  const applyReset = useCallback(() => {
    setState({ ...INITIAL_STATE, board: Array(9).fill("") });
  }, []);

  useEffect(() => {
    if (mode !== "bot" || current !== "O" || gameOver) return;

    patch({ botThinking: true });

    const timer = setTimeout(() => {
      setState((prev) => {
        if (prev.gameOver || prev.current !== "O") return { ...prev, botThinking: false };

        const newBoard = [...prev.board];
        const move = getBotMove([...newBoard]);

        if (move === -1) {
          if (isDraw(newBoard)) {
            setScores((s) => ({ ...s, D: s.D + 1 }));
            return {
              ...prev,
              status: "It's a draw!",
              dotClass: "turn-dot",
              gameOver: true,
              botThinking: false,
            };
          }
          return { ...prev, botThinking: false };
        }

        newBoard[move] = "O";

        const win = checkWin(newBoard);
        const draw = !win && isDraw(newBoard);

        if (win) {
          setScores((s) => ({ ...s, O: s.O + 1 }));
          setTimeout(() => patch({ winStyle: getWinLineStyle(win) }), 10);
          return {
            ...prev,
            board: newBoard,
            winCombo: win,
            status: "Bot wins!",
            dotClass: "turn-dot dot-win",
            gameOver: true,
            botThinking: false,
          };
        }

        if (draw) {
          setScores((s) => ({ ...s, D: s.D + 1 }));
          return {
            ...prev,
            board: newBoard,
            status: "It's a draw!",
            dotClass: "turn-dot",
            gameOver: true,
            botThinking: false,
          };
        }

        return {
          ...prev,
          board: newBoard,
          current: "X",
          status: "Player X's turn",
          dotClass: "turn-dot dot-x",
          botThinking: false,
        };
      });
    }, BOT_THINK_DELAY_MS);

    return () => clearTimeout(timer);
  }, [current, gameOver, mode]);

  function resetGame() {
    setState({ ...INITIAL_STATE, board: Array(9).fill("") });
  }

  function resetAll() {
    setState({ ...INITIAL_STATE, board: Array(9).fill("") });
    setScores({ X: 0, O: 0, D: 0 });
  }

  return {
    board,
    current,
    gameOver,
    winCombo,
    winStyle,
    status,
    dotClass,
    botThinking,
    scores,
    handleClick,
    resetGame,
    resetAll,
    applyOpponentMove,
    applyReset,
    applyScores,
  };
}