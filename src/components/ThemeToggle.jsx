import { THEME_ICONS } from "../hooks/useTheme";

export default function ThemeToggle({ theme, onCycle }) {
    return (
        <button className="theme-btn" onClick={onCycle} title={`Theme: ${theme}`}>
        <span className="theme-icon">{THEME_ICONS[theme]}</span>
        <span className="theme-label">{theme}</span>
        </button>
    );
}