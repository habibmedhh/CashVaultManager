import { useState, useEffect, useRef } from "react";

interface EditableCellProps {
  value: number | string;
  onChange: (value: number) => void;
  editable?: boolean;
  className?: string;
  type?: "number" | "text";
  allowFormula?: boolean;
  dataTestId?: string;
}

export default function EditableCell({
  value,
  onChange,
  editable = true,
  className = "",
  type = "number",
  allowFormula = false,
  dataTestId,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayValue, setDisplayValue] = useState(value.toString());
  const [isFormula, setIsFormula] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleFocus = () => {
    if (editable) {
      setIsEditing(true);
      const strValue = value.toString();
      if (strValue.startsWith("=")) {
        setIsFormula(true);
        setDisplayValue(strValue);
      }
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (allowFormula && displayValue.startsWith("=")) {
      try {
        const formula = displayValue.slice(1);
        const result = eval(formula.replace(/,/g, "."));
        if (!isNaN(result)) {
          onChange(Number(result));
          setDisplayValue(result.toString());
          setIsFormula(false);
        }
      } catch (error) {
        console.error("Invalid formula", error);
      }
    } else {
      const cleanedValue = displayValue.replace(/,/g, ".");
      const numValue = parseFloat(cleanedValue) || 0;
      console.log("[DEBUG] EditableCell blur - displayValue:", displayValue, "cleanedValue:", cleanedValue, "numValue:", numValue);
      onChange(numValue);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur();
    } else if (e.key === "Escape") {
      setDisplayValue(value.toString());
      setIsFormula(false);
      inputRef.current?.blur();
    }
  };

  const formatNumber = (num: number | string) => {
    const n = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(n)) return "0,00";
    return n.toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const baseClasses = "h-6 px-1 border-0 text-right font-mono tabular-nums text-[11px]";
  const editableClasses = editable
    ? "bg-transparent hover-elevate active-elevate-2 focus:ring-1 focus:ring-primary/50 focus:outline-none focus:bg-blue-50/30"
    : "bg-slate-100/50 cursor-not-allowed";

  return (
    <input
      ref={inputRef}
      type="text"
      value={isEditing ? displayValue : formatNumber(value)}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      readOnly={!editable}
      className={`${baseClasses} ${editableClasses} ${className}`}
      data-testid={dataTestId}
    />
  );
}
