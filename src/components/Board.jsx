import Cell from "./Cell";

export default function Board({ board, winCombo, winStyle, onCellClick, botThinking, disabled }) {
    return (
        <div className={`board${botThinking ? " bot-thinking" : ""}${disabled ? " disabled" : ""}`}>
        <div className="line vline1" />
        <div className="line vline2" />
        <div className="line hline1" />
        <div className="line hline2" />
        <div className="win-line" style={winStyle} />
        {board.map((val, i) => (
            <Cell
            key={i}
            value={val}
            isWin={winCombo?.includes(i)}
            onClick={() => onCellClick(i)}
            disabled={botThinking || disabled}
            />
        ))}
        </div>
    );
}
