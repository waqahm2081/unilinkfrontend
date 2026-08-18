import { useEffect, useState } from 'react';
import { PAGE_SIZE } from '../utils/pagination';

export default function useListPagination(items, resetKey) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [resetKey]);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedItems = items.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    paginatedItems,
    total,
    totalPages,
    currentPage: safeCurrentPage,
    goToPage,
    pageSize: PAGE_SIZE,
  };
}
