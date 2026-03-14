import { useEffect, useRef, useState, useCallback } from "react";

export function usePeer({ onMove, onReset, onScores, onOpponentJoined, onOpponentLeft }) {
    const peerRef = useRef(null);
    const connRef = useRef(null);
    const [peerId, setPeerId] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);

    // Init PeerJS
    useEffect(() => {
        let peer;
        // Dynamically load PeerJS from CDN
        const script = document.createElement("script");
        script.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
        script.onload = () => {
        peer = new window.Peer();
        peerRef.current = peer;

        peer.on("open", (id) => {
            setPeerId(id);
            setReady(true);
        });

        peer.on("connection", (conn) => {
            connRef.current = conn;
            setupConn(conn);
        });

        peer.on("error", (err) => {
            setError(err.message);
        });
        };
        document.body.appendChild(script);

        return () => {
        peer?.destroy();
        document.body.removeChild(script);
        };
    }, []);

    function setupConn(conn) {
        conn.on("open", () => {
        setConnected(true);
        onOpponentJoined?.();
        });

        conn.on("data", (data) => {
        if (data.type === "move") onMove?.(data.index);
        if (data.type === "reset") onReset?.();
        if (data.type === "scores") onScores?.(data.scores);
        });

        conn.on("close", () => {
        setConnected(false);
        connRef.current = null;
        onOpponentLeft?.();
        });

        conn.on("error", (err) => {
        setError(err.message);
        });
    }

    const connectToPeer = useCallback((remotePeerId) => {
        if (!peerRef.current) return;
        const conn = peerRef.current.connect(remotePeerId);
        connRef.current = conn;
        setupConn(conn);
    }, []);

    const sendMove = useCallback((index) => {
        connRef.current?.send({ type: "move", index });
    }, []);

    const sendReset = useCallback(() => {
        connRef.current?.send({ type: "reset" });
    }, []);

    const sendScores = useCallback((scores) => {
        connRef.current?.send({ type: "scores", scores });
    }, []);

    return { peerId, connected, error, ready, connectToPeer, sendMove, sendReset, sendScores };
}