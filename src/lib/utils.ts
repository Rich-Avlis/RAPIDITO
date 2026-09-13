/**
 * Remueve acentos y caracteres especiales de un string
 * Ejemplo: "María José" -> "Maria Jose"
 */
export function removeAccents(str: string): string {
  if (!str) return str
  
  return str
    .normalize('NFD')                    // Separa caracteres de sus acentos
    .replace(/[\u0300-\u036f]/g, '')     // Elimina los acentos
    .replace(/[^a-zA-Z0-9\s]/g, '')     // Elimina caracteres especiales
    .trim()
}

/**
 * Limpia un nombre completo removiendo acentos
 */
export function cleanName(name: string): string {
  return removeAccents(name).toLowerCase()
}

/**
 * Limpia un email removiendo acentos
 */
export function cleanEmail(email: string): string {
  return email
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove accents only
    .toLowerCase()
    .trim()
}

/**
 * Limpia una placa de vehículo
 */
export function cleanPlate(plate: string): string {
  return plate
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .trim()
}
