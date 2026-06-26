export default function SplashScreen({
  statusMessage = 'Carregando a aplicação...',
  errorMessage = '',
  isFadingOut = false
}) {

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center bg-[#6F0E0E] text-[#333] p-4 transition-opacity duration-300 ease-in-out ${isFadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <div className="w-full flex flex-col items-center justify-center gap-4 animate-fade-in-slow" style={{ paddingTop: '6vh' }}>
        <img
          src="/mimu-logo.png"
          alt="Mimu logo"
          className="w-[70vw] max-w-[350px] h-auto object-contain"
          loading="lazy"
        />

        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-[5px] border-[#A24242] border-t-mimu-gold animate-spin my-4"></div>

        <p className="text-base text-white">Carregando a aplicação...</p>

        {statusMessage && statusMessage !== 'Carregando a aplicação...' ? (
          <p className="text-xs text-white/90 text-center">{statusMessage}</p>
        ) : null}
        {errorMessage ? <p className="text-xs text-rose-200 text-center">{errorMessage}</p> : null}
      </div>
    </div>
  )
}

