import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../hooks/useI18n.ts';

export interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** App-styled replacement for the browser's confirm() popup. Cancel (button,
 *  backdrop click or Esc) calls onCancel. */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useI18n();
  const cancelRef = useRef<HTMLButtonElement | null>(null);
  const [visible, setVisible] = useState(false);
  const cancelFn = useRef(onCancel);
  cancelFn.current = onCancel;

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelFn.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div
      className={`confirm-modal-backdrop${visible ? ' visible' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-modal-title">
        <div className="confirm-modal-title" id="confirm-modal-title">{title}</div>
        <p className="confirm-modal-message">{message}</p>
        <div className="confirm-modal-actions">
          <button className="btn-secondary" ref={cancelRef} onClick={onCancel}>{t('common.cancel', 'Cancel')}</button>
          <button className={`btn-confirm${danger ? ' danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
