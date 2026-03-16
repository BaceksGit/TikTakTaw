import { useEffect, useState, useCallback } from "react";
import { checkWin, isDraw } from "../logic/checkWin";
import { getBotMove } from "../logic/minimax";

const CELL_SIZE = 96;
const BOT_THINK_DELAY_MS = 220;

function createBoards(boardCount) {
  return Array.from({ length: boardCount }, () => ({
    cells: Array(9).fill(""),
    gameOver: false,
    winCombo: null,
    winStyle: {},
    result: null, // "X" | "O" | "D" | null
  }));
}

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

function getMatchOutcome(boards) {
  const winsX = boards.filter((b) => b.result === "X").length;
  const winsO = boards.filter((b) => b.result === "O").length;
  const finished = boards.filter((b) => b.result !== null).length;
  const boardCount = boards.length;

  if (boardCount === 1) {
    const only = boards[0].result;
    if (only === "X" || only === "O") return { done: true, winner: only, draw: false };
    if (only === "D") return { done: true, winner: null, draw: true };
    return { done: false, winner: null, draw: false };
  }

  if (boardCount === 2) {
    if (winsX === 2) return { done: true, winner: "X", draw: false };
    if (winsO === 2) return { done: true, winner: "O", draw: false };
    if (winsX === 1 && winsO === 0 && finished === 2) return { done: true, winner: "X", draw: false };
    if (winsO === 1 && winsX === 0 && finished === 2) return { done: true, winner: "O", draw: false };
    if (winsX === 1 && winsO === 1 && finished === 2) return { done: true, winner: null, draw: true };
    if (finished === 2) return { done: true, winner: null, draw: true };
    return { done: false, winner: null, draw: false };
  }

  // 3 boards: win if you win >= 2 boards
  if (winsX >= 2) return { done: true, winner: "X", draw: false };
  if (winsO >= 2) return { done: true, winner: "O", draw: false };
  if (finished === 3) return { done: true, winner: null, draw: true };
  return { done: false, winner: null, draw: false };
}

function createInitialState({ boardCount, mode, starter = "X" }) {
  const status = mode === "online" ? `${starter}'s turn` : `Player ${starter}'s turn`;
  return {
    boards: createBoards(boardCount),
    current: starter,
    matchOver: false,
    status,
    dotClass: `turn-dot dot-${starter.toLowerCase()}`,
    botThinking: false,
  };
}

function resolveIndexes(boardIndex, cellIndex) {
  if (typeof cellIndex !== "number") return { boardIndex: 0, cellIndex: boardIndex };
  return { boardIndex, cellIndex };
}

function growBoards(boards, requiredCount) {
  if (requiredCount <= boards.length) return boards;
  const safeRequired = Math.max(1, Math.min(3, requiredCount));
  if (safeRequired <= boards.length) return boards;
  return [...boards, ...createBoards(safeRequired - boards.length)];
}

