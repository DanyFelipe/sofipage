import { useEffect, useCallback } from 'react';
import './ObjectModal.css';

interface ObjectModalProps {
  label: string;
  content: string;
  onClose: () => void;
}

/**
 * Modal that displays information about a clicked 3D object.
 * Closes on backdrop click or Escape key.
 */
export function ObjectModal({ label, content, onClose }: ObjectModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-card" role="dialog" aria-label={label}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>
        <h2 className="modal-label">{label}</h2>
        <p className="modal-content">{content}</p>
      </div>
    </div>
  );
}
