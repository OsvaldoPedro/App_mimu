import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  const categoryLinks = [
    { id: 'estadia', name: t('category.estadia') },
    { id: 'comer', name: t('category.comer') },
    { id: 'mobilidade', name: t('category.mobilidade') },
    { id: 'beleza', name: t('category.beleza') },
    { id: 'casa', name: t('category.casa') }
  ]

  return (
    <footer id="contacto" className="bg-[#3A0D0D] text-[#FFFFFF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold text-[#FFFFFF] mb-4">{t('brand.name')}</h3>
            <p className="text-[#F4E8D8]/80 text-sm mb-4">
              {t('brand.tagline')}
            </p>
            <p className="text-[#C58A2B] text-sm font-medium">
              {t('footer.identity')} ✨
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-[#C58A2B] mb-4">{t('nav.categories')}</h4>
            <ul className="space-y-2">
              {categoryLinks.map((cat) => (
                <li key={cat.id}>
                  <Link to={`/categoria/${cat.id}`} className="text-[#F4E8D8]/80 hover:text-[#C58A2B] transition-colors text-sm">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#C58A2B] mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li><Link to="/categoria/estadia" className="text-[#F4E8D8]/80 hover:text-[#C58A2B] transition-colors text-sm">{t('footer.explore')}</Link></li>
              <li><a href="/#como-funciona" className="text-[#F4E8D8]/80 hover:text-[#C58A2B] transition-colors text-sm">{t('nav.howItWorks')}</a></li>
              <li><Link to="/categoria/estadia" className="text-[#F4E8D8]/80 hover:text-[#C58A2B] transition-colors text-sm">{t('nav.book')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-[#C58A2B] mb-4">{t('nav.contact')}</h4>
            <p className="text-[#F4E8D8]/80 text-sm">info@mimu.ao</p>
            <p className="text-[#F4E8D8]/80 text-sm mt-2">+244 XXX XXX XXX</p>
          </div>
        </div>

        <div className="border-t border-[#5C1A1A] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[#F4E8D8]/60 text-sm">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[#F4E8D8]/60 hover:text-[#C58A2B] transition-colors text-sm">{t('footer.terms')}</a>
            <a href="#" className="text-[#F4E8D8]/60 hover:text-[#C58A2B] transition-colors text-sm">{t('footer.privacy')}</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
