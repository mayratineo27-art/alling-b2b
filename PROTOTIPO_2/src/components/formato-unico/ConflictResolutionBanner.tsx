import { AlertTriangle, Send } from 'lucide-react';

interface ConflictResolutionBannerProps {
  conflictCount: number;
}

const ConflictResolutionBanner = ({ conflictCount }: ConflictResolutionBannerProps) => {
  if (conflictCount === 0) return null;

  return (
    <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="bg-danger/20 p-2 rounded-full text-danger flex-shrink-0 mt-0.5">
          <AlertTriangle size={20} />
        </div>
        <div>
          <h3 className="font-bold text-danger text-sm">
            Atención: Tienes {conflictCount} {conflictCount === 1 ? 'ítem' : 'ítems'} con inventario insuficiente.
          </h3>
          <p className="text-danger/80 text-xs mt-1">
            Revisa las filas marcadas en rojo. Puedes reducir la cantidad solicitada o contactar a tu asesor B2B para buscar alternativas o programar una importación.
          </p>
        </div>
      </div>
      
      <button className="flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1C88BA] text-white font-semibold py-2 px-4 rounded-lg shadow-sm transition text-sm flex-shrink-0 w-full sm:w-auto">
        <Send size={16} />
        Resolver vía Telegram
      </button>
    </div>
  );
};

export default ConflictResolutionBanner;
