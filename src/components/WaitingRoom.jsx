export default function WaitingRoom({ peerId, playerName, onCancel }) {
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
            <h2 className="modal-title">Waiting for friend…</h2>
            <p className="modal-sub">Hi <strong>{playerName}</strong>! Share this link with your friend:</p>

            <div className="room-link-box">
                <span className="room-link-text">{shareUrl}</span>
            </div>

            <button className="modal-btn primary" onClick={copyLink}>
                Copy link
            </button>

            <p className="modal-sub" style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.6 }}>
                Room code: <code>{peerId}</code>
            </p>

            <button className="modal-btn" onClick={onCancel} style={{ marginTop: "0.25rem" }}>
                Cancel
            </button>
            </div>
        </div>
    );
}