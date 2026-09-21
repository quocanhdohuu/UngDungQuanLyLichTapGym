export function AdminIcon({ name }) {
  const paths = {
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6" />
        <path d="m16 16 4 4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    refresh: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M19 12a7 7 0 1 1-2-5l3 3" />
      </>
    ),
    edit: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    chevron: <path d="m6 9 6 6 6-6" />,
    filter: <path d="M4 6h16M7 12h10M10 18h4" />,
    grip: <path d="M8 7h.01M8 12h.01M8 17h.01M14 7h.01M14 12h.01M14 17h.01" />,
  };
  return (
    <svg
      className="admin-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function AdminSearchInput({ className = "", ...props }) {
  return (
    <label className={`admin-search ${className}`}>
      <AdminIcon name="search" />
      <input {...props} aria-label={props["aria-label"] || props.placeholder} />
    </label>
  );
}

export function AdminFilterSelect({ label, children, ...props }) {
  return (
    <label className="admin-filter-select">
      <span>{label}:</span>
      <select {...props}>{children}</select>
      <AdminIcon name="chevron" />
    </label>
  );
}
