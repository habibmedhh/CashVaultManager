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
      const numValue = parseFloat(displayValue.replace(/,/g, ".")) || 0;
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

  const baseClasses = "h-7 px-1 border text-right font-mono tabular-nums text-xs";
  const editableClasses = editable
    ? "bg-editable hover-elevate active-elevate-2 focus:ring-2 focus:ring-primary focus:outline-none"
    : "bg-muted/30";

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
