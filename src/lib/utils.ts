import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function cleanEmail(email: string): string {
  return removeAccents(email).toLowerCase().replace(/[^a-z0-9@._-]/g, '')
}

export function cleanPlate(plate: string): string {
  return removeAccents(plate).toUpperCase().replace(/[^A-Z0-9-]/g, '')
}
