import Icon from './Icon';

export default function EmptyState({ icon = 'table', title = 'Nothing here yet', text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon" aria-hidden="true">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {text && <p className="empty-state-text">{text}</p>}
      {action}
    </div>
  );
}