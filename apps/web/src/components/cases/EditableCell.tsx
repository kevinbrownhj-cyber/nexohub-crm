import { useState, useRef, useEffect } from 'react';
import { Check, X, Edit2, Calendar } from 'lucide-react';

interface EditableCellProps {
  type: 'text' | 'dropdown' | 'date' | 'number';
  value: any;
  options?: Array<{ id: string; name: string }>;
  onSave: (value: any) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  prefix?: string;
  className?: string;
}

export function EditableCell({
  type,
  value,
  options = [],
  onSave,
  disabled = false,
  placeholder = '',
  prefix = '',
  className = ''
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = async () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      setEditValue(value);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const getDisplayValue = () => {
    if (type === 'dropdown' && options.length > 0) {
      const option = options.find(opt => opt.id === value);
      return option?.name || '-';
    }
    if (type === 'date' && value) {
      return new Date(value).toLocaleDateString('es-PA');
    }
    if (type === 'number' && value !== null && value !== undefined) {
      return `${prefix}${value}`;
    }
    return value || '-';
  };

  if (disabled) {
    return <span className={className}>{getDisplayValue()}</span>;
  }

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`cursor-pointer hover:bg-gray-100 px-2 py-1 rounded group flex items-center gap-2 ${className}`}
      >
        <span>{getDisplayValue()}</span>
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {type === 'text' && (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[120px]"
          disabled={isSaving}
        />
      )}

      {type === 'number' && (
        <div className="flex items-center">
          {prefix && <span className="mr-1">{prefix}</span>}
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            step="0.01"
            value={editValue || ''}
            onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 w-24"
            disabled={isSaving}
          />
        </div>
      )}

      {type === 'dropdown' && (
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isSaving}
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      )}

      {type === 'date' && (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="date"
          value={editValue ? new Date(editValue).toISOString().split('T')[0] : ''}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="px-2 py-1 border border-primary-500 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isSaving}
        />
      )}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
        title="Guardar"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={handleCancel}
        disabled={isSaving}
        className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
        title="Cancelar"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
