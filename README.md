# Mimu — Plataforma de Reservas & Serviços

> Onde a vida encontra os seus melhores serviços.
>
> Aplicação web premium de reservas com identidade africana moderna, oferecendo uma ampla gama de categorias de serviços.

## Categorias

1. **🏨 Dormir & Estadia** — Hotéis, alojamento local, Hospedarias, Aluguer de Residência, AirBNB, Apartamentos por diária
2. **🍽 Comer, Beber & Experiências** — Restaurantes, Takeaway / Delivery, Bares & Lounge, Catering, Reservas de Mesa
3. **🎉 Festas & Eventos** — Salões de Eventos, DJs, Fotógrafos & Vídeo, Decoração, Catering para Eventos, Aluguer de Material, Bilheteira / Reservas
4. **🚗 Transporte & Mobilidade** — Táxi, Rent-a-car, Transfers, bilhetes de autocarro, bilhetes de avião, moto-táxi, agência de viagens, pacotes turísticos
5. **💄 Beleza, Bem-Estar & Saúde** — Cabeleireiros, Barbearias, Estética, Massagem, Spa, Clínicas, Profissionais de Saúde, Personal Trainer, Postos médicos
6. **🛠 Casa, Reparações & Mudanças** — Canalizador, electricista, carpinteiro, jardineiro, limpeza, Mudanças & Transportes, assistência técnica, Técnicos de Frio / Ar Condicionado, construção, Empregadas Domésticas
7. **🚘 Serviços Automóvel** — Mecânica Rápida, Lavagem de Viaturas, Reboque, Troca de Óleo, Diagnóstico Automóvel, mecânico
8. **📦 Entregas & Logística Local** — Motoboys, Entrega de Documentos, Pequenas Cargas, Recolhas & Envios
9. **💼 Profissionais & Serviços Empresariais** — Advogados, Contabilistas, Consultores, Designers, Marketing & Comunicação, Técnicos de Informática, Tradução / Redacção, Arquitecto
10. **📚 Formação & Capacitação** — Explicadores, Cursos Livres, Formação Profissional, Workshops, Formadores

## Design

- **Paleta:** Vinho escuro (#3A0D0D), dourado (#C58A2B), creme (#F4E8D8)
- **Tipografia:** Plus Jakarta Sans
- **Responsivo:** Mobile first, tablet, desktop

## Instalação

```bash
npm install
npm run dev
```

Aceder em: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Contas e Painéis

### Conta Cliente
- Registo: nome, telefone, email, foto, palavra-passe
- Painel: pedidos, histórico, notificações (pendente, aceite, concluído)
- Explorar categorias e solicitar serviços

### Conta Empresa
- Registo: nome empresa, email, telefone, endereço, descrição, categoria, serviços, horários, logotipo
- Painel: validar pedidos (aceitar/rejeitar), actualizar estado (em curso, concluído, cancelado), gerir serviços, estatísticas

### Conta Prestador de Serviços
- Registo: nome, categoria, serviços, preço base, horários, email, telefone, província
- Estado inicial: Pendente de Aprovação
- Painel: visão geral (reservas, ganhos, dívida), gestão de reservas, serviços, pagamentos (simulação), perfil

### Teste rápido
- **Empresa demo:** empresa@demo.ao / 123456
- **Prestador demo:** prestador@demo.ao / 123456  
- **Cliente demo:** cliente@demo.ao / 123456

Para ver pedidos na Empresa ou Prestador: reserva como cliente (hotel-1, rest-1 ou beleza-1) e faz login com empresa@demo.ao ou prestador@demo.ao para ver os pedidos.

## Tecnologias

- React 19
- Vite 7
- Tailwind CSS v4
