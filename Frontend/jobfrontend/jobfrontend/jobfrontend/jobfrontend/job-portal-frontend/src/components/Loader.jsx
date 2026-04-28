function Loader({
  compact = false,
  description = '',
  label = 'Loading...',
}) {
  return (
    <div
      aria-live="polite"
      className={`loader${compact ? ' loader--compact' : ''}`}
      role="status"
    >
      <span aria-hidden="true" className="loader__spinner" />
      <div className="loader__copy">
        <strong className="loader__label">{label}</strong>
        {!compact && description && <p className="loader__description">{description}</p>}
      </div>
    </div>
  );
}

export default Loader;
