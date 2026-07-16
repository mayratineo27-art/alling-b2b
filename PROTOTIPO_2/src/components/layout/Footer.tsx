import { CreditCard, ShieldCheck } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111111] text-white pt-16 pb-8 px-4 mt-auto">
      <div className="container mx-auto max-w-7xl">
        
        {/* Tres Columnas Superiores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12 border-b border-gray-800 pb-12">
          
          {/* Columna 1 */}
          <div>
            <h2 className="text-3xl font-extrabold text-primary tracking-tight mb-5">Alling</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 font-medium">
              Plataforma B2B/B2C especializada en equipos de redes, fibra óptica e infraestructura de telecomunicaciones en Perú. El stock más confiable para tus proyectos.
            </p>
          </div>

          {/* Columna 2 */}
          <div>
            <h3 className="font-extrabold text-white mb-6 uppercase text-sm tracking-widest">Enlaces Rápidos</h3>
            <ul className="space-y-3 text-sm text-gray-400 font-medium">
              <li><a href="#" className="hover:text-primary transition flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Catálogo de Productos</a></li>
              <li><a href="#" className="hover:text-primary transition flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Formato Único</a></li>
              <li><a href="#" className="hover:text-primary transition flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Rastrear Pedido</a></li>
              <li><a href="#" className="hover:text-primary transition flex items-center gap-2"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Políticas de Devolución</a></li>
            </ul>
          </div>

          {/* Columna 3 */}
          <div>
            <h3 className="font-extrabold text-white mb-6 uppercase text-sm tracking-widest">Contacto B2B</h3>
            <ul className="space-y-4 text-sm text-gray-400 font-medium">
              <li className="flex items-start gap-3">
                <div className="mt-1 text-primary"><ShieldCheck size={18} /></div>
                <div>
                  <span className="block text-gray-500 text-xs font-bold uppercase mb-1">Ventas Corporativas</span>
                  <a href="mailto:ventas@alling.com.pe" className="hover:text-primary transition text-white">ventas@alling.com.pe</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="mt-1 text-primary"><CreditCard size={18} /></div>
                <div>
                  <span className="block text-gray-500 text-xs font-bold uppercase mb-1">Soporte Técnico</span>
                  <a href="tel:+51987654321" className="hover:text-primary transition text-white">+51 987 654 321</a>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Franja Inferior: Copyright & Trust Signals */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm font-semibold text-gray-600">
            © 2026 Alling. Todos los derechos reservados.
          </div>
          
          {/* Trust Signals (Medios de Pago) */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">Pagos Seguros:</span>
            
            {/* Visa */}
            <div className="bg-white px-2.5 py-1 rounded shadow-sm flex items-center justify-center h-8">
              <span className="text-blue-900 font-extrabold italic tracking-tighter text-lg">VISA</span>
            </div>
            
            {/* Mastercard */}
            <div className="bg-white px-2 py-1 rounded shadow-sm flex items-center justify-center gap-0.5 h-8">
              <div className="w-4 h-4 rounded-full bg-red-600"></div>
              <div className="w-4 h-4 rounded-full bg-yellow-500 -ml-2 mix-blend-multiply"></div>
            </div>
            
            {/* Mercado Pago */}
            <div className="bg-[#009EE3] px-3 py-1 rounded shadow-sm flex items-center justify-center h-8">
              <span className="text-white font-extrabold text-xs">mercado</span>
              <span className="text-white font-medium text-xs ml-0.5">pago</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
