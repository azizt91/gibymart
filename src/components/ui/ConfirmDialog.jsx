import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';

/**
 * Reusable Confirmation Modal Component
 * Used for delete confirmations, status toggles, etc.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Tindakan',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  isLoading = false
}) {
  const variantIcons = {
    danger: { icon: AlertCircle, color: 'text-accent-red bg-rose-50' },
    warning: { icon: AlertTriangle, color: 'text-accent-orange bg-amber-50' },
    info: { icon: Info, color: 'text-accent-blue bg-blue-50' }
  };

  const config = variantIcons[variant] || variantIcons.danger;
  const Icon = config.icon;

  const confirmBtnVariants = {
    danger: 'danger',
    warning: 'primary',
    info: 'primary'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isLoading}
    >
      <div className="text-center pt-2 pb-4">
        <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${config.color}`}>
          <Icon className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-text-dark mb-2">{title}</h3>
        <p className="text-xs text-text-muted leading-relaxed px-2 mb-6">{message}</p>

        <div className="flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={onClose}
            isDisabled={isLoading}
            className="w-1/2"
          >
            {cancelLabel}
          </Button>

          <Button
            variant={confirmBtnVariants[variant]}
            size="md"
            onClick={onConfirm}
            isLoading={isLoading}
            className="w-1/2"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
