export default function WaitingRoom({ peerId, playerName, peerDead, onRefresh, onCancel }) {
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${peerId}`;
    
        async function copyLink() {
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert("Link copied!");
            } catch {
                prompt("Copy this link:", shareUrl);
            }
        }
    
        return (
        <div className="modal-overlay">
            <div className="modal">
            <h2 className="modal-title">
                {peerDead ? "Connection lost" : "Waiting for friend…"}
            </h2>
    
            {peerDead ? (
                <>
                <p className="modal-sub">
                    Your room expired — this happens if you switched apps or locked your screen.
                </p>
                <button className="modal-btn primary" onClick={onRefresh}>
                    Create new room
                </button>
                </>
            ) : (
                <>
                <p className="modal-sub">
                    Hi <strong>{playerName}</strong>! Share this link — <strong>keep this tab open</strong> while waiting:
                </p>
    
                <div className="room-link-box">
                    <span className="room-link-text">{shareUrl}</span>
                </div>
    
                <button className="modal-btn primary" onClick={copyLink}>
                    Copy link
                </button>
    
                <p className="modal-sub" style={{ fontSize: "0.75rem", opacity: 0.5, marginTop: "0.25rem" }}>
                    ⚠ Don't switch apps or lock your screen while waiting
                </p>
                </>
            )}
    
            <button className="modal-btn" onClick={onCancel} style={{ marginTop: "0.25rem" }}>
                Cancel
            </button>
            </div>
        </div>
        );
    }