import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 md:p-12">
          <h1 className="text-xl md:text-2xl md:text-3xl md:text-4xl font-bold text-mimu-wine-text dark:text-white mb-6">Política de Privacidade</h1>
          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/60 mb-8">Última atualização: {new Date().toLocaleDateString('pt-AO')}</p>
          
          <div className="space-y-6 text-mimu-wine-light-text dark:text-gray-300/80 leading-relaxed whitespace-pre-line">
            <h2 className="text-xl font-bold text-mimu-gold">1. Recolha de Dados</h2>
            <p>Ao utilizar a Mimu, recolhemos os dados estritamente necessários para o registo e funcionamento do serviço. Isto inclui o seu nome, número de telefone e, quando aplicável, fotografia de perfil ou logótipo associado à conta (cliente, empresa ou prestador da praça).</p>

            <h2 className="text-xl font-bold text-mimu-gold">2. Uso e Finalidade</h2>
            <p>Os dados recolhidos destinam-se exclusivamente à operacionalidade e funcionalidade da plataforma (por ex.: criação da identidade visual, agendamentos, facilitação de contacto entre clientes e prestadores). Garantimos que os dados inseridos não são fornecidos, alugados ou vendidos a entidades terceiras externas ao serviço Mimu.</p>

            <h2 className="text-xl font-bold text-mimu-gold">3. Segurança das Informações</h2>
            <p>Adotamos medidas técnicas e organizacionais contínuas para preservar a confidencialidade e a segurança dos dados pessoais dos nossos utilizadores face a acessos não autorizados. No entanto, o utilizador reconhece que nenhuma transmissão eletrônica é totalmente impenetrável, sendo partilhada a responsabilidade pela guarda das suas respetivas credenciais (password) de entrada.</p>

            <h2 className="text-xl font-bold text-mimu-gold">4. Acesso, Alteração e Exclusão</h2>
            <p>O utilizador tem total autoridade para alterar a sua informação pessoal no painel da conta a qualquer momento. Caso pretenda a remoção total da sua conta e registos associados, poderá requisitá-lo diretamente à equipa Mimu.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
