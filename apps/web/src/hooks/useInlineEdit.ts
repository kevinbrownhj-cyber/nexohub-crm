import { useState } from 'react';

interface EditingCell {
  id: string;
  field: string;
}

export function useInlineEdit() {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (id: string, field: string, currentValue: any) => {
    setEditingCell({ id, field });
    setEditValue(currentValue?.toString() || '');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const isEditing = (id: string, field: string) => {
    return editingCell?.id === id && editingCell?.field === field;
  };

  return {
    editingCell,
    editValue,
    setEditValue,
    startEditing,
    cancelEditing,
    isEditing,
  };
}
