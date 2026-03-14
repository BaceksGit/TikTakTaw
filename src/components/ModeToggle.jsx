export default function ModeToggle({ mode, onChange }) {
    return (
        <div className="mode-toggle" role="tablist" aria-label="Game mode">
            <button
                type="button"
                role="tab"
                aria-selected={mode === "1v1"}
                className={`mode-btn${mode === "1v1" ? " active" : ""}`}
                onClick={() => onChange("1v1")}
            >
                1v1
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={mode === "bot"}
                className={`mode-btn${mode === "bot" ? " active" : ""}`}
                onClick={() => onChange("bot")}
            >
                vs Bot
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={mode === "online"}
                className={`mode-btn${mode === "online" ? " active" : ""}`}
                onClick={() => onChange("online")}
            >
                Online
            </button>
        </div>
    );
}