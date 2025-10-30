import { useState } from "react";
import EditableCell from "../EditableCell";

export default function EditableCellExample() {
  const [value1, setValue1] = useState(100);
  const [value2, setValue2] = useState(250.5);
  const [value3, setValue3] = useState(0);

  return (
    <div className="p-4 space-y-4">
      <div>
        <p className="text-sm mb-2">Editable Number Cell:</p>
        <EditableCell
          value={value1}
          onChange={setValue1}
          dataTestId="input-cell-1"
        />
      </div>
      <div>
        <p className="text-sm mb-2">Formula Support (try =100+150.5):</p>
        <EditableCell
          value={value2}
          onChange={setValue2}
          allowFormula={true}
          dataTestId="input-cell-formula"
        />
      </div>
      <div>
        <p className="text-sm mb-2">Read-only Cell:</p>
        <EditableCell
          value={value3}
          onChange={setValue3}
          editable={false}
          dataTestId="input-cell-readonly"
        />
      </div>
    </div>
  );
}
