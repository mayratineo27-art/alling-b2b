import { Server, Cable, Wifi, HardDrive } from 'lucide-react';

const CATEGORIES = [
  { id: 'cat1', name: 'Cableado Estructurado', count: 145, icon: Cable },
  { id: 'cat2', name: 'Fibra Óptica', count: 89, icon: Wifi },
  { id: 'cat3', name: 'Switches', count: 42, icon: Server },
  { id: 'cat4', name: 'Racks y Gabinetes', count: 67, icon: HardDrive },
];

const HeroCategoryGrid = () => {
  return (
    <section className="mb-8">
      {/* Hero Banner (RF-CAT-004) */}
      <div className="w-full min-h-[300px] bg-gradient-to-r from-slate-900 to-slate-800 flex items-center justify-center relative overflow-hidden rounded-xl mb-6 shadow-md">
        {/* Efecto Bokeh simulado (círculos desenfocados) */}
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] opacity-60"></div>
        
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Infraestructura B2B para Telecomunicaciones
          </h1>
          <p className="text-gray-300 mb-8 text-lg md:text-xl font-medium max-w-2xl mx-auto">
            El catálogo más completo de hardware corporativo en Perú con disponibilidad inmediata.
          </p>
          <button className="bg-primary hover:bg-primary-hover text-white font-bold py-3.5 px-8 rounded-lg shadow-lg transition transform hover:-translate-y-0.5 text-lg">
            Ver Catálogo Completo
          </button>
        </div>
      </div>

      {/* Category Grid (RF-CAT-005) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <div 
              key={category.id} 
              className="bg-white p-5 rounded-xl border border-border shadow-sm hover:shadow-md transition cursor-pointer flex flex-col items-center text-center group"
            >
              <div className="bg-muted group-hover:bg-primary/10 transition p-4 rounded-full mb-4 text-gray-500 group-hover:text-primary">
                <Icon size={32} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{category.name}</h3>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {category.count} productos
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HeroCategoryGrid;
