import React from 'react';

interface KisiSelectionBarProps {
  count: number;
  onDeleteSelected: () => void;
}

const KisiSelectionBar: React.FC<KisiSelectionBarProps> = ({ count, onDeleteSelected }) => {
  if (count <= 0) return null;

  return (
    <div className="flex items-center justify-between p-3 my-4 bg-zinc-100 dark:bg-zinc-700 rounded-lg">
      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
        {count} kişi seçildi
      </span>
      <div>
        <button
          onClick={onDeleteSelected}
          className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700"
        >
          Seçilenleri Sil
        </button>
      </div>
    </div>
  );
};

export default KisiSelectionBar;
