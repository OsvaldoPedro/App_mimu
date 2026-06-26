import { useState } from 'react'
import { toast } from 'react-hot-toast'
import Button from './common/Button'
import OptimizedImage from './common/OptimizedImage'

export default function ServiceProviderCard({ provider }) {
  const [copied, setCopied] = useState(false)
  
  // Fallback for missing phone
  const phone = provider?.phone || "Não especificado"
  const name = provider?.companyName || provider?.company_name || provider?.name || "Prestador Parceiro"

  const roleLabel = provider?.role === 'company' ? 'Empresa' : provider?.role === 'provider' ? 'Prestador' : 'Profissional'
  const roleColor = provider?.role === 'company' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(phone)
      setCopied(true)
      toast.success("Número copiado com sucesso!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
      toast.error("Erro ao copiar número")
    }
  }

  const userPhoto = provider?.avatar || provider?.avatar_url || provider?.logo_url || provider?.photo || provider?.logo;
  const userAvatar = userPhoto ? (
    <img src={userPhoto} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-mimu-gold" />
  ) : (
    <div className="w-12 h-12 rounded-full bg-mimu-cream dark:bg-[#121212] flex items-center justify-center border-2 border-mimu-gold">
      <span className="text-mimu-wine-text dark:text-white font-bold text-lg">
        {name?.charAt(0)?.toUpperCase()}
      </span>
    </div>
  );

  return (
    <div className="bg-mimu-white dark:bg-[#1E1E1E] shadow rounded-2xl p-4">
      <div className="mb-4 flex items-center gap-4">
        {userAvatar}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-mimu-wine-text dark:text-white truncate" title={name}>
              {name}
            </h3>
            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${roleColor}`}>
              {roleLabel}
            </span>
          </div>
          <p className="text-mimu-wine-light-text dark:text-gray-300/80 text-sm break-all sm:break-words">
            Número: {phone}
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        {phone !== "Não especificado" ? (
          <Button
            variant="blue"
            className="flex-1 text-sm font-semibold"
            onClick={() => {
              toast.success('A iniciar chamada...')
              window.location.href = `tel:${phone}`
            }}
          >
            Ligar
          </Button>
        ) : (
          <Button variant="secondary" disabled className="flex-1 text-sm text-mimu-text-muted font-semibold cursor-not-allowed">
            Ligar
          </Button>
        )}
        <Button
          onClick={handleCopyPhone}
          variant="blue"
          className="flex-1 text-sm font-semibold min-h-[44px]"
        >
          {copied ? "Copiado!" : "Copiar número"}
        </Button>
      </div>

      {/* Galeria do prestador/empresa (visivel ao publico) */}
      {provider?.gallery_urls && provider.gallery_urls.length > 0 && (
        <div className="mt-4 pt-4 border-t border-mimu-cream-border dark:border-[#2A2A2A]">
          <h4 className="text-sm font-semibold text-mimu-wine-text dark:text-white mb-3">Fotos & Espaço</h4>
          <div className="flex overflow-x-auto gap-2 pb-2">
            {provider.gallery_urls.map((url, i) => (
              <OptimizedImage 
                key={url} 
                src={url} 
                alt={`Galeria ${i}`} 
                className="h-20 w-20 flex-shrink-0 rounded-lg shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]"
                imgClassName="hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}