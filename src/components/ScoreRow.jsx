export default function ScoreRow({ scores, mode }) {
    return (
        <div className="score-row">
            <div className="score-item">
            <span style={{ color: "#378ADD", fontWeight: 600 }}>X</span>
            <span className="score-num">{scores.X}</span>
            </div>
            <div className="score-item">
            <span>draws</span>
            <span className="score-num">{scores.D}</span>
            </div>
            <div className="score-item">
            <span style={{ color: "#1D9E75", fontWeight: 600 }}>
                {mode === "bot" ? "Bot" : "O"}
            </span>
            <span className="score-num">{scores.O}</span>
            </div>
        </div>
        );
    }
