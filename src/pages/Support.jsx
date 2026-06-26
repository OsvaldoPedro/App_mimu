import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Support() {
  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 md:p-12">
          <h1 className="text-xl md:text-2xl md:text-3xl md:text-4xl font-bold text-mimu-wine-text dark:text-white mb-4 text-center">Ajuda & Suporte</h1>
          <p className="text-center text-mimu-wine-light-text dark:text-gray-300/80 mb-10">Se precisar de ajuda, entre em contacto com a equipa Mimu.</p>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-mimu-cream dark:bg-[#121212]/50 p-4 md:p-6 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A]">
              <div className="text-xl md:text-2xl md:text-3xl md:text-4xl mb-3">📧</div>
              <h3 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-2">E-Mail</h3>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-1">Para suporte técnico ou dúvidas abrangentes, escreva para:</p>
              <a href="mailto:mimuagente@gmail.com" className="text-mimu-gold font-bold hover:underline">mimuagente@gmail.com</a>
            </div>

            <div className="bg-mimu-cream dark:bg-[#121212]/50 p-4 md:p-6 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A]">
              <div className="text-xl md:text-2xl md:text-3xl md:text-4xl mb-3">📞</div>
              <h3 className="text-xl font-bold text-mimu-wine-text dark:text-white mb-2">Telefone</h3>
              <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-1">Linha de atendimento para questões urgentes:</p>
              <a href="tel:+244922157099" className="text-mimu-gold font-bold hover:underline">+244 922 157 099</a>
            </div>
          </div>

          <div className="border-t-2 border-mimu-cream-border dark:border-[#2A2A2A] pt-10">
            <h2 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-6">Instruções Básicas</h2>
            
            <div className="space-y-4">
              <details className="group bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-gold/40 rounded-xl p-4 cursor-pointer">
                <summary className="font-semibold text-mimu-wine-light-text dark:text-gray-300 flex justify-between items-center outline-none">
                  Como reservar um serviço?
                  <span className="text-mimu-gold group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 text-mimu-wine-light-text dark:text-gray-300/80 text-sm">
                  1. Crie ou inicie sessão como "Cliente".<br/>
                  2. Navegue até à nossa lista de "Serviços" ou explore as Categorias na barra superior.<br/>
                  3. Clique no Cartão do serviço, identifique o preço e abra-o.<br/>
                  4. Clique no Botão "Ligar" ou "Copiar Número" e contacte o Prestador via Telefone diretamente para agendamento!
                </div>
              </details>

              <details className="group bg-mimu-white dark:bg-[#1E1E1E] border border-mimu-gold/40 rounded-xl p-4 cursor-pointer">
                <summary className="font-semibold text-mimu-wine-light-text dark:text-gray-300 flex justify-between items-center outline-none">
                  Sou um Prestador de Serviços. Como publico o meu anúncio?
                  <span className="text-mimu-gold group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-4 text-mimu-wine-light-text dark:text-gray-300/80 text-sm">
                  1. Crie a sua Conta ("Registar" &gt; "Prestador de Serviços" ou "Empresa").<br/>
                  2. Entregue os documentos solicitados para aprovação de conta.<br/>
                  3. Acesso ao Painel e clique em "Os meus serviços" &gt; "Criar Serviço".<br/>
                  4. Indique as especialidades, preço, fotos demonstrativas e grave. Ele figurará em público de imediato!
                </div>
              </details>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
