export default function GridToggle({ grids, onChange, disabled }) {
  const options = [
    { value: 1, label: "1 Grid" },
    { value: 2, label: "2 Grids" },
    { value: 3, label: "3 Grids" },
  ];

  return (
    <div className="mode-toggle" role="tablist" aria-label="Grid count">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={grids === opt.value}
          className={`mode-btn${grids === opt.value ? " active" : ""}`}
          onClick={() => onChange(opt.value)}
          disabled={disabled}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

