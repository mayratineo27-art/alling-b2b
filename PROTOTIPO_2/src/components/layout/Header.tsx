import { Search, ShoppingCart, User, Phone, Mail, Bell, Heart } from 'lucide-react';

interface HeaderProps {
  onViewChange?: (view: 'catalog' | 'fu') => void;
  currentView?: 'catalog' | 'fu';
}

const Header: React.FC<HeaderProps> = ({ onViewChange, currentView = 'catalog' }) => {
  return (
    <header className="flex flex-col shadow-sm w-full">
      {/* 1. Top Bar (Franja Superior Oscura) */}
      <div className="bg-black text-white py-1.5 px-4 text-xs font-medium">
        <div className="container mx-auto flex justify-between items-center max-w-7xl">
          {/* Alineación izquierda */}
          <div className="flex gap-5">
            <span className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition">
              <Phone size={14} /> +51 987 654 321
            </span>
            <span className="flex items-center gap-1.5 hover:text-primary cursor-pointer transition hidden sm:flex">
              <Mail size={14} /> ventas@alling.com.pe
            </span>
          </div>
          {/* Alineación derecha */}
          <div className="flex gap-4">
            <span className="hover:text-primary cursor-pointer transition text-gray-300 hover:text-white">
              Centro de Ayuda
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Nav (Barra Principal Blanca) */}
      <div className="bg-white border-b border-border py-4 px-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center max-w-7xl gap-6">
          
          {/* Alineación izquierda: Logotipo */}
          <div className="flex items-center">
            <button 
              onClick={() => onViewChange?.('catalog')}
              className="text-3xl font-extrabold text-primary tracking-tight"
            >
              Alling
            </button>
          </div>

          {/* Centro: Buscador Avanzado (RF-SYS-002) */}
          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition shadow-sm bg-white">
              <select className="bg-gray-50 border-r border-gray-300 text-gray-700 text-sm py-2.5 px-3 focus:outline-none cursor-pointer font-medium outline-none appearance-none pr-8 relative">
                <option value="all">Todas las Categorías</option>
                <option value="cables">Cables</option>
                <option value="fiber">Fibra Óptica</option>
                <option value="switches">Switches</option>
                <option value="racks">Racks y Gabinetes</option>
              </select>
              
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Buscar SKUs, modelos..." 
                  className="w-full pl-4 pr-10 py-2.5 bg-transparent text-sm text-gray-800 focus:outline-none outline-none"
                />
                <button className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-primary transition bg-transparent">
                  <Search size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Alineación derecha (4 Iconos de Acción exactos) */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* 1. Icono de Cuenta / Perfil */}
            <button className="text-gray-500 hover:text-primary transition p-2">
              <User size={22} />
            </button>
            
            {/* 2. Icono de Favoritos (RF-SYS-005) */}
            <div className="relative group">
              <button className="text-gray-500 hover:text-primary transition p-2">
                <Heart size={22} />
              </button>
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none z-50">
                Solo para clientes
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-800"></div>
              </div>
            </div>

            {/* 3. Icono de Notificaciones (RF-SYS-004) */}
            <button className="text-gray-500 hover:text-primary transition p-2 relative">
              <Bell size={22} />
              {/* Indicador visual FSM */}
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-warning rounded-full border-2 border-white"></span>
            </button>

            {/* 4. Icono de Carrito (Formato Único) */}
            <button 
              onClick={() => onViewChange?.('fu')}
              className={`flex items-center justify-center p-2.5 sm:px-4 sm:py-2.5 rounded-lg font-bold text-sm transition shadow-sm relative ml-1 sm:ml-2 ${
                currentView === 'fu' 
                  ? 'bg-primary-hover text-white ring-2 ring-primary ring-offset-2' 
                  : 'bg-primary hover:bg-primary-hover text-white'
              }`}
            >
              <ShoppingCart size={18} />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[11px] font-extrabold px-1.5 py-0.5 min-w-[20px] text-center rounded-full shadow border-2 border-white">
                3
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Bottom Bar (Menú de Navegación Principal) */}
      <div className="bg-white border-b border-border hidden md:block">
        <div className="container mx-auto max-w-7xl">
          <nav className="flex justify-center gap-8 py-3 text-[12px] font-extrabold text-gray-700 tracking-wider uppercase">
            <button onClick={() => onViewChange?.('catalog')} className="hover:text-primary transition">HOME</button>
            <button onClick={() => onViewChange?.('catalog')} className="hover:text-primary transition">CATÁLOGO</button>
            <a href="#" className="hover:text-primary transition">KITS</a>
            <a href="#" className="hover:text-primary transition">NOSOTROS</a>
            <a href="#" className="hover:text-primary transition">NUEVO / NOTICIAS</a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
