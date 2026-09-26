'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface GalleryPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
  pageSizeOptions?: number[];
}

export function GalleryPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
  className = '',
  pageSizeOptions = [8, 12, 16, 24]
}: GalleryPaginationProps) {
  if (totalPages <= 1 && totalItems <= pageSize) {
    return null;
  }

  // Calculate visible page range (e.g. 1 2 3 4 5)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      role="navigation"
      aria-label="Paginação da Galeria"
      className={`w-full flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 select-none ${className}`}
    >
      {/* Information Counter */}
      <div className="text-xs text-slate-400 font-mono text-center sm:text-left">
        Exibindo <span className="font-bold text-white">{startItem}-{endItem}</span> de{' '}
        <span className="font-bold text-pink-400">{totalItems}</span> momentos
      </div>

      {/* Center Controls: Prev, Numbers, Next */}
      <div className="flex items-center gap-1.5">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          aria-label="Primeira página"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="Página anterior"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-500 font-mono text-xs select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = Number(p);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={`page-${pageNum}`}
                type="button"
                onClick={() => onPageChange(pageNum)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-600 to-[#ff007f] text-white border-pink-500 shadow-md shadow-pink-900/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="Próxima página"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          aria-label="Última página"
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Page Size Selector (Optional) */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Por página:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              onPageChange(1);
              if (onPageSizeChange) {
                onPageSizeChange(Number(e.target.value));
              }
            }}
            aria-label="Itens por página"
            className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-pink-500 cursor-pointer"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}
    </nav>
  );
}
