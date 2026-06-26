/**
 * Remove todos os números e símbolos não permitidos em nomes (Pessoas/Textos).
 * Permite letras base, acentos portugueses, espaços, hífens e apóstrofos.
 */
export const enforceAlphaText = (value) => {
  if (!value) return '';
  return value.replace(/[^A-Za-záàâãéèêíïóôõöúçñÀÁÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s\-']/g, '');
};

/**
 * Remove símbolos não permitidos mas permite Letras e Números (ex: Nomes de Empresas).
 */
export const enforceAlphanumericText = (value) => {
  if (!value) return '';
  return value.replace(/[^A-Za-z0-9áàâãéèêíïóôõöúçñÀÁÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s\-&.,']/g, '');
};

/**
 * Remove qualquer caractere que não seja um número.
 */
export const enforceNumeric = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '');
};

/**
 * Verifica se a string resultante tem exatamente 9 dígitos (Tamanho padrão de Telefone em Angola).
 */
export const isExact9Digits = (value) => {
  const digits = enforceNumeric(value);
  return digits.length === 9;
};

/**
 * Validação genérica para campos de texto com limite mínimo.
 */
export const isValidTextLength = (value, minLength = 2) => {
  return value && value.trim().length >= minLength;
};

/**
 * Validates strictly if a given string matches standard Email formats.
 */
export const isValidEmail = (email) => {
  if (!email) return false;
  const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return regex.test(email.trim());
};

/**
 * Remove qualquer caractere que não seja um número e limita a 10 caracteres para o NIF.
 */
export const enforceNIF = (value) => {
  if (!value) return '';
  return value.replace(/\D/g, '').substring(0, 10);
};

/**
 * Verifica se a string resultante tem exatamente 10 dígitos (Tamanho padrão de NIF).
 */
export const isValidNIF = (value) => {
  const digits = enforceNumeric(value);
  return digits.length === 10;
};
