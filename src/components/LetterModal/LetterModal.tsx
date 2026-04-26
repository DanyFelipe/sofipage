import { useState, useCallback, useEffect, useRef } from 'react';
import { LETTER_CONTENT } from './letter.content';
import './LetterModal.css';

/**
 * Must match --letter-page-duration in LetterModal.css.
 * Keeps the JS timeout in sync with the CSS animation duration.
 */
const TRANSITION_MS = 280;

interface LetterModalProps {
  onClose: () => void;
}

type Direction = 'next' | 'prev';

/**
 * Paginated letter modal with animated page transitions.
 * Content lives in letter.content.ts — edit that file to change text or add pages.
 */
export function LetterModal({ onClose }: LetterModalProps) {
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState<Direction>('next');
  const [animating, setAnimating] = useState(false);
  const totalPages = LETTER_CONTENT.pages.length;
  const contentRef = useRef<HTMLDivElement>(null);

  // ─── Keyboard navigation ──────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onClose, page, animating],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);

    // Senior tip: Scroll Lock prevents the background from jumping 
    // and leaking through the edges of the backdrop filter.
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalStyle;
    };
  }, [handleKeyDown]);

  // ─── Pagination helpers ────────────────────────────────────────────────────

  const changePage = (newPage: number, dir: Direction) => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);

    // Wait for exit animation, then switch page
    setTimeout(() => {
      setPage(newPage);
      setAnimating(false);
    }, TRANSITION_MS);
  };

  const goNext = () => {
    if (page < totalPages - 1) changePage(page + 1, 'next');
  };

  const goPrev = () => {
    if (page > 0) changePage(page - 1, 'prev');
  };

  // ─── Backdrop ─────────────────────────────────────────────────────────────

  // ─── Derived ──────────────────────────────────────────────────────────────

  const isFirst = page === 0;
  const isLast = page === totalPages - 1;
  const currentPageData = LETTER_CONTENT.pages[page];
  const pageAnimClass = animating
    ? `letter-page--exit-${direction}`
    : `letter-page--enter-${direction}`;

  return (
    <div
      className="letter-backdrop"
      role="presentation"
    >
      <article
        className="letter-card"
        role="dialog"
        aria-modal="true"
        aria-label="Carta de Jiji"
      >
        {/* Wax seal */}
        <div className="letter-seal" aria-hidden="true"></div>

        {/* Close button */}
        <button
          id="letter-modal-close"
          className="letter-close"
          onClick={onClose}
          aria-label="Cerrar carta"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Greeting — only on first page */}
        {isFirst && (
          <p className="letter-greeting">{LETTER_CONTENT.greeting}</p>
        )}

        <div className="letter-divider" aria-hidden="true" />

        {/* Animated page content */}
        <div
          ref={contentRef}
          className={`letter-page ${pageAnimClass}`}
          key={page}
        >
          <div className="letter-body">
            {currentPageData.paragraphs.map((paragraph, i) => (
              <p key={i} className="letter-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="letter-divider" aria-hidden="true" />

        {/* Footer — signature only on last page */}
        {isLast ? (
          <footer className="letter-footer">
            <span className="letter-closing">{LETTER_CONTENT.closing}</span>
            <span className="letter-signature">{LETTER_CONTENT.signature}</span>
          </footer>
        ) : (
          <div className="letter-footer-spacer" />
        )}

        {/* Pagination controls */}
        <nav className="letter-pagination" aria-label="Páginas de la carta">
          <button
            id="letter-prev"
            className="letter-nav-btn"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Página anterior"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          <div className="letter-dots" role="list" aria-label="Páginas">
            {Array.from({ length: totalPages }).map((_, i) => (
              <span
                key={i}
                role="listitem"
                className={`letter-dot ${i === page ? 'letter-dot--active' : ''}`}
                aria-current={i === page ? 'true' : undefined}
              />
            ))}
          </div>

          <button
            id="letter-next"
            className="letter-nav-btn"
            onClick={goNext}
            disabled={isLast}
            aria-label="Página siguiente"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </nav>
      </article>
    </div>
  );
}
