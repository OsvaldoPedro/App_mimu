import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutMimu() {
  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 md:p-12">
          <h1 className="text-xl md:text-2xl md:text-3xl md:text-4xl font-bold text-mimu-wine-text dark:text-white mb-6">Sobre a Mimu</h1>
          
          <div className="space-y-6 text-mimu-wine-light-text dark:text-gray-300/80 leading-relaxed">
            <p>
              A <strong>Mimu</strong> é uma plataforma inovadora criada com o objetivo central de aproximar clientes, prestadores de serviços independentes e empresas, facilitando o quotidiano de todos.
            </p>
            
            <h2 className="text-xl md:text-2xl font-semibold text-mimu-gold mt-8 mb-4">A Nossa Missão</h2>
            <p>
              O nosso propósito é democratizar o acesso a serviços de qualidade de forma rápida, segura e transparente. Ao ligarmos quem precisa com quem sabe fazer, criamos oportunidades de negócio para os prestadores e comodidade para os clientes. A Mimu atua como a ponte de confiança entre a procura e a oferta no mercado.
            </p>

            <h2 className="text-xl md:text-2xl font-semibold text-mimu-gold mt-8 mb-4">Como Funciona</h2>
            <p>
              A Mimu foi desenhada para facilitar a procura, reserva e contacto direto entre utilizadores. Através da nossa plataforma, um utilizador pode explorar diversas categorias, comparar serviços, avaliar negócios e estabelecer um canal de comunicação imediato com a empresa ou prestador de serviço escolhido.
            </p>

            <h2 className="text-xl md:text-2xl font-semibold text-mimu-gold mt-8 mb-4">O Nosso Compromisso</h2>
            <p>
              Acreditamos que a tecnologia deve servir as pessoas. Por isso, desenvolvemos a Mimu para ser intuitiva, acessível e segura, garantindo sempre a proteção e privacidade dos intervenientes.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
