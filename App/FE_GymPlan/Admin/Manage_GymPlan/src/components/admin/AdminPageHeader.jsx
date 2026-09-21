export default function AdminPageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="admin-page-header">
      <div className="admin-page-eyebrow">{eyebrow}</div>
      <div className="admin-page-copy">
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="admin-page-actions">{actions}</div>}
    </header>
  );
}
