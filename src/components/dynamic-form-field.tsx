import React from 'react';
import { CustomFieldDefinition } from '@/lib/marketflow-client';

interface DynamicFormFieldProps {
  field: CustomFieldDefinition;
  value: any;
  onChange: (key: string, val: any) => void;
  disabled?: boolean;
}

export const DynamicFormField: React.FC<DynamicFormFieldProps> = ({
  field,
  value,
  onChange,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let finalVal: any = e.target.value;
    if (field.field_type === 'number') {
      finalVal = e.target.value === '' ? '' : Number(e.target.value);
    } else if (field.field_type === 'boolean') {
      finalVal = (e.target as HTMLInputElement).checked;
    }
    onChange(field.field_key, finalVal);
  };

  const renderInput = () => {
    switch (field.field_type) {
      case 'dropdown':
        return (
          <select
            id={`field-${field.field_key}`}
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-400">
              -- Select {field.field_label} --
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt} className="bg-slate-900 text-slate-200">
                {opt}
              </option>
            ))}
          </select>
        );

      case 'date':
        return (
          <input
            id={`field-${field.field_key}`}
            type="date"
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          />
        );

      case 'number':
        return (
          <input
            id={`field-${field.field_key}`}
            type="number"
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={`Enter ${field.field_label.toLowerCase()}...`}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-600"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center gap-3 pt-1">
            <input
              id={`field-${field.field_key}`}
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(field.field_key, e.target.checked)}
              disabled={disabled}
              className="h-4 w-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 transition disabled:opacity-50 cursor-pointer"
            />
            <label
              htmlFor={`field-${field.field_key}`}
              className="text-xs text-slate-300 font-medium cursor-pointer select-none"
            >
              {field.field_label} {field.is_required && <span className="text-rose-500">*</span>}
            </label>
          </div>
        );

      case 'text':
      default:
        return (
          <input
            id={`field-${field.field_key}`}
            type="text"
            value={value ?? ''}
            onChange={handleChange}
            disabled={disabled}
            placeholder={`Enter ${field.field_label.toLowerCase()}...`}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-600"
          />
        );
    }
  };

  if (field.field_type === 'boolean') {
    return <div className="space-y-1">{renderInput()}</div>;
  }

  return (
    <div className="space-y-1.5 text-left">
      <label
        htmlFor={`field-${field.field_key}`}
        className="block text-xs font-semibold text-slate-300 tracking-wide"
      >
        {field.field_label}
        {field.is_required && <span className="text-rose-400 ml-1 font-bold">*</span>}
      </label>
      {renderInput()}
    </div>
  );
};
