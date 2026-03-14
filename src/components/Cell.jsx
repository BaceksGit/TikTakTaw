export default function Cell({ value, index, isWin, onClick, disabled }) {
    const markClass = [
        "cell-mark",
        value ? "show" : "",
        isWin ? "win-mark" : value === "X" ? "x-mark" : value === "O" ? "o-mark" : "",
        ].join(" ").trim();
    
        return (
        <div
            className={`cell${value ? " taken" : ""}${disabled ? " no-hover" : ""}`}
            onClick={onClick}
        >
            <span className={markClass}>{value}</span>
        </div>
        );
    }