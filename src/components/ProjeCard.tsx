import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { Proje } from '../../types';
import { Button } from '../../components/ui';
import { getStatusClass, getProgressClass } from '../utils/projeUtils';

interface ProjeCardProps {
  proje: Proje;
  onEdit: (proje: Proje) => void;
  onDelete: (id: number) => void;
}

export const ProjeCard: React.FC<ProjeCardProps> = ({ proje, onEdit, onDelete }) => (
  <div className="bg-white dark:bg-zinc-800 p-5 rounded-xl shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 group border border-zinc-200 dark:border-zinc-700">
    <div>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">{proje.name}</h3>
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusClass(proje.status)}`}>
          {proje.status}
        </span>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">Yönetici: {proje.manager}</p>
      <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 h-10 overflow-hidden">{proje.description}</p>
    </div>
    <div>
      <div className="mb-2">
        <div className="flex justify-between text-sm font-medium text-zinc-600 dark:text-zinc-300 mb-1">
          <span>İlerleme</span>
          <span>{proje.progress}%</span>
        </div>
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5">
          <div className={`h-2.5 rounded-full ${getProgressClass(proje.status)}`} style={{ width: `${proje.progress}%` }}></div>
        </div>
      </div>
      <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
        <span>Bütçe:</span>
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">
          {proje.spent.toLocaleString('tr-TR')} / {proje.budget.toLocaleString('tr-TR')} TL
        </span>
      </div>
      <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 mt-1">
        <span>{new Date(proje.startDate).toLocaleDateString('tr-TR')}</span>
        <span>{new Date(proje.endDate).toLocaleDateString('tr-TR')}</span>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-700 mt-4 pt-4 flex justify-end space-x-2">
        <ReactRouterDOM.Link to={`/projeler/${proje.id}`}>
          <Button variant="ghost" size="sm">Detaylar</Button>
        </ReactRouterDOM.Link>
        <Button variant="ghost" size="sm" onClick={() => onEdit(proje)}>Düzenle</Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => onDelete(proje.id)}>Sil</Button>
      </div>
    </div>
  </div>
);