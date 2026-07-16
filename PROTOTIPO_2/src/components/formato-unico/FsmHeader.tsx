import { FileSpreadsheet } from 'lucide-react';
import type { FsmState } from '../../types';

interface FsmHeaderProps {
  formatId: string;
  state: FsmState;
}

const FsmHeader = ({ formatId, state }: FsmHeaderProps) => {
  const getBadgeColors = () => {
    switch (state) {
      case 'BORRADOR':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'COTIZACION':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PEDIDO':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CONSULTA':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-textPrimary flex items-center gap-3">
          Formato Único {formatId}
          <span className={`text-xs font-bold px-2.5 py-1 rounded border ${getBadgeColors()}`}>
            {state}
          </span>
        </h1>
        <p className="text-textSecondary text-sm mt-1">
          Gestiona tus ítems, valida inventario y solicita tu cotización o pedido en línea.
        </p>
      </div>

      <button className="flex items-center gap-2 bg-white border border-border text-textPrimary hover:bg-muted font-semibold py-2 px-4 rounded-lg shadow-sm transition text-sm">
        <FileSpreadsheet size={18} className="text-success" />
        Importar Excel / CSV
      </button>
    </div>
  );
};

export default FsmHeader;
