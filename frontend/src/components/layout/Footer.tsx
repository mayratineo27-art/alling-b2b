"use client";

import Image from "next/image";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94z" />
  </svg>
);

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="bg-[var(--alling-dark-bg)] text-gray-400 mt-auto" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Marca */}
        <div className="flex items-center gap-3 mb-10">
          <div className="rounded-lg bg-white p-1 shadow-sm">
            <Image src="/alling-logo.png" alt="Alling" width={40} height={40} className="w-10 h-10 rounded object-cover" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">Alling B2B</p>
            <p className="text-xs text-gray-500">Portal de compras corporativas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          {/* Columna 1: Contacto */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Contacto</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0 text-[var(--alling-primary)]" />
                <a href="tel:+51937256979" className="hover:text-[var(--alling-primary)] transition-colors">
                  +51 937 256 979
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0 text-[var(--alling-primary)]" />
                <a href="mailto:allingtechnology20@gmail.com" className="hover:text-[var(--alling-primary)] transition-colors">
                  allingtechnology20@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FacebookIcon />
                <a
                  href="https://www.facebook.com/profile.php?id=61560779214286"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--alling-primary)] transition-colors"
                >
                  Alling en Facebook
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0 text-[var(--alling-primary)]" />
                Lima, Perú
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0 text-[var(--alling-primary)]" />
                Lun–Vie 9:00–18:00
              </li>
            </ul>
          </div>

          {/* Columna 2: Información */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Información</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Nosotros", href: "/nosotros" },
                { label: "B2B / Mayoristas", href: "/b2b" },
                { label: "Política de pago", href: "/politica-pago" },
                { label: "Política de envío", href: "/politica-envio" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="hover:text-[var(--alling-primary)] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Columna 3: Legal */}
          <div>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "Términos y condiciones", href: "/terminos" },
                { label: "Privacidad", href: "/privacidad" },
                { label: "Devoluciones", href: "/devoluciones" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <a href={href} className="hover:text-[var(--alling-primary)] transition-colors">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Trust signals */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="bg-gray-800 px-3 py-1 rounded">🚚 Shalom</span>
              <span className="bg-gray-800 px-3 py-1 rounded">💳 Mercado Pago</span>
              <span className="bg-gray-800 px-3 py-1 rounded">🔒 SSL Seguro</span>
            </div>
            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Alling B2B. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>

      {/* Scroll to top */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={scrollToTop}
          className="bg-[var(--alling-primary)] text-white w-10 h-10 rounded-full shadow-lg flex items-center justify-center hover:bg-[var(--alling-primary-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--alling-primary)] focus:ring-offset-2"
          aria-label="Volver arriba"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </footer>
  );
};

export default Footer;
