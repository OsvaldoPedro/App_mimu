import { useNetwork } from '../context/NetworkContext'
import { useTranslation } from 'react-i18next'

export default function SplashScreen() {
  const { online, checking, error, retry } = useNetwork()
  const { t } = useTranslation()

  const showError = !checking && !online

  return (
    <div className="min-h-screen bg-[#3A0D0D] flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white/95 rounded-3xl shadow-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#C58A2B] flex items-center justify-center text-2xl font-bold text-[#3A0D0D]">
          M
        </div>
        <h1 className="text-xl font-bold text-[#3A0D0D] mb-2">{t('brand.name')}</h1>
        <p className="text-sm text-[#5C1A1A]/80 mb-6">
          {t('splash.preparing')}
        </p>

        {checking && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-[#F4E8D8] border-t-[#C58A2B] rounded-full animate-spin" />
            <p className="text-xs text-[#5C1A1A]/70">
              {t('splash.checking')}
            </p>
          </div>
        )}

        {showError && (
          <div className="space-y-4">
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              {error || t('splash.noConnection')}
            </p>
            <button
              type="button"
              onClick={retry}
              className="w-full py-3 rounded-2xl bg-[#C58A2B] text-[#3A0D0D] font-semibold hover:bg-[#E0B15C] transition-colors"
            >
              {t('splash.retry')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

