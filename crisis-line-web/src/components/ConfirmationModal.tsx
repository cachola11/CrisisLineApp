import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md relative">
        <h2 className="text-2xl font-bold text-brand-700 mb-4">{title}</h2>
        <p className="text-brand-800 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 rounded-full font-bold text-brand-700 bg-softpink-100 border border-brand-200 hover:bg-brand-100 transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="px-6 py-2 rounded-full font-bold text-white bg-danger hover:bg-danger/90 transition disabled:opacity-50"
          >
            {isLoading ? 'A confirmar...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 