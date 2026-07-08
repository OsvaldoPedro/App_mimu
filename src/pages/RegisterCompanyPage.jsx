import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useCategories } from '../hooks/useCategories'
import AngolaLocationSelect from '../components/AngolaLocationSelect'
import WeeklyScheduler from '../components/WeeklyScheduler'
import DocumentUploadBox from '../components/DocumentUploadBox'
import { enforceNumeric, enforceAlphanumericText, isValidEmail, enforceNIF, isValidNIF } from '../utils/validation'
import { toast } from 'react-hot-toast'
import { getRequiredDocuments, getDocumentConfig } from '../utils/documentRequirements'
import { usePhoneVerification } from '../hooks/usePhoneVerification'
import PhoneOTPVerification from '../components/PhoneOTPVerification'

export default function RegisterCompanyPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    companyName: '', email: '', nif: '', phone: '', password: '', confirmPassword: '', province: '', city: '', description: '',
    categoryId: '', serviceTypes: [], hours: ''
  })
  const [documents, setDocuments] = useState({})
  const [documentErrors, setDocumentErrors] = useState({})
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [locationError, setLocationError] = useState('')

  
  const { registerCompany, user } = useAuth()
  const navigate = useNavigate()
  const { categories, loading: catsLoading } = useCategories()
  const phoneVerification = usePhoneVerification()

  const [showOtp, setShowOtp] = useState(false)
  const [phoneToVerify, setPhoneToVerify] = useState('')

  useEffect(() => {
    if (user) {
      const target = user.role === 'company' ? '/empresa' : user.role === 'provider' ? '/prestador' : user.role === 'admin' ? '/admin' : '/painel'
      navigate(target, { replace: true })
    }
  }, [user, navigate])

  const category = categories.find(c => c.id === form.categoryId)

  const handleChange = (e) => {
    let { name, value } = e.target

    if (name === 'phone') value = enforceNumeric(value).substring(0, 9)
    if (name === 'companyName') value = enforceAlphanumericText(value)
    if (name === 'nif') value = enforceNIF(value)

    setForm(f => ({ ...f, [name]: value }))
    if (name === 'categoryId') setForm(f => ({ ...f, serviceTypes: [] }))
  }

  const selectService = (s) => {
    setForm(f => ({
      ...f,
      serviceTypes: f.serviceTypes[0] === s ? [] : [s]
    }))
  }

  const handleDocumentChange = (docType, e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (docType === 'certificates') {
      setDocuments(prev => ({ ...prev, [docType]: [...(prev[docType] || []), ...files] }))
    } else {
      setDocuments(prev => ({ ...prev, [docType]: files[0] }))
    }
    setDocumentErrors(prev => { const next = { ...prev }; delete next[docType]; return next })
  }

  const removeDocument = (docType, i = null) => {
    setDocuments(prev => {
      const current = prev[docType]
      if (Array.isArray(current)) {
        return {
          ...prev,
          [docType]: current.filter((_, idx) => idx !== i)
        }
      }
      const next = { ...prev }
      delete next[docType]
      return next
    })
  }

  const requiredDocs = getRequiredDocuments(form.categoryId, form.serviceTypes, 'company')

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    setDocumentErrors({})

    if (form.companyName.trim().length < 2) {
      setError('Por favor, insira o nome da Empresa válido.')
      return;
    }

    const cleanPhone = form.email.replace(/\D/g, '');
    const isPhone = !form.email.includes('@') && cleanPhone.length === 9;
    const isEmail = isValidEmail(form.email);
    
    if (!isEmail && !isPhone) {
      setError('Por favor, insira um e-mail válido ou um número de telefone com 9 dígitos para a sua conta empresarial.')
      return;
    }

    if (!form.nif || !isValidNIF(form.nif)) {
      setError('O NIF deve conter exatamente 10 números.')
      return;
    }    if (form.password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('As palavras-passe não coincidem.')
      return
    }

    if (!form.categoryId) {
      setError(t('company.selectCategoryError'))
      return
    }

    if (form.serviceTypes.length !== 1) {
      setError(t('company.selectOneService'))
      return
    }

    if (!form.province || !form.city) {
      setLocationError(t('company.selectLocation'))
      return
    }

    const missingDocs = []
    for (const docType of requiredDocs.required) {
      const hasDoc = docType === 'certificates' ? documents[docType]?.length > 0 : documents[docType]
      if (!hasDoc) {
        const config = getDocumentConfig(docType, form.categoryId, form.serviceTypes, 'company')
        missingDocs.push(config.label)
        setDocumentErrors(prev => ({ ...prev, [docType]: `${config.label} é obrigatório` }))
      }
    }

    if (missingDocs.length > 0) {
      setError(t('company.missingRequiredDocs') + missingDocs.join(', '))
      return
    }

    const phoneVal = isPhone ? cleanPhone : form.phone

    // Se for registo por telefone, verificar primeiro por SMS OTP
    if (isPhone && !showOtp) {
      setPhoneToVerify(cleanPhone)
      setLoading(true)
      const res = await phoneVerification.sendCode(cleanPhone)
      setLoading(false)
      if (res.success) {
        setShowOtp(true)
      }
      return
    }

    setLoading(true)
    
    const result = await registerCompany({
      companyName: form.companyName,
      email: form.email,
      nif: form.nif,
      phone: phoneVal,
      password: form.password,
      province: form.province,
      city: form.city,
      description: form.description,
      categoryId: form.categoryId,
      serviceTypes: form.serviceTypes,
      hours: form.hours,
      documents
    })
    
    setLoading(false)

    if (result.success) {
      if (result.requireEmailConfirmation) {
        toast.success('Empresa criada com sucesso! Verifique o e-mail para validar.')
        navigate('/verificar-otp', { state: { email: form.email } });
      } else {
        toast.success('Conta de Empresa criada e aguarda aprovação!')
        navigate('/empresa', { replace: true })
      }
    } else {
      setError(result.error)
    }
  }



  return (
    <div className="min-h-screen bg-mimu-cream dark:bg-[#121212]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl p-4 md:p-8">
          <h1 className="text-xl md:text-2xl font-bold text-mimu-wine-text dark:text-white mb-2">{t('company.companyAccount')}</h1>
          
          <div className="mb-6 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 shadow-sm">
            <svg className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-amber-800 text-sm font-medium leading-relaxed">
              Os seus dados ficarão pendentes de aprovação pelo Administrador antes de poder aceder ao painel empresarial.
            </p>
          </div>

          {error && <div className="p-3 mb-4 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}

          {showOtp ? (
            <div key="stage-otp" className="animate-fade-in">
              <PhoneOTPVerification
                phone={phoneToVerify}
                sendCodeHook={phoneVerification}
                onCancel={() => setShowOtp(false)}
                onVerifySuccess={async () => {
                  // Proceder com a criação da conta após OTP verificado
                  setLoading(true)
                  const result = await registerCompany({
                    companyName: form.companyName,
                    email: form.email,
                    nif: form.nif,
                    phone: phoneToVerify,
                    password: form.password,
                    province: form.province,
                    city: form.city,
                    description: form.description,
                    categoryId: form.categoryId,
                    serviceTypes: form.serviceTypes,
                    hours: form.hours,
                    documents
                  })
                  setLoading(false)
                  if (result.success) {
                    toast.success('Conta de Empresa criada e aguarda aprovação!')
                    navigate('/empresa', { replace: true })
                  } else {
                    setError(result.error)
                    setShowOtp(false)
                  }
                }}
              />
            </div>
          ) : (
            <form key="stage-form" onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('company.companyName')}</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
            </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">E-mail / Telefone</label>
                <input name="email" type="text" placeholder="Digite seu e-mail ou telefone" value={form.email} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">NIF</label>
                <input name="nif" type="text" placeholder="Digite o NIF" value={form.nif} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Palavra-passe</label>
                <input name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">Confirmar palavra-passe</label>
                <input name="confirmPassword" type="password" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('company.companyDescription')}</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none resize-none focus:ring-2 focus:ring-mimu-gold focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('company.serviceCategory')}</label>
                <select name="categoryId" value={form.categoryId} onChange={handleChange} required
                  className="w-full px-4 py-3 rounded-xl border-2 border-mimu-cream-border dark:border-[#2A2A2A] focus:border-mimu-gold focus:outline-none bg-mimu-white dark:bg-[#1E1E1E] disabled:opacity-50"
                  disabled={catsLoading}
                >
                  <option value="">{catsLoading ? 'A carregar categorias...' : t('company.chooseOption')}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.icon && c.icon.length <= 3 ? c.icon + ' ' : ''}{c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <AngolaLocationSelect
                  province={form.province}
                  city={form.city}
                  onProvinceChange={v => { setForm(f => ({ ...f, province: v, city: '' })); setLocationError('') }}
                  onCityChange={v => { setForm(f => ({ ...f, city: v })); setLocationError('') }}
                  error={locationError}
                />
              </div>
              {category && (
                <div>
                  <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('company.servicesOffered')}</label>
                  <div className="flex flex-wrap gap-2">
                    {category.services.map(s => (
                      <label key={s} className="flex items-center gap-2 px-3 py-2 bg-mimu-cream dark:bg-[#121212] rounded-xl cursor-pointer">
                        <input type="checkbox" checked={form.serviceTypes.includes(s)} onChange={() => selectService(s)} />
                        <span className="text-sm">{s}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {form.categoryId && (
                <div className="border-2 border-mimu-cream-border dark:border-[#2A2A2A] rounded-xl p-4 bg-mimu-cream dark:bg-[#121212]/30">
                  <h3 className="font-bold text-mimu-wine-text dark:text-white mb-3">{t('company.requiredDocuments')}</h3>
                  {requiredDocs.required.map(docType => {
                    const config = getDocumentConfig(docType, form.categoryId, form.serviceTypes, 'company')
                    return (
                      <DocumentUploadBox
                        key={docType}
                        docType={docType}
                        label={config.label}
                        description={config.description}
                        buttonText={config.buttonText}
                        isPhoto={config.isPhoto}
                        isMultiple={config.isMultiple}
                        documents={documents[docType]}
                        onChange={(e) => handleDocumentChange(docType, e)}
                        onRemove={(index) => removeDocument(docType, index)}
                        error={documentErrors[docType]}
                      />
                    )
                  })}
                  {requiredDocs.optional.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-mimu-gold/50">
                      <h4 className="text-sm font-medium text-mimu-wine-text dark:text-white mb-3">{t('company.optionalDocuments')}</h4>
                      {requiredDocs.optional.map(docType => {
                        const config = getDocumentConfig(docType, form.categoryId, form.serviceTypes, 'company')
                        return (
                          <DocumentUploadBox
                            key={`opt-${docType}`}
                            docType={docType}
                            label={config.label}
                            description={config.description}
                            buttonText={config.buttonText}
                            isPhoto={config.isPhoto}
                            isMultiple={config.isMultiple}
                            documents={documents[docType]}
                            onChange={(e) => handleDocumentChange(docType, e)}
                            onRemove={(index) => removeDocument(docType, index)}
                            error={documentErrors[docType]}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-mimu-wine-text dark:text-white mb-2">{t('company.workingHours')}</label>
                <WeeklyScheduler 
                  value={form.hours} 
                  onChange={val => setForm(f => ({ ...f, hours: val }))} 
                />
              </div>

              <p className="text-xs text-mimu-wine-light-text dark:text-gray-300/80 mt-4 mb-4">
                Ao criar a sua conta, está a consentir com os nossos{' '}
                <Link to="/termos-de-uso" className="text-mimu-gold hover:underline font-semibold" target="_blank">Termos de Uso</Link> e{' '}
                <Link to="/politica-privacidade" className="text-mimu-gold hover:underline font-semibold" target="_blank">Política de Privacidade</Link>.
              </p>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-mimu-gold hover:bg-mimu-gold-hover text-mimu-wine-text dark:text-white font-bold rounded-xl transition-colors disabled:opacity-50 transition-all duration-300 hover:shadow-md active:scale-95">
              {loading ? 'A criar conta...' : 'Criar Conta de Empresa'}
            </button>
            </form>
          )}
          
        </div>
      </main>
      <Footer />
    </div>
  )
}
