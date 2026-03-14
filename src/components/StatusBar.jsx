export default function StatusBar({ dotClass, status }) {
    return (
        <div className="status-bar">
            <div className={dotClass}></div>
            <span>{status}</span>
        </div>
        );
    }