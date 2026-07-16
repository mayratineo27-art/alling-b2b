// frontend/src/app/nosotros/page.tsx

export default function NosotrosPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="bg-gray-900 text-white py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Sobre <span className="text-[#10B981]">Alling</span>
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                        Líderes en soluciones de fibra óptica y redes para empresas B2B.
                        Conectamos tu infraestructura con tecnología de punta.
                    </p>
                </div>
            </section>

            {/* Misión y Visión */}
            <section className="py-16 px-6 max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-8 bg-[#10B981] mr-3 rounded-full"></span>
                        Nuestra Misión
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        Proveer infraestructura de red confiable y escalable, garantizando
                        que nuestros clientes empresariales operen con la máxima eficiencia
                        y seguridad tecnológica.
                    </p>
                </div>

                <div className="bg-gray-50 p-8 rounded-lg border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                        <span className="w-2 h-8 bg-[#10B981] mr-3 rounded-full"></span>
                        Nuestra Visión
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        Ser el aliado estratégico número uno en conectividad industrial,
                        reconocidos por nuestra calidad técnica, tiempos de entrega precisos
                        y soporte especializado.
                    </p>
                </div>
            </section>

            {/* Valores / Stats */}
            <section className="bg-[#10B981] py-16 px-6 text-white">
                <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                    <div>
                        <div className="text-4xl font-bold mb-2">+10</div>
                        <div className="text-sm opacity-90">Años de experiencia</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">+500</div>
                        <div className="text-sm opacity-90">Proyectos completados</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">24/7</div>
                        <div className="text-sm opacity-90">Soporte técnico</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold mb-2">100%</div>
                        <div className="text-sm opacity-90">Garantía de calidad</div>
                    </div>
                </div>
            </section>
        </div>
    );
}