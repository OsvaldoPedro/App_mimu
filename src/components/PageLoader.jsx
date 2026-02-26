export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl px-6 py-5 flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-[#F4E8D8] border-t-[#C58A2B] rounded-full animate-spin" />
        <p className="text-sm font-medium text-[#3A0D0D]">A carregar...</p>
      </div>
    </div>
  )
}

