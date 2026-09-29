export default function AdminPagination({ page, totalPages, onPageChange }) {
  const visiblePages = [...new Set([
    1,
    page - 1,
    page,
    page + 1,
    totalPages,
  ])]
    .filter((number) => number >= 1 && number <= totalPages)
    .sort((a, b) => a - b);

  const items = [];
  visiblePages.forEach((number, index) => {
    if (index > 0 && number - visiblePages[index - 1] > 1) {
      items.push(
        <span key={`gap-${number}`} className="pagination-ellipsis" aria-hidden="true">
          …
        </span>,
      );
    }
    items.push(
      <button
        key={number}
        type="button"
        className={`page-number ${number === page ? "active" : ""}`}
        aria-label={`Trang ${number}`}
        aria-current={number === page ? "page" : undefined}
        onClick={() => onPageChange(number)}
      >
        {number}
      </button>,
    );
  });

  return (
    <nav className="pagination" aria-label="Phân trang">
      <button
        type="button"
        className="page-arrow"
        aria-label="Trang trước"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ‹
      </button>
      {items}
      <button
        type="button"
        className="page-arrow"
        aria-label="Trang sau"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
