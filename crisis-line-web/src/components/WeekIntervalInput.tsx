import React from 'react';

interface WeekIntervalInputProps {
  value: {
    start: string;
    end: string;
  };
  onChange: (value: { start: string; end: string }) => void;
}

const WeekIntervalInput: React.FC<WeekIntervalInputProps> = ({ value, onChange }) => {
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, start: e.target.value });
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...value, end: e.target.value });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block mb-1 font-semibold text-brand-700">Início da Recorrência</label>
        <input
          type="date"
          className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700"
          value={value.start}
          onChange={handleStartChange}
        />
      </div>
      <div>
        <label className="block mb-1 font-semibold text-brand-700">Fim da Recorrência</label>
        <input
          type="date"
          className="border rounded-full px-4 py-2 w-full bg-white/80 border-brand-200 focus:border-brand-500 focus:ring-brand-500 text-brand-700"
          value={value.end}
          onChange={handleEndChange}
        />
      </div>
    </div>
  );
};

export default WeekIntervalInput; 