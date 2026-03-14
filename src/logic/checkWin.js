export const WIN_COMBOS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
];

export function checkWin(board) {
    for (const [a, b, c] of WIN_COMBOS) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return [a, b, c];
        }
    }
    return null;
}

export function isDraw(board) {
    return board.every(c => c) && !checkWin(board);
}