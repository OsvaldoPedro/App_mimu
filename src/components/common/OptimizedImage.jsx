import { useState } from 'react'

export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  objectFit = 'contain'
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-mimu-gray-200 ${className}`}>
      {/* Fallback de erro da foto */}
      {hasError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-mimu-gray-100 dark:bg-[#121212]/50 text-mimu-wine-light-text dark:text-gray-300/40">
          <svg className="w-8 h-8 md:w-12 md:h-12 opacity-60 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-[10px] uppercase font-bold tracking-wider">Sem Imagem</span>
        </div>
      ) : (
        <>
          {/* Skeleton Pulse */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-mimu-cream dark:bg-[#121212]/60 animate-pulse pointer-events-none" />
          )}
          
          {/* Imagem Real (object-contain evita qualquer corte, loading=lazy é óptimo pra performance) */}
          <img
            src={src}
            alt={alt}
            loading="lazy"
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-full h-full object-${objectFit} transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
          />
        </>
      )}
    </div>
  )
}
