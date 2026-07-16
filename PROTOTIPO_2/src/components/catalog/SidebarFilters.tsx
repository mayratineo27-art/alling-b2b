import { ChevronDown } from 'lucide-react';

const SidebarFilters = () => {
  return (
    <aside className="w-full">
      <div className="bg-white rounded-xl border border-border shadow-sm sticky top-24 overflow-hidden">
        
        {/* Header Filtros */}
        <div className="flex justify-between items-center p-5 border-b border-border bg-gray-50">
          <h2 className="font-extrabold text-gray-800 text-sm tracking-widest uppercase">Filtros</h2>
          <button className="text-xs text-primary hover:underline font-bold">Limpiar todo</button>
        </div>

        {/* Acordeón: Categoría */}
        <div className="border-b border-border">
          <button className="w-full flex justify-between items-center p-5 text-gray-800 hover:bg-gray-50 transition group">
            <span className="font-bold text-sm">Categoría</span>
            <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 transition" />
          </button>
          <div className="px-5 pb-5">
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="group-hover:text-primary font-medium">Cable UTP</span>
                </label>
              </li>
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="group-hover:text-primary font-medium">Fibra Óptica</span>
                </label>
              </li>
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="group-hover:text-primary font-medium">Switches</span>
                </label>
              </li>
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="group-hover:text-primary font-medium">Conectores</span>
                </label>
              </li>
            </ul>
          </div>
        </div>

        {/* Acordeón: Marca */}
        <div className="border-b border-border">
          <button className="w-full flex justify-between items-center p-5 text-gray-800 hover:bg-gray-50 transition group">
            <span className="font-bold text-sm">Marca</span>
            <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 transition transform rotate-180" />
          </button>
          <div className="px-5 pb-5">
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="font-medium">Cisco</span>
                </label>
              </li>
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="font-medium">Sigma</span>
                </label>
              </li>
              <li>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition group">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary w-4 h-4 accent-primary" /> 
                  <span className="font-medium">Panduit</span>
                </label>
              </li>
            </ul>
          </div>
        </div>

        {/* Acordeón: Precio */}
        <div>
          <button className="w-full flex justify-between items-center p-5 text-gray-800 hover:bg-gray-50 transition group">
            <span className="font-bold text-sm">Precio (S/)</span>
            <ChevronDown size={18} className="text-gray-400 group-hover:text-gray-600 transition" />
          </button>
          <div className="px-5 pb-6">
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                placeholder="Mín" 
                className="w-full bg-gray-50 border border-border rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
              />
              <span className="text-gray-400">-</span>
              <input 
                type="number" 
                placeholder="Máx" 
                className="w-full bg-gray-50 border border-border rounded-lg px-3 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition"
              />
            </div>
          </div>
        </div>
        
      </div>
    </aside>
  );
};

export default SidebarFilters;
