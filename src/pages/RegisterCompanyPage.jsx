import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { categories } from '../data/categories'
import AngolaLocationSelect from '../components/AngolaLocationSelect' // new reuseable selector

const getRequiredDocuments = (categoryId, serviceTypes) => {
  const docs = {
    estadia: { required: ['identidad', 'logo', 'establishment'] },
    comer: { required: ['identidad', 'logo', 'establishment'] },
    festas: { required: ['identidad', 'photoOrLogo'] },
    transporte: {
      required: ['identidad', 'photoOrLogo'],
      conditional: { 'Táxi': ['drivinglicense'], 'Moto-táxi': ['drivinglicense'] }
    },
    beleza: {
      required: ['identidad', 'photoOrLogo'],
      conditional: {
        'Massagem': ['establishment', 'certificates'],
        'Spa': ['establishment', 'certificates'],
        'Clínicas': ['establishment', 'certificates'],
        'Postos médicos': ['establishment', 'certificates']
      }
    },
    casa: { required: ['identidad', 'photo', 'certificates'] },
    automovel: { required: ['identidad', 'photo'], optional: ['certificate', 'drivinglicense'] },
    entregas: { required: ['identidad', 'photo'], optional: ['certificate', 'drivinglicense'] },
    profissionais: { required: ['identidad', 'photo', 'certificates'], optional: ['drivinglicense'] },
    formacao: { required: ['identidad', 'photoOrLogo', 'certificates', 'location'] }
  }
  
  const categoryDocs = docs[categoryId] || { required: ['identidad', 'photo'] }
  const extraRequired = []
  if (categoryDocs.conditional) {
    for (const service of serviceTypes) {
      if (categoryDocs.conditional[service]) {
        extraRequired.push(...categoryDocs.conditional[service])
      }
    }
  }
  
  return {
    required: [...new Set([...categoryDocs.required, ...extraRequired])],
    optional: categoryDocs.optional || []
  }
}

const DOCUMENT_LABELS = {
  identidad: 'Bilhete de Identidade',
  logo: 'Fotografia do Logotipo',
  establishment: 'Documento do Estabelecimento',
  photoOrLogo: 'Fotografia da pessoa OU Logotipo',
  photo: 'Fotografia da pessoa',
  certificates: 'Certificados (múltiplos)',
  drivinglicense: 'Carta de Condução',
  certificate: 'Certificado',
  location: 'Localização (Província/Cidade)'
}

export default function RegisterCompanyPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    companyName: '', email: '', phone: '', address: '', province: '', city: '', description: '',
    categoryId: '', serviceTypes: [], hours: '', password: ''
  })
  const [documents, setDocuments] = useState({})
  const [documentErrors, setDocumentErrors] = useState({})
  const [error, setError] = useState('')
  const { registerCompany } = useAuth()
  const navigate = useNavigate()
  const [locationError, setLocationError] = useState('')/**/

  const category = categories.find(c => c.id === form.categoryId)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'categoryId') setForm(f => ({ ...f, serviceTypes: [] }))
  }

  // single-selection: keep only one service in the array
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
      setDocuments(prev => ({...prev, [docType]: [...(prev[docType] || []), ...files]}))
    } else {
      setDocuments(prev => ({...prev, [docType]: files[0]}))
    }
    setDocumentErrors(prev => {const next = {...prev}; delete next[docType]; return next})
  }

     /*
  const removeDocument = (docType, i = null) => {
    if (i !== null) {
      setDocuments(prev => ({...prev, [docType]: prev[docType].filter((_, idx) => idx !== i)}))
    } else {
      setDocuments(prev => {const next = {...prev}; delete next[docType]; return next})
    }
  } */
  const removeDocument = (docType, i = null) => {
  setDocuments(prev => {
    const current = prev[docType]

    // Se for array (ex: certificates)
    if (Array.isArray(current)) {
      return {
        ...prev,
        [docType]: current.filter((_, idx) => idx !== i)
      }
    }

    // Se for ficheiro único
    const next = { ...prev }
    delete next[docType]
    return next
  })
}
    

  /*  */

  const requiredDocs = getRequiredDocuments(form.categoryId, form.serviceTypes)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setDocumentErrors({})
    
    if (form.password.length < 6) {
      setError(t('company.passwordTooShort'))
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
        missingDocs.push(DOCUMENT_LABELS[docType])
        setDocumentErrors(prev => ({...prev, [docType]: `${DOCUMENT_LABELS[docType]} é obrigatório`}))
      }
    }

    if (missingDocs.length > 0) {
      setError(t('company.missingRequiredDocs') + missingDocs.join(', '))
      return
    }

    const result = registerCompany({
      companyName: form.companyName,
      email: form.email,
      phone: form.phone,
      address: form.address,
      province: form.province,
      city: form.city,
      description: form.description,
      categoryId: form.categoryId,
      serviceTypes: form.serviceTypes,
      hours: form.hours,
      password: form.password,
      documents
    })
    if (result.success) navigate('/empresa')
    else setError(result.error)
  }

  return (
    <div className="min-h-screen bg-[#F4E8D8]">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Link to="/registar" className="text-[#C58A2B] text-sm font-medium mb-4 inline-block">← {t('form.back')}</Link>
          <h1 className="text-2xl font-bold text-[#3A0D0D] mb-2">{t('company.companyAccount')}</h1>
          <p className="text-[#5C1A1A]/80 mb-2">{t('company.pendingApproval')}</p>
          <p className="text-amber-700 text-sm mb-6">{t('company.afterRegister')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.companyName')}</label>
              <input name="companyName" value={form.companyName} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.professionalEmail')}</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.phone')}</label>
              <input name="phone" value={form.phone} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.address')}</label>
              <input name="address" value={form.address} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.companyDescription')}</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none resize-none" />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.serviceCategory')}</label>
              <select name="categoryId" value={form.categoryId} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none">
                <option value="">{t('company.chooseOption')}</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
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
                <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.servicesOffered')}</label>
                <div className="flex flex-wrap gap-2">
                  {category.services.map(s => (
                    <label key={s} className="flex items-center gap-2 px-3 py-2 bg-[#F4E8D8] rounded-xl cursor-pointer">
                      <input type="checkbox" checked={form.serviceTypes.includes(s)} onChange={() => selectService(s)} />
                      <span className="text-sm">{s}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {form.categoryId && (
              <div className="border-2 border-[#F4E8D8] rounded-xl p-4 bg-[#F4E8D8]/30">
                <h3 className="font-bold text-[#3A0D0D] mb-3">{t('company.requiredDocuments')}</h3>
                {requiredDocs.required.map(docType => (
                  <div key={docType} className="mb-4">
                    <label className="block text-sm font-medium text-[#3A0D0D] mb-2">
                      {DOCUMENT_LABELS[docType]} *
                      {documentErrors[docType] && <span className="text-red-600 ml-2 text-xs">{documentErrors[docType]}</span>}
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(docType === 'certificates' ? documents[docType] || [] : (documents[docType] ? [documents[docType]] : [])).map((f, i) => (
                        <div key={i} className="relative group">
                          <div className="px-3 py-1 bg-[#C58A2B]/20 border border-[#C58A2B] rounded-lg text-xs text-[#C58A2B] max-w-xs truncate">
                            {f.name}
                          </div>
                          <button type="button" onClick={() => removeDocument(docType, i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs font-bold">×</button>
                        </div>
                      ))}
                    </div>
                    <label className="inline-flex items-center px-4 py-2 bg-[#C58A2B]/10 border-2 border-dashed border-[#C58A2B] rounded-xl cursor-pointer hover:bg-[#C58A2B]/20 text-[#C58A2B] text-sm font-medium">
                      + {t(docType === 'certificates' ? 'company.attachFiles' : 'company.attachFile')}
                      <input type="file" multiple={docType === 'certificates'} accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleDocumentChange(docType, e)} className="hidden" />
                    </label>
                  </div>
                ))}
                {requiredDocs.optional.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#C58A2B]/50">
                    <h4 className="text-sm font-medium text-[#3A0D0D] mb-3">{t('company.optionalDocuments')}</h4>
                    {requiredDocs.optional.map(docType => (
                      <div key={docType} className="mb-3">
                        <label className="block text-sm font-medium text-[#5C1A1A] mb-2">{DOCUMENT_LABELS[docType]}</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {(docType === 'certificates' ? documents[docType] || [] : (documents[docType] ? [documents[docType]] : [])).map((f, i) => (
                            <div key={i} className="relative group">
                              <div className="px-2 py-1 bg-gray-200 border border-gray-400 rounded text-xs text-gray-700 max-w-xs truncate">
                                {f.name}
                              </div>
                              <button type="button" onClick={() => removeDocument(docType, i)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs font-bold">×</button>
                            </div>
                          ))}
                        </div>
                        <label className="inline-flex items-center px-3 py-1.5 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 text-gray-700 text-xs font-medium">
                          + {t('company.attachFile')}
                          <input type="file" multiple={docType === 'certificates'} accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleDocumentChange(docType, e)} className="hidden" />
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.workingHours')}</label>
              <input name="hours" value={form.hours} onChange={handleChange} placeholder="Ex: 9h-18h"
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3A0D0D] mb-2">{t('company.password')}</label>
              <input name="password" type="password" value={form.password} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border-2 border-[#F4E8D8] focus:border-[#C58A2B] focus:outline-none" />
            </div>
            <button type="submit"
              className="w-full py-4 bg-[#C58A2B] hover:bg-[#E0B15C] text-[#3A0D0D] font-bold rounded-xl transition-colors">
              {t('company.createCompanyAccount')}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
