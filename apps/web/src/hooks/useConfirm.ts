import { create } from 'zustand';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

interface ConfirmStore {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  variant: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
  open: (options: ConfirmOptions) => Promise<boolean>;
  close: () => void;
}

export const useConfirm = create<ConfirmStore>((set) => ({
  isOpen: false,
  title: '',
  description: '',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'default',
  onConfirm: () => {},
  onCancel: () => {},
  
  open: (options) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        description: options.description,
        confirmText: options.confirmText || 'Confirmar',
        cancelText: options.cancelText || 'Cancelar',
        variant: options.variant || 'default',
        onConfirm: () => {
          resolve(true);
          set({ isOpen: false });
        },
        onCancel: () => {
          resolve(false);
          set({ isOpen: false });
        },
      });
    });
  },
  
  close: () => set({ isOpen: false }),
}));
