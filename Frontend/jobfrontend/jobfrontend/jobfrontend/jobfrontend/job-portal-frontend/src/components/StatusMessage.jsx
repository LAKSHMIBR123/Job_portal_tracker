function StatusMessage({ message, title = '', variant = 'info' }) {
  if (!message) {
    return null;
  }

  const role = variant === 'error' ? 'alert' : 'status';

  return (
    <div className={`status-message status-message--${variant}`} role={role}>
      {title && <strong className="status-message__title">{title}</strong>}
      <span className="status-message__body">{message}</span>
    </div>
  );
}

export default StatusMessage;