export function useGame(mode, boardCount = 1) {
  const safeBoardCount = Math.max(1, Math.min(3, Number(boardCount) || 1));

  const [state, setState] = useState(() =>
    ({
      ...createInitialState({ boardCount: safeBoardCount, mode, starter: "X" }),
      scores: { X: 0, O: 0, D: 0 },
    }),
  );
  const [nextStarter, setNextStarter] = useState("O"); // after match 1 (X starts), O goes next

  const { boards, current, matchOver, status, dotClass, botThinking, scores } = state;

  const patch = (updates) => setState((s) => ({ ...s, ...updates }));

  useEffect(() => {
    setNextStarter("O");
    setState({
      ...createInitialState({ boardCount: safeBoardCount, mode, starter: "X" }),
      scores: { X: 0, O: 0, D: 0 },
    });
  }, [mode, safeBoardCount]);

  function labelTurn(next) {
    if (mode === "bot" && next === "O") return "Bot is thinking…";
    if (mode === "online") return `${next}'s turn`;
    return `Player ${next}'s turn`;
  }

  function applyMove(boardIndex, cellIndex) {
    const { boardIndex: bIndex, cellIndex: cIndex } = resolveIndexes(boardIndex, cellIndex);

    setState((prev) => {
      if (prev.matchOver || prev.botThinking) return prev;
      if (mode === "bot" && prev.current === "O") return prev;

      const expandedBoards = growBoards(prev.boards, bIndex + 1);
      const target = expandedBoards[bIndex];
      if (!target || target.gameOver || target.cells[cIndex]) return prev;

      const mark = prev.current;
      const nextBoards = expandedBoards.map((b, idx) => {
        if (idx !== bIndex) return b;

        const nextCells = [...b.cells];
        nextCells[cIndex] = mark;

        const win = checkWin(nextCells);
        const draw = !win && isDraw(nextCells);

        if (win) {
          return {
            ...b,
            cells: nextCells,
            winCombo: win,
            winStyle: getWinLineStyle(win),
            gameOver: true,
            result: mark,
          };
        }

        if (draw) {
          return {
            ...b,
            cells: nextCells,
            gameOver: true,
            result: "D",
          };
        }

        return { ...b, cells: nextCells };
      });

      const outcome = getMatchOutcome(nextBoards);
      if (outcome.done) {
        if (outcome.winner) {
          return {
            ...prev,
            boards: nextBoards,
            matchOver: true,
            status: mode === "online" ? `${outcome.winner} wins!` : `Player ${outcome.winner} wins!`,
            dotClass: "turn-dot dot-win",
            scores: { ...prev.scores, [outcome.winner]: prev.scores[outcome.winner] + 1 },
          };
        }

        return {
          ...prev,
          boards: nextBoards,
          matchOver: true,
          status: "It's a draw!",
          dotClass: "turn-dot",
          scores: { ...prev.scores, D: prev.scores.D + 1 },
        };
      }

      const next = mark === "X" ? "O" : "X";
      return {
        ...prev,
        boards: nextBoards,
        current: next,
        status: labelTurn(next),
        dotClass: `turn-dot dot-${next.toLowerCase()}`,
      };
    });
  }

  // For online mode: apply opponent's move (supports legacy number and {boardIndex, cellIndex})
  const applyOpponentMove = useCallback((payload) => {
    setState((prev) => {
      if (mode !== "online" || prev.matchOver) return prev;

      const normalizedPayload = typeof payload === "string" && /^\d+$/.test(payload) ? Number(payload) : payload;

      const bIndex = typeof normalizedPayload === "number" ? 0 : Number(normalizedPayload?.boardIndex ?? 0);
      const cIndex = typeof normalizedPayload === "number" ? normalizedPayload : Number(normalizedPayload?.cellIndex ?? -1);
      const hintedBoardCount = typeof normalizedPayload === "number" ? null : Number(normalizedPayload?.boardCount);
      const requiredCount = Number.isFinite(hintedBoardCount) ? hintedBoardCount : bIndex + 1;

      const expandedBoards = growBoards(prev.boards, requiredCount);
      const target = expandedBoards[bIndex];
      if (!target || target.gameOver || target.cells[cIndex]) return prev;

      const mark = prev.current;
      const nextBoards = expandedBoards.map((b, idx) => {
        if (idx !== bIndex) return b;

        const nextCells = [...b.cells];
        nextCells[cIndex] = mark;
        const win = checkWin(nextCells);
        const draw = !win && isDraw(nextCells);

        if (win) return { ...b, cells: nextCells, winCombo: win, winStyle: getWinLineStyle(win), gameOver: true, result: mark };
        if (draw) return { ...b, cells: nextCells, gameOver: true, result: "D" };
        return { ...b, cells: nextCells };
      });

      const outcome = getMatchOutcome(nextBoards);
      if (outcome.done) {
        return {
          ...prev,
          boards: nextBoards,
          matchOver: true,
          status: outcome.winner ? `${outcome.winner} wins!` : "It's a draw!",
          dotClass: outcome.winner ? "turn-dot dot-win" : "turn-dot",
          scores: outcome.winner
            ? { ...prev.scores, [outcome.winner]: prev.scores[outcome.winner] + 1 }
            : { ...prev.scores, D: prev.scores.D + 1 },
        };
      }

      const next = mark === "X" ? "O" : "X";
      return { ...prev, boards: nextBoards, current: next, status: `${next}'s turn`, dotClass: `turn-dot dot-${next.toLowerCase()}` };
    });
  }, [mode]);

  // For online mode: apply scores sent by opponent
  const applyScores = useCallback((incoming) => {
    setState((prev) => ({ ...prev, scores: incoming }));
  }, []);

  // For online mode: apply opponent's reset
  const applyReset = useCallback(() => {
    setNextStarter((prevStarter) => {
      const starter = prevStarter;
      setState((prev) => ({
        ...prev,
        ...createInitialState({ boardCount: safeBoardCount, mode, starter }),
      }));
      return starter === "X" ? "O" : "X";
    });
  }, [mode, safeBoardCount]);

  useEffect(() => {
    if (mode !== "bot" || current !== "O" || matchOver) return;

    patch({ botThinking: true });

    const timer = setTimeout(() => {
      setState((prev) => {
        if (prev.matchOver || prev.current !== "O") return { ...prev, botThinking: false };

        const candidates = prev.boards
          .map((b, idx) => {
            if (b.gameOver) return null;
            const move = getBotMove([...b.cells]);
            if (move === -1) return null;
            const nextCells = [...b.cells];
            nextCells[move] = "O";
            return { boardIndex: idx, cellIndex: move, immediateWin: Boolean(checkWin(nextCells)) };
          })
          .filter(Boolean);

        if (candidates.length === 0) return { ...prev, botThinking: false };

        const alreadyWon = prev.boards.filter((b) => b.result === "O").length;
        const needsForMatch = prev.boards.length === 2 ? 2 : prev.boards.length === 3 ? 2 : 1;

        const winningMatchNow = candidates.find((c) => c.immediateWin && alreadyWon + 1 >= needsForMatch);
        const best = winningMatchNow ?? candidates.find((c) => c.immediateWin) ?? candidates[0];

        const nextBoards = prev.boards.map((b, idx) => {
          if (idx !== best.boardIndex) return b;
          const nextCells = [...b.cells];
          nextCells[best.cellIndex] = "O";

          const win = checkWin(nextCells);
          const draw = !win && isDraw(nextCells);

          if (win) return { ...b, cells: nextCells, winCombo: win, winStyle: getWinLineStyle(win), gameOver: true, result: "O" };
          if (draw) return { ...b, cells: nextCells, gameOver: true, result: "D" };
          return { ...b, cells: nextCells };
        });

        const outcome = getMatchOutcome(nextBoards);
        if (outcome.done) {
          const statusText = outcome.winner
            ? outcome.winner === "O"
              ? "Bot wins!"
              : `Player ${outcome.winner} wins!`
            : "It's a draw!";

          return {
            ...prev,
            boards: nextBoards,
            matchOver: true,
            status: statusText,
            dotClass: outcome.winner ? "turn-dot dot-win" : "turn-dot",
            scores: outcome.winner
              ? { ...prev.scores, [outcome.winner]: prev.scores[outcome.winner] + 1 }
              : { ...prev.scores, D: prev.scores.D + 1 },
            botThinking: false,
          };
        }

        return {
          ...prev,
          boards: nextBoards,
          current: "X",
          status: "Player X's turn",
          dotClass: "turn-dot dot-x",
          botThinking: false,
        };
      });
    }, BOT_THINK_DELAY_MS);

    return () => clearTimeout(timer);
  }, [current, matchOver, mode]);

  function resetGame() {
    const starter = nextStarter;
    setNextStarter(starter === "X" ? "O" : "X");
    setState((prev) => ({
      ...prev,
      ...createInitialState({ boardCount: safeBoardCount, mode, starter }),
    }));
  }

  function resetAll() {
    setNextStarter("O");
    setState({
      ...createInitialState({ boardCount: safeBoardCount, mode, starter: "X" }),
      scores: { X: 0, O: 0, D: 0 },
    });
  }

  return {
    boards,
    current,
    matchOver,
    gameOver: matchOver,
    status,
    dotClass,
    botThinking,
    scores,
    handleClick: applyMove,
    resetGame,
    resetAll,
    applyOpponentMove,
    applyReset,
    applyScores,
  };
}
