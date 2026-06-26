import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useServices } from '../context/ServicesContext'
import ServiceForm from '../components/ServiceForm'

export default function CreateProviderServicePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, isProvider } = useAuth()
  const isApproved = user?.status === 'active' || user?.status === 'approved'
  const { createProviderService } = useServices()

  if (!user || !isProvider) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <p className="text-mimu-wine-light-text dark:text-gray-300">{t('provider.onlyProvidersCanCreate', 'Apenas prestadores podem criar serviços.')}</p>
        <Link to="/" className="ml-4 text-mimu-gold">{t('common.back', 'Voltar')}</Link>
      </div>
    )
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen bg-mimu-cream dark:bg-[#121212] flex items-center justify-center">
        <p className="text-mimu-wine-light-text dark:text-gray-300">{t('provider.accountPending', 'Conta pendente de aprovação. Não é possível criar serviços ainda.')}</p>
        <Link to="/" className="ml-4 text-mimu-gold">{t('common.back', 'Voltar')}</Link>
      </div>
    )
  }

  const handleSubmit = async (payload) => {
    const result = await createProviderService({
      ...payload,
      providerId: user.id
    })
    if (result.success) {
      navigate('/prestador/servicos')
    } else {
      throw new Error(result.error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8 w-full">
      <Link to="/prestador/servicos" className="text-mimu-gold text-sm font-medium mb-4 inline-block">
        ← {t('provider.myServicesTitle', 'Meus serviços')}
      </Link>
      <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('provider.createNewService', 'Criar novo serviço')}</h1>
      <p className="text-mimu-wine-light-text dark:text-gray-300/80 mb-6" dangerouslySetInnerHTML={{ __html: t('provider.servicePendingValidation', 'O serviço ficará <strong>pendente de validação</strong> pelo Administrador antes de ficar público.') }} />
      <ServiceForm onSubmit={handleSubmit} submitLabel={t('provider.createServiceButton', 'Criar serviço')} onCancel={() => navigate('/prestador/servicos')} />
    </div>
  )
}

