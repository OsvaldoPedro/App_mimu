export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (typeof file === 'string') {
      return resolve(file) // Já é base64 ou URL
    }
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}

export const filesToBase64 = async (files) => {
  if (!files || files.length === 0) return []
  const promises = Array.from(files).map(file => fileToBase64(file))
  return Promise.all(promises)
}
