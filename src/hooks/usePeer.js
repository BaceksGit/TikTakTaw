import { useEffect, useRef, useState, useCallback } from "react";

export function usePeer({ onMove, onReset, onScores, onSettings, onOpponentJoined, onOpponentLeft }) {
    const peerRef = useRef(null);
    const connRef = useRef(null);
    const scriptLoadedRef = useRef(false);
    const handlersRef = useRef({
        onMove,
        onReset,
        onScores,
        onSettings,
        onOpponentJoined,
        onOpponentLeft,
    });
    const [peerId, setPeerId] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);
    const [peerDead, setPeerDead] = useState(false);

    useEffect(() => {
        handlersRef.current = {
        onMove,
        onReset,
        onScores,
        onSettings,
        onOpponentJoined,
        onOpponentLeft,
        };
    }, [onMove, onReset, onScores, onSettings, onOpponentJoined, onOpponentLeft]);

    function normalizeIncoming(data) {
        if (typeof data === "string") {
        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
        }
        return data;
    }

    function setupConn(conn) {
        conn.on("open", () => {
        setConnected(true);
        handlersRef.current.onOpponentJoined?.();
        });

        conn.on("data", (data) => {
        const msg = normalizeIncoming(data);

        if (typeof msg === "number") {
            handlersRef.current.onMove?.(msg);
            return;
        }

        if (msg?.type === "move") {
            const payload = msg.payload ?? msg.index ?? msg.data;
            const normalizedPayload = typeof payload === "string" && /^\d+$/.test(payload) ? Number(payload) : payload;
            handlersRef.current.onMove?.(normalizedPayload);
        }
        if (msg?.type === "reset") handlersRef.current.onReset?.();
        if (msg?.type === "scores") handlersRef.current.onScores?.(msg.scores);
        if (msg?.type === "settings") handlersRef.current.onSettings?.(msg.settings);
        });

        conn.on("close", () => {
        setConnected(false);
        connRef.current = null;
        handlersRef.current.onOpponentLeft?.();
        });

        conn.on("error", (err) => {
        setError(err.message);
        });
    }

    function createPeer() {
        if (!window.Peer) return;
        const peer = new window.Peer();
        peerRef.current = peer;
        setPeerDead(false);
        setReady(false);
        setPeerId(null);

        peer.on("open", (id) => {
        setPeerId(id);
        setReady(true);
        setError(null);
        });

        peer.on("connection", (conn) => {
        connRef.current = conn;
        setupConn(conn);
        });

        peer.on("disconnected", () => {
        setPeerDead(true);
        setReady(false);
        });

        peer.on("error", (err) => {
        setError(err.message);
        setPeerDead(true);
        setReady(false);
        });
    }

    // Init PeerJS
    useEffect(() => {
        if (scriptLoadedRef.current) {
        createPeer();
        return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
        script.onload = () => {
        scriptLoadedRef.current = true;
        createPeer();
        };
        document.body.appendChild(script);

        return () => {
        peerRef.current?.destroy();
        };
    }, []);

    const reconnect = useCallback(() => {
        peerRef.current?.destroy();
        connRef.current = null;
        setConnected(false);
        setError(null);
        createPeer();
    }, []);

    const connectToPeer = useCallback((remotePeerId) => {
        if (!peerRef.current) return;
        const conn = peerRef.current.connect(remotePeerId);
        connRef.current = conn;
        setupConn(conn);
    }, []);

    const sendMove = useCallback((index) => {
        if (typeof index === "number") connRef.current?.send({ type: "move", index });
        else connRef.current?.send({ type: "move", payload: index });
    }, []);

    const sendReset = useCallback(() => {
        connRef.current?.send({ type: "reset" });
    }, []);

    const sendScores = useCallback((scores) => {
        connRef.current?.send({ type: "scores", scores });
    }, []);

    const sendSettings = useCallback((settings) => {
        connRef.current?.send({ type: "settings", settings });
    }, []);

    return { peerId, connected, error, ready, peerDead, reconnect, connectToPeer, sendMove, sendReset, sendScores, sendSettings };
}
