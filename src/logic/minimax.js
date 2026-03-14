import { checkWin } from "./checkWin";

function minimax(board, isMaximizing) {
    const win = checkWin(board);
    if (win) return isMaximizing ? -10 : 10;
    if (board.every(c => c)) return 0;

    if (isMaximizing) {
        let best = -Infinity;
        for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            board[i] = "O";
            best = Math.max(best, minimax(board, false));
            board[i] = "";
        }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < 9; i++) {
        if (!board[i]) {
            board[i] = "X";
            best = Math.min(best, minimax(board, true));
            board[i] = "";
        }
        }
        return best;
    }
    }

    export function getBotMove(board) {
    let bestScore = -Infinity, bestMove = -1;
    for (let i = 0; i < 9; i++) {
        if (!board[i]) {
        board[i] = "O";
        const score = minimax(board, false);
        board[i] = "";
        if (score > bestScore) {
            bestScore = score;
            bestMove = i;
        }
        }
    }
    return bestMove;
}