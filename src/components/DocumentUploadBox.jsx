import React from 'react';

export default function DocumentUploadBox({
  label,
  description,
  buttonText,
  isPhoto,
  isMultiple,
  documents, // pode ser Array (para multiple) ou File único
  onChange,
  onRemove,
  error
}) {
  const docsArray = isMultiple ? (documents || []) : (documents ? [documents] : []);
  const hasDocs = docsArray.length > 0;
  const defaultButtonText = buttonText || (isPhoto ? 'Adicionar imagem' : (isMultiple ? 'Adicionar certificados' : 'Carregar documento'));

  return (
    <div className="mb-6">
      <div className="flex flex-col mb-2">
        <label className="text-base font-bold text-mimu-wine-text dark:text-white">
          {label} *
        </label>
        {description && (
          <p className="text-sm text-mimu-wine-light-text dark:text-gray-300/70 mt-1 leading-snug">
            {description}
          </p>
        )}
      </div>

      <div className={`relative flex flex-col p-4 md:p-6 border-2 border-dashed rounded-2xl transition-colors ${
        error ? 'border-red-400 bg-red-50' : 'border-mimu-gold/60 bg-mimu-white dark:bg-[#1E1E1E] hover:bg-mimu-cream dark:bg-[#121212]/50'
      }`}>
        
        {hasDocs ? (
          <div className="flex flex-col items-center justify-center w-full">
            {isPhoto ? (
              <div className="relative w-full max-w-xs">
                <img 
                  src={URL.createObjectURL(docsArray[0])} 
                  alt="Preview" 
                  className="w-full h-40 md:h-48 object-cover rounded-xl shadow-sm border border-mimu-cream-border dark:border-[#2A2A2A]" 
                />
                <button 
                  type="button" 
                  onClick={() => onRemove()} 
                  className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-mimu-white-text shadow-md font-bold transition-transform hover:scale-110 active:scale-95"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="w-full">
                <div className="flex flex-col gap-3 mb-4">
                  {docsArray.map((f, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-mimu-cream dark:bg-[#121212]/30 border border-mimu-cream-border dark:border-[#2A2A2A] rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <svg className="w-6 h-6 text-mimu-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-mimu-wine-text dark:text-white font-medium truncate">{f.name}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => onRemove(isMultiple ? i : null)} 
                        className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
                {isMultiple && (
                  <label className="inline-flex items-center justify-center w-full px-4 py-3 bg-mimu-gold/10 border-2 border-dashed border-mimu-gold/60 rounded-xl cursor-pointer hover:bg-mimu-gold/20 text-mimu-gold font-bold transition-colors">
                    + Adicionar mais certificados
                    <input 
                      type="file" 
                      multiple 
                      accept=".pdf,.jpg,.jpeg,.png" 
                      onChange={onChange} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-full min-h-[120px] cursor-pointer text-mimu-gold/80 hover:text-mimu-gold group">
            {isPhoto ? (
              <svg className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            <span className="text-base font-bold">
              {defaultButtonText}
            </span>
            <span className="text-xs text-mimu-wine-light-text dark:text-gray-300/60 mt-2 font-medium">
              {isPhoto ? 'JPG, PNG, WEBP permitidos' : 'PDF, JPG ou PNG permitidos'}
            </span>
            <input 
              type="file" 
              multiple={isMultiple} 
              accept={isPhoto ? "image/jpeg, image/png, image/webp" : ".pdf,.jpg,.jpeg,.png"} 
              onChange={onChange} 
              className="hidden" 
            />
          </label>
        )}

      </div>
      {error && <p className="text-red-500 mt-2 text-sm font-medium">{error}</p>}
    </div>
  );
}
