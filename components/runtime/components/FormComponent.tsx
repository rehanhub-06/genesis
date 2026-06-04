"use client";

import React, { useState, useCallback } from "react";
import type { UIComponent, FormField } from "@/types/schema";

interface FormComponentProps {
  component: UIComponent;
  data: Record<string, unknown>[];
  onSubmit?: (formData: Record<string, unknown>) => void;
}

interface FieldError {
  [fieldName: string]: string;
}

export default function FormComponent({ component, onSubmit }: FormComponentProps) {
  const fields = component.fields ?? [];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.name] = "";
    }
    return init;
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [submitted, setSubmitted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = useCallback(
    (name: string, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      // Clear error on change
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors]
  );

  const validate = useCallback((): boolean => {
    const newErrors: FieldError = {};
    for (const field of fields) {
      const val = values[field.name]?.trim() ?? "";

      if (field.required && !val) {
        newErrors[field.name] = `${field.label} is required`;
        continue;
      }

      if (val) {
        if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
          newErrors[field.name] = "Invalid email address";
        }
        if (field.type === "number" && isNaN(Number(val))) {
          newErrors[field.name] = "Must be a valid number";
        }
        if (field.type === "password" && val.length < 6) {
          newErrors[field.name] = "Password must be at least 6 characters";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [fields, values]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);

      if (!validate()) return;

      // Convert values to proper types
      const formData: Record<string, unknown> = {};
      for (const field of fields) {
        const raw = values[field.name];
        if (field.type === "number") {
          formData[field.name] = raw ? Number(raw) : null;
        } else {
          formData[field.name] = raw;
        }
      }

      onSubmit?.(formData);

      // Show success + reset
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      setValues(() => {
        const init: Record<string, string> = {};
        for (const f of fields) init[f.name] = "";
        return init;
      });
      setSubmitted(false);
      setErrors({});
    },
    [fields, values, validate, onSubmit]
  );

  const renderField = (field: FormField) => {
    const hasError = submitted && errors[field.name];
    const baseClasses = `w-full px-4 py-2.5 bg-white/5 border rounded-lg text-sm text-slate-200 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:ring-1 ${
      hasError
        ? "border-red-500/60 focus:border-red-400 focus:ring-red-400/30"
        : "border-white/10 focus:border-blue-500/50 focus:ring-blue-500/30"
    }`;

    if (field.type === "select") {
      return (
        <select
          value={values[field.name] || ""}
          onChange={(e) => handleChange(field.name, e.target.value)}
          className={`${baseClasses} appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]`}
        >
          <option value="" className="bg-slate-800">
            Select {field.label}…
          </option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800">
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type}
        value={values[field.name] || ""}
        onChange={(e) => handleChange(field.name, e.target.value)}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        className={baseClasses}
      />
    );
  };

  return (
    <div className="animate-fade-in-up">
      {component.title && (
        <h3 className="text-lg font-semibold text-white mb-4">{component.title}</h3>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-4 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm flex items-center gap-2 animate-fade-in-up">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Form submitted successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              {field.label}
              {field.required && <span className="text-red-400 ml-0.5">*</span>}
            </label>
            {renderField(field)}
            {submitted && errors[field.name] && (
              <p className="mt-1 text-xs text-red-400 animate-fade-in-up">
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}

        <button
          type="submit"
          className="w-full mt-2 px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transform hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-blue-500/20"
        >
          {component.submitLabel || "Submit"}
        </button>
      </form>
    </div>
  );
}
