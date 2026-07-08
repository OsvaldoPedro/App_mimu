import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  getWallet,
  getWalletHistory,
  depositToWallet,
  withdrawFromWallet,
  transferFromWallet
} from '../hooks/useWallet'

// ─── Icon components ──────────────────────────────────────────────────────────
const Icon = ({ path, size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
)

const icons = {
  wallet: 'M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
  deposit: 'M12 5v14M5 12l7 7 7-7',
  withdraw: 'M12 19V5M5 12l7-7 7 7',
  transfer: 'M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4',
  history: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
  back: 'M19 12H5M12 19l-7-7 7-7',
  close: 'M18 6 6 18M6 6l12 12',
  copy: 'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2M8 4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2H8zM8 4v2h8V4',
  check: 'M20 6 9 17l-5-5',
  info: 'M12 16v-4m0-4h.01M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  eyeOff: 'M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22',
}

// ─── Type labels ──────────────────────────────────────────────────────────────
const typeConfig = {
  deposit: { label: t('wallet.typeDeposit'), color: '#10B981', bg: '#064E3B', sign: '+', icon: icons.deposit },
  withdrawal: { label: t('wallet.typeWithdrawal'), color: '#F59E0B', bg: '#451A03', sign: '-', icon: icons.withdraw },
  payment: { label: t('wallet.typePayment'), color: '#EF4444', bg: '#450A0A', sign: '-', icon: icons.withdraw },
  transfer_in: { label: t('wallet.typeTransferIn'), color: '#10B981', bg: '#064E3B', sign: '+', icon: icons.transfer },
  transfer_out: { label: t('wallet.typeTransferOut'), color: '#8B5CF6', bg: '#2E1065', sign: '-', icon: icons.transfer },
  refund: { label: t('wallet.typeRefund'), color: '#06B6D4', bg: '#0C4A6E', sign: '+', icon: icons.deposit },
}

const statusConfig = {
  completed: { label: t('wallet.statusCompleted'), color: '#10B981' },
  pending: { label: t('wallet.statusPending'), color: '#F59E0B' },
  failed: { label: t('wallet.statusFailed'), color: '#EF4444' },
  cancelled: { label: t('wallet.statusCancelled'), color: '#6B7280' },
}

// ─── Modal genérico ───────────────────────────────────────────────────────────
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a0a0a, #1c1c1e)', border: '1px solid rgba(212,175,55,0.15)', boxShadow: '0 25px 60px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
            <Icon path={icons.close} size={16} />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '12px',
  padding: '12px 16px',
  color: 'white',
  fontSize: '15px',
  outline: 'none',
  marginBottom: '12px',
  boxSizing: 'border-box',
}

