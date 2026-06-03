import './ModifyGameModal.css';

const FORMATS = ['1V1', '2V2', '3V3', '4V4', '5V5'];

function ModifyGameModal({ settings, onClose, onDone }) {
  const { mode, format, haveBall } = settings;

  function update(key, value) {
    onDone({ ...settings, [key]: value });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modify-card" onClick={e => e.stopPropagation()}>

        <div className="modify-header">
          <span className="modify-title">BASKETBALL</span>
        </div>

        <div className="mode-toggle">
          <button
            className={`mode-option ${mode === 'competitive' ? 'active' : ''}`}
            // leaving casual: 5V5 is disabled for competitive, so drop back to 4V4
            onClick={() => onDone({ ...settings, mode: 'competitive', format: format === '5V5' ? '4V4' : format })}
          >
            COMPETITIVE
          </button>
          <button
            className={`mode-option ${mode === 'casual' ? 'active' : ''}`}
            // casual is always 5V5 — lock the format and hide the options
            onClick={() => onDone({ ...settings, mode: 'casual', format: '5V5' })}
          >
            CASUAL
          </button>
        </div>

        {mode === 'competitive' && (
          <div className="format-row">
            {FORMATS.map(f => {
              const disabled = f === '5V5';
              const active = format === f;
              return (
                <button
                  key={f}
                  className={`format-btn ${active ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && update('format', f)}
                  disabled={disabled}
                  aria-label={disabled ? `${f} — coming soon` : f}
                >
                  {f}
                </button>
              );
            })}
          </div>
        )}

        <div className="modify-footer">
          <div className="have-ball-row">
            <span className="have-ball-label">HAVE BALL</span>
            <button
              className={`have-ball-toggle ${haveBall ? 'on' : ''}`}
              onClick={() => update('haveBall', !haveBall)}
              aria-pressed={haveBall}
              aria-label="Have ball"
            >
              {haveBall ? '✓' : 'X'}
            </button>
          </div>
          <button className="done-btn" onClick={onClose}>DONE</button>
        </div>

      </div>
    </div>
  );
}

export default ModifyGameModal;
