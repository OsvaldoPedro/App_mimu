export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-mimu-white dark:bg-[#1E1E1E] rounded-2xl shadow-xl px-6 py-5 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-mimu-cream-border dark:border-[#2A2A2A] border-t-[#C58A2B] rounded-full animate-spin" />
        <p className="text-sm font-medium text-mimu-wine-text dark:text-white">A carregar...</p>
      </div>
    </div>
  )
}

