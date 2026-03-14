import { useState } from "react";

export default function OnlineModal({ peerId, ready, error, autoRoomId, onHost, onJoin, onClose }) {
    const [name, setName] = useState("");
    const [roomId, setRoomId] = useState(autoRoomId || "");
    const [view, setView] = useState(autoRoomId ? "join" : "menu"); // menu | host | join

    function handleHost() {
        if (!name.trim()) return;
        onHost(name.trim());
    }

    function handleJoin() {
        if (!name.trim() || !roomId.trim()) return;
        onJoin(name.trim(), roomId.trim());
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={onClose}>✕</button>

            {view === "menu" && (
            <>
                <h2 className="modal-title">Play with friends</h2>
                <p className="modal-sub">challenge a friend online · no account needed</p>
                <div className="modal-actions">
                <button className="modal-btn primary" onClick={() => setView("host")}>
                    Create room
                </button>
                <button className="modal-btn" onClick={() => setView("join")}>
                    Join room
                </button>
                </div>
            </>
            )}

            {view === "host" && (
            <>
                <button className="modal-back" onClick={() => setView("menu")}>← back</button>
                <h2 className="modal-title">Create room</h2>
                <p className="modal-sub">you will play as <strong>X</strong> and go first</p>
                <input
                className="modal-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleHost()}
                maxLength={16}
                autoFocus
                />
                <button className="modal-btn primary" onClick={handleHost} disabled={!name.trim() || !ready}>
                {ready ? "Create room" : "Connecting…"}
                </button>
                {error && <p className="modal-error">{error}</p>}
            </>
            )}

            {view === "join" && (
            <>
                <button className="modal-back" onClick={() => setView("menu")}>← back</button>
                <h2 className="modal-title">Join room</h2>
                <p className="modal-sub">you will play as <strong>O</strong></p>
                <input
                className="modal-input"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={16}
                autoFocus
                />
                <input
                className="modal-input"
                placeholder="Room code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
                <button className="modal-btn primary" onClick={handleJoin} disabled={!name.trim() || !roomId.trim() || !ready}>
                {ready ? "Join room" : "Connecting…"}
                </button>
                {error && <p className="modal-error">{error}</p>}
            </>
            )}
        </div>
        </div>
    );
}