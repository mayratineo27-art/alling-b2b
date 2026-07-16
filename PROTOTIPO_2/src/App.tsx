import { useState } from 'react';
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import FormatoUnicoView from './components/formato-unico/FormatoUnicoView'
import CatalogView from './components/catalog/CatalogView'

function App() {
  const [currentView, setCurrentView] = useState<'catalog' | 'fu'>('catalog');

  return (
    <div className="min-h-screen flex flex-col font-sans bg-muted">
      <Header onViewChange={setCurrentView} />
      <main className="flex-1">
        {currentView === 'catalog' ? <CatalogView /> : <FormatoUnicoView />}
      </main>
      <Footer />
    </div>
  )
}

export default App