const btnPrimary = {
  width: '100%',
  padding: '14px',
  borderRadius: '14px',
  border: 'none',
  background: 'linear-gradient(135deg, #D4AF37, #F5C842)',
  color: '#1a0a0a',
  fontSize: '15px',
  fontWeight: '700',
  cursor: 'pointer',
  marginTop: '8px',
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────
function DepositModal({ onClose, onSuccess }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('reference')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async () => {
    const val = parseFloat(amount)
    if (!val || val < 100) return toast.error(t('wallet.minAmount'))
    setLoading(true)
    const res = await depositToWallet(val, method)
    setLoading(false)
    if (!res.success) return toast.error(res.error)
    setResult(res.data)
  }

  if (result) {
    return (
      <Modal title={t('wallet.paymentStarted')} onClose={() => { onClose(); onSuccess?.() }}>
        <div className="text-center py-4">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-white font-bold text-xl mb-1">{parseFloat(result.amount).toFixed(2)} AOA</p>
          <p className="text-white/60 text-sm mb-6">
            method === 'multicaixa_express' ? t('wallet.multicaixaInstructions') : t('wallet.referenceInstructions')
          </p>

          {result.reference && (
            <div style={{ background: 'rgba(212,175,55,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '16px', border: '1px solid rgba(212,175,55,0.3)' }}>
              <p className="text-white/60 text-xs mb-1">{t('wallet.reference')}</p>
              <p className="text-yellow-400 font-mono font-bold text-lg">{result.reference}</p>
            </div>
          )}

          <p className="text-white/50 text-xs">{t('wallet.creditedAuto')}</p>

          <button onClick={() => { onClose(); onSuccess?.() }} style={{ ...btnPrimary, marginTop: '20px' }}>
            {t('wallet.close')}
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t('wallet.depositTitle')} onClose={onClose}>
      <p className="text-white/60 text-sm mb-4">{t('wallet.depositDesc')}</p>

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.paymentMethod')}</label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { id: 'reference', label: t('wallet.reference'), emoji: '🏦' },
          { id: 'multicaixa_express', label: 'Multicaixa Express', emoji: '📱' }
        ].map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            style={{ padding: '14px 8px', borderRadius: '12px', border: `2px solid ${method === m.id ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: method === m.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}>
            <div className="text-2xl mb-1">{m.emoji}</div>
            <div style={{ color: method === m.id ? '#D4AF37' : 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600' }}>{m.label}</div>
          </button>
        ))}
      </div>

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.amount')}</label>
      <input style={inputStyle} type="number" placeholder="Ex: 5000" value={amount} onChange={e => setAmount(e.target.value)} min="100" />

      <div className="flex flex-wrap gap-2 mb-4">
        {[1000, 2500, 5000, 10000].map(v => (
          <button key={v} onClick={() => setAmount(String(v))}
            style={{ padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', fontSize: '13px', cursor: 'pointer' }}>
            {v.toLocaleString()} AOA
          </button>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading} style={btnPrimary}>
        {loading ? t('wallet.processing') : t('wallet.continuePayment')}
      </button>
    </Modal>
  )
}

// ─── Withdraw Modal ───────────────────────────────────────────────────────────
function WithdrawModal({ balance, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [phone, setPhone] = useState('')
  const [iban, setIban] = useState('')
  const [method, setMethod] = useState('phone')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const val = parseFloat(amount)
    if (!val || val < 500) return toast.error(t('wallet.minWithdraw'))
    if (val > balance) return toast.error(t('wallet.insufficientBalance'))
    if (method === 'phone' && !phone) return toast.error(t('wallet.phone'))
    if (method === 'iban' && !iban) return toast.error(t('wallet.iban'))

    setLoading(true)
    const res = await withdrawFromWallet(val, {
      phone: method === 'phone' ? phone : undefined,
      iban: method === 'iban' ? iban : undefined,
    })
    setLoading(false)
    if (!res.success) return toast.error(res.error)
    toast.success(t('wallet.withdrawBtn'))
    onSuccess?.()
    onClose()
  }

  return (
    <Modal title={t('wallet.withdrawTitle')} onClose={onClose}>
      <p className="text-white/60 text-sm mb-4">{t('wallet.availableBalance')}: <span className="text-yellow-400 font-bold">{parseFloat(balance).toFixed(2)} AOA</span></p>

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.paymentMethod')}</label>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[{ id: 'phone', label: t('wallet.typeMulticaixa'), emoji: '📱' }, { id: 'iban', label: t('wallet.typeTransfer'), emoji: '🏦' }].map(m => (
          <button key={m.id} onClick={() => setMethod(m.id)}
            style={{ padding: '14px 8px', borderRadius: '12px', border: `2px solid ${method === m.id ? '#D4AF37' : 'rgba(255,255,255,0.1)'}`, background: method === m.id ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', cursor: 'pointer' }}>
            <div className="text-2xl mb-1">{m.emoji}</div>
            <div style={{ color: method === m.id ? '#D4AF37' : 'rgba(255,255,255,0.7)', fontSize: '12px', fontWeight: '600' }}>{m.label}</div>
          </button>
        ))}
      </div>

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.amount')}</label>
      <input style={inputStyle} type="number" placeholder={t('wallet.minWithdraw')} value={amount} onChange={e => setAmount(e.target.value)} />

      {method === 'phone' ? (
        <>
          <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.phone')}</label>
          <input style={inputStyle} type="tel" placeholder="9XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
        </>
      ) : (
        <>
          <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.iban')}</label>
          <input style={inputStyle} type="text" placeholder="AO06.0040.0000.0000.0000.0000" value={iban} onChange={e => setIban(e.target.value)} />
        </>
      )}

      <div style={{ background: 'rgba(245,158,11,0.1)', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', border: '1px solid rgba(245,158,11,0.2)' }}>
        <p className="text-yellow-400 text-xs">{t('wallet.processTime')}</p>
      </div>

      <button onClick={handleSubmit} disabled={loading} style={btnPrimary}>
        {loading ? t('wallet.processing') : t('wallet.withdrawBtn')}
      </button>
    </Modal>
  )
}

// ─── Transfer Modal ───────────────────────────────────────────────────────────
function TransferModal({ balance, onClose, onSuccess }) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState('')
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    const val = parseFloat(amount)
    if (!val || val < 100) return toast.error(t('wallet.minAmount'))
    if (val > balance) return toast.error(t('wallet.insufficientBalance'))
    if (!email || !email.includes('@')) return toast.error(t('register.invalidEmailPhone'))

    setLoading(true)
    const res = await transferFromWallet(val, email, note)
    setLoading(false)
    if (!res.success) return toast.error(res.error)
    toast.success(t('wallet.typeTransferOut') + ': ' + val.toFixed(2) + ' AOA')
    onSuccess?.()
    onClose()
  }

  return (
    <Modal title={t('wallet.transferTitle')} onClose={onClose}>
      <p className="text-white/60 text-sm mb-4">{t('wallet.availableBalance')}: <span className="text-yellow-400 font-bold">{parseFloat(balance).toFixed(2)} AOA</span></p>

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.recipient')}</label>
      <input style={inputStyle} type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.amount')}</label>
      <input style={inputStyle} type="number" placeholder="Mínimo: 100 AOA" value={amount} onChange={e => setAmount(e.target.value)} />

      <label className="text-white/70 text-xs font-semibold block mb-2 uppercase tracking-wide">{t('wallet.note') || 'Nota (opcional)'}</label>
      <input style={inputStyle} type="text" placeholder="Ex: Pagamento de jantar" value={note} onChange={e => setNote(e.target.value)} />

      <button onClick={handleSubmit} disabled={loading} style={btnPrimary}>
        {loading ? t('wallet.processing') : t('wallet.transferBtn')}
      </button>
    </Modal>
  )
}

// ─── Transaction Row ──────────────────────────────────────────────────────────
function TxRow({ tx }) {
  const { t } = useTranslation()
  const cfg = typeConfig[tx.type] || { label: tx.type, color: '#9CA3AF', bg: '#1f1f1f', sign: '', icon: icons.history }
  const st = statusConfig[tx.status] || { label: tx.status, color: '#9CA3AF' }
  const date = new Date(tx.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon path={cfg.icon} size={18} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cfg.label}</div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', marginTop: '2px' }}>{date}</div>
        {tx.description && (
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</div>
        )}
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: cfg.color, fontSize: '15px', fontWeight: '700' }}>
          {cfg.sign}{parseFloat(tx.amount).toFixed(2)} AOA
        </div>
        <div style={{ fontSize: '10px', color: st.color, marginTop: '2px', fontWeight: '600' }}>{st.label}</div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [wallet, setWallet] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [totalTx, setTotalTx] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hideBalance, setHideBalance] = useState(false)
  const [modal, setModal] = useState(null) // 'deposit' | 'withdraw' | 'transfer'

  const fetchWallet = useCallback(async () => {
    const res = await getWallet()
    if (res.success) setWallet(res.data.wallet)
  }, [])

  const fetchHistory = useCallback(async (pg = 1, type = null, append = false) => {
    if (pg === 1) setLoading(true)
    else setLoadingMore(true)

    const res = await getWalletHistory({ page: pg, limit: 15, type })
    if (res.success) {
      setTransactions(prev => append ? [...prev, ...(res.data.transactions || [])] : (res.data.transactions || []))
      setTotalTx(res.data.total || 0)
    }

    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    if (!user) { navigate('/entrar'); return }
    fetchWallet()
    fetchHistory(1, filter)
  }, [user, navigate, fetchWallet, fetchHistory, filter])

  const handleRefresh = () => {
    setPage(1)
    fetchWallet()
    fetchHistory(1, filter)
  }

  const handleLoadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchHistory(nextPage, filter, true)
  }

  const handleFilterChange = (type) => {
    setFilter(type)
    setPage(1)
    setTransactions([])
  }

  const balance = wallet?.balance != null ? parseFloat(wallet.balance) : null

  const filterOptions = [
    { key: null, label: t('admin.filter') + ' ' + t('admin.all') },
    { key: 'deposit', label: t('wallet.typeDeposit') + 's' },
    { key: 'withdrawal', label: t('wallet.typeWithdrawal') + 's' },
    { key: 'payment', label: t('wallet.typePayment') + 's' },
    { key: 'transfer_in', label: t('wallet.typeTransferIn') + 's' },
    { key: 'transfer_out', label: t('wallet.typeTransferOut') + 's' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0d0d 0%, #1a0505 50%, #0d0d0d 100%)', paddingBottom: '100px' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate(-1)}
          style={{ width: '40px', height: '40px', borderRadius: '12px', border: 'none', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon path={icons.back} size={18} color="white" />
        </button>
        <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700', margin: 0 }}>{t('wallet.title')}</h1>
      </div>

      {/* Balance Card */}
      <div style={{ margin: '20px 20px 0', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
        <div style={{ background: 'linear-gradient(135deg, #7B1D1D 0%, #450A0A 40%, #1a0505 100%)', padding: '28px 24px', position: 'relative' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(212,175,55,0.12)' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(212,175,55,0.08)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', position: 'relative' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '500', margin: '0 0 6px' }}>{t('wallet.availableBalance')}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <p style={{ color: 'white', fontSize: '36px', fontWeight: '800', margin: 0, letterSpacing: '-1px' }}>
                  {balance === null ? '—' : hideBalance ? '••••• AOA' : `${balance.toFixed(2)} AOA`}
                </p>
              </div>
            </div>
            <button onClick={() => setHideBalance(h => !h)}
              style={{ width: '36px', height: '36px', borderRadius: '10px', border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon path={hideBalance ? icons.eyeOff : icons.eye} size={16} color="rgba(255,255,255,0.7)" />
            </button>
          </div>

          {/* Currency tag */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '4px 12px' }}>
            <span style={{ color: '#D4AF37', fontSize: '12px', fontWeight: '600' }}>🇦🇴 Kwanza (AOA)</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', margin: '16px 20px 0' }}>
        {[
          { id: 'deposit', label: t('wallet.deposit'), emoji: '⬇️', color: '#10B981' },
          { id: 'withdraw', label: t('wallet.withdraw'), emoji: '⬆️', color: '#F59E0B' },
          { id: 'transfer', label: t('wallet.transfer'), emoji: '↔️', color: '#8B5CF6' },
        ].map(btn => (
          <button key={btn.id} onClick={() => setModal(btn.id)}
            style={{ padding: '16px 8px', borderRadius: '16px', border: `1px solid rgba(255,255,255,0.08)`, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.transform = 'translateY(0)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>{btn.emoji}</div>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: '600' }}>{btn.label}</div>
          </button>
        ))}
      </div>

      {/* History Section */}
      <div style={{ margin: '24px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ color: 'white', fontSize: '17px', fontWeight: '700', margin: 0 }}>{t('wallet.history')}</h2>
          <button onClick={handleRefresh} style={{ color: '#D4AF37', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>{t('wallet.refresh')}</button>
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
          {filterOptions.map(f => (
            <button key={String(f.key)} onClick={() => handleFilterChange(f.key)}
              style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${filter === f.key ? '#D4AF37' : 'rgba(255,255,255,0.12)'}`, background: filter === f.key ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)', color: filter === f.key ? '#D4AF37' : 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', padding: '0 16px', minHeight: '120px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
              <p style={{ fontSize: '14px', margin: 0 }}>{t('admin.users.loading')}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>📭</div>
              <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>{t('wallet.noTransactions')}</p>
              <p style={{ fontSize: '12px', margin: '4px 0 0', opacity: 0.6 }}>{t('wallet.noTransactionsDesc')}</p>
            </div>
          ) : (
            <>
              {transactions.map(tx => <TxRow key={tx.id} tx={tx} />)}
              {transactions.length < totalTx && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <button onClick={handleLoadMore} disabled={loadingMore}
                    style={{ padding: '10px 24px', borderRadius: '20px', border: '1px solid rgba(212,175,55,0.3)', background: 'rgba(212,175,55,0.08)', color: '#D4AF37', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                    loadingMore ? t('admin.users.loading') : t('wallet.viewMore') + ' (' + (totalTx - transactions.length) + ')'
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info box */}
      <div style={{ margin: '16px 20px 0', background: 'rgba(212,175,55,0.06)', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.15)', padding: '14px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
        <Icon path={icons.info} size={18} color="#D4AF37" />
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: 0, lineHeight: '1.6' }}>
          {t('wallet.noteText')}
        </p>
      </div>

      {/* Modals */}
      {modal === 'deposit' && (
        <DepositModal onClose={() => setModal(null)} onSuccess={handleRefresh} />
      )}
      {modal === 'withdraw' && (
        <WithdrawModal balance={balance || 0} onClose={() => setModal(null)} onSuccess={handleRefresh} />
      )}
      {modal === 'transfer' && (
        <TransferModal balance={balance || 0} onClose={() => setModal(null)} onSuccess={handleRefresh} />
      )}
    </div>
  )
}
