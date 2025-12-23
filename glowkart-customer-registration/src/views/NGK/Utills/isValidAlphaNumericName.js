// ✅ Allow alphabets OR alphanumeric
// ❌ Do NOT allow only numbers
// ❌ Do NOT allow special characters

export const isValidAlphaNumericName = (value) => {
  if (!value) return false

  const trimmed = value.trim()

  // Must contain at least one alphabet
  const hasAlphabet = /[A-Za-z]/.test(trimmed)

  // Allow only letters, numbers, and spaces
  const validChars = /^[A-Za-z0-9 ]+$/.test(trimmed)

  return hasAlphabet && validChars
}
export const isValidAadhaarName = (name) => {
  if (!name) return false
  return /^[A-Za-z. ]+$/.test(name.trim())
}

export const isOnlyAlphabets = (value) => {
  if (!value) return false
  return /^[A-Za-z ]+$/.test(value.trim())
}
export const isOnlyAlphabetsWithSpecialChars = (value) => {
  if (!value) return false

  const trimmed = value.trim()

  // Must contain at least one alphabet
  const hasAlphabet = /[A-Za-z]/.test(trimmed)

  // Allow alphabets, spaces, and special characters (NO numbers)
  const validChars = /^[A-Za-z\s.,\-&/()]+$/.test(trimmed)

  return hasAlphabet && validChars
}

export const isValidAddress = (address) => {
  if (!address) return false

  const trimmed = address.trim()

  // Must contain both numbers & letters
  const hasNumber = /\d/.test(trimmed)
  const hasAlphabet = /[A-Za-z]/.test(trimmed)

  // Allowed characters
  const validChars = /^[A-Za-z0-9\s,./-]+$/.test(trimmed)

  // Split by comma or space
  const parts = trimmed.split(/[,\s]+/)

  // At least 3 meaningful parts (area, city, etc.)
  const meaningfulParts = parts.filter((part) => part.replace(/[^A-Za-z]/g, '').length >= 3)

  return hasNumber && hasAlphabet && validChars && meaningfulParts.length >= 3
}
