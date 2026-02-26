# Mimu — Plataforma de Reservas & Serviços

> Onde a vida encontra os seus melhores serviços.

Aplicação web premium de reservas com identidade africana moderna, oferecendo 5 categorias principais de serviços.

## Categorias

1. **🏨 Estadia & Alojamento** — Hotéis, alojamento local, guest houses, turismo rural, glamping, hospedaria, pensão, aluguer de residência
2. **🍽 Comer, Festas & Experiências** — Restaurantes, catering, eventos, jardins, festas, actividades culturais, tours, desporto, aventura, quiosque, cinema
3. **🚗 Mobilidade, Viagens & Bilhetes** — Rent-a-car, stand, bilhetes (avião, autocarro, cinema), táxi, moto-táxi, agências de viagens, pacotes turísticos
4. **💆 Beleza, Bem-Estar & Saúde** — Cabeleireiros, barbearias, spa, estética, massagens, personal trainer, clínicas, consultas, postos médicos
5. **🛠 Casa, Auto & Serviços Profissionais** — Canalização, electricidade, jardinagem, limpeza, oficinas, contabilidade, consultoria, arquitectura, informática, seguros, explicação

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
- Registo: nome empresa, email, telefone, endereço, descrição, categoria, serviços, preço base, horários, logotipo
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
