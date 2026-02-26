import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const types = [
  { id: 'client', label: 'Cliente', desc: 'Reservar serviços e acompanhar pedidos', icon: '👤' },
  { id: 'company', label: 'Empresa', desc: 'Gerir serviços, pedidos e parceiros', icon: '🏢' },
  { id: 'provider', label: 'Prestador de Serviços', desc: 'Oferecer serviços e receber reservas', icon: '💼' }
]


export default function RegisterPage() {
  const [selected, setSelected] = useState(null)

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-[#3A0D0D] text-center mb-4">Criar conta</h1>
          <p className="text-[#5C1A1A]/80 text-center mb-10">Escolhe o tipo de conta que queres criar</p>

          <div className="space-y-4">
            {types.map((t) => (
              <Link
                key={t.id}
                to={`/registar/${t.id}`}
                className="block p-6 bg-white rounded-2xl shadow-md hover:shadow-lg border-2 border-transparent hover:border-[#C58A2B] transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{t.icon}</span>
                  <div>
                    <h2 className="text-xl font-bold text-[#3A0D0D]">{t.label}</h2>
                    <p className="text-[#5C1A1A]/80">{t.desc}</p>
                  </div>
                  <span className="ml-auto text-[#C58A2B]">→</span>
                </div>
              </Link>
            ))}
          </div>

          <p className="mt-8 text-center text-[#5C1A1A]/80 text-sm">
            Já tens conta?{' '}
            <Link to="/entrar" className="text-[#C58A2B] font-semibold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
