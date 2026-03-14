export default function ScoreRow({ scores, mode, playerNames }) {
    const xLabel = mode === "online" && playerNames?.X ? playerNames.X : "X";
    const oLabel = mode === "bot" ? "Bot" : (mode === "online" && playerNames?.O ? playerNames.O : "O");

    return (
        <div className="score-row">
            <div className="score-item">
                <span style={{ color: "#378ADD", fontWeight: 600 }}>{xLabel}</span>
                <span className="score-num">{scores.X}</span>
            </div>
            <div className="score-item">
                <span>draws</span>
                <span className="score-num">{scores.D}</span>
            </div>
            <div className="score-item">
                <span style={{ color: "#1D9E75", fontWeight: 600 }}>{oLabel}</span>
                <span className="score-num">{scores.O}</span>
            </div>
        </div>
    );
}