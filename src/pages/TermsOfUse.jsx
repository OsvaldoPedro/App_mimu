import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 md:p-12">
          <h1 className="text-xl md:text-2xl md:text-3xl md:text-4xl font-bold text-mimu-wine-text dark:text-white mb-6">Termos de Uso</h1>
          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/60 mb-8">Última atualização: {new Date().toLocaleDateString('pt-AO')}</p>
          
          <div className="space-y-6 text-mimu-wine-light-text dark:text-gray-300/80 leading-relaxed whitespace-pre-line">
            <h2 className="text-xl font-bold text-mimu-gold">1. Aceitação dos Termos</h2>
            <p>Ao criar uma conta ou aceder à plataforma Mimu, seja na qualidade de Cliente, Prestador de Serviços ou Empresa, o utilizador concorda expressamente em vincular-se a estes Termos de Uso.</p>

            <h2 className="text-xl font-bold text-mimu-gold">2. A Nossa Posição como Intermediária</h2>
            <p><strong>A Empresa Mimu funciona como uma simples plataforma tecnológica de ligação e mercado digital.</strong> Não prestamos os serviços diretamente aos clientes, nem detemos relação laboral, supervisão ou subordinação com os Prestadores de Serviço e Empresas inscritos na nossa plataforma. Por este motivo, qualquer responsabilidade pela conduta, conformidade ou qualidade dos trabalhos prestados recai apenas e ativamente sobre os provedores contratados pelos clientes e não sobre a marca Mimu.</p>

            <h2 className="text-xl font-bold text-mimu-gold">3. Comportamento e Regras</h2>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li><strong>Informações Verdadeiras:</strong> Todos os utilizadores (clientes incluídos) comprometem-se a fornecer dados reais e atualizados nas suas páginas de perfil (identidade e contacto).</li>
              <li><strong>Boa Fé nas Conexões:</strong> As listagens de serviços efetuadas deverão refletir na íntegra a natureza real da oferta feita pelos promotores. Nenhum uso indevido ou especulativo será tolerado.</li>
              <li><strong>Proibido Práticas Ilegais:</strong> A Mimu não tolera em hipótese alguma esquemas danosos, linguagens prejudiciais, comportamentos de ódio e ofertas/serviços categorizados fora da lei ou difamatórios entre os intervenientes.</li>
            </ul>

            <h2 className="text-xl font-bold text-mimu-gold">4. Modificação e Rescisão</h2>
            <p>O não cumprimento contínuo dos nossos termos pode acarretar a suspensão temporária, eliminação e cancelamento de perfis que violarem gravemente a integridade do mercado construído pela Mimu. Reservamo-nos no direito de atualizar estes termos com notificações prévias à comunidade Mimu.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
