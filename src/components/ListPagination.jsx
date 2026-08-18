import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { PAGE_SIZE, getPageNumbers } from '../utils/pagination';

export default function ListPagination({
  total,
  currentPage,
  totalPages,
  onPageChange,
  pageSize = PAGE_SIZE,
  itemLabel = 'entry',
  itemLabelPlural,
}) {
  if (total <= 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, total);
  const pages = getPageNumbers(currentPage, totalPages);
  const label = total === 1 ? itemLabel : (itemLabelPlural || `${itemLabel}s`);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginTop: '20px', flexWrap: 'wrap', gap: '12px'
    }}>
      <div style={{ fontSize: '13px', color: '#6b7280' }}>
        Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong> {label}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: currentPage === 1 ? '#f9fafb' : 'white',
            color: currentPage === 1 ? '#9ca3af' : '#374151',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: '500', transition: 'all 0.15s'
          }}
        >
          <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '11px' }} />
          Previous
        </button>

        {pages.map((page, idx) =>
          page === '...'
            ? (
              <span key={`ellipsis-${idx}`} style={{
                padding: '7px 4px', color: '#9ca3af', fontSize: '13px', userSelect: 'none'
              }}>
                …
              </span>
            )
            : (
              <button
                type="button"
                key={page}
                onClick={() => onPageChange(page)}
                style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  border: currentPage === page ? '2px solid #F47B20' : '1px solid #e5e7eb',
                  background: currentPage === page ? '#F47B20' : 'white',
                  color: currentPage === page ? 'white' : '#374151',
                  cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  transition: 'all 0.15s'
                }}
              >
                {page}
              </button>
            )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', borderRadius: '8px', border: '1px solid #e5e7eb',
            background: currentPage === totalPages ? '#f9fafb' : 'white',
            color: currentPage === totalPages ? '#9ca3af' : '#374151',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontSize: '13px', fontWeight: '500', transition: 'all 0.15s'
          }}
        >
          Next
          <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '11px' }} />
        </button>
      </div>
    </div>
  );
}
