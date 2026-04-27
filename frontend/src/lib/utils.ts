import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '-'
  return time.slice(0, 5)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    on_time: 'Vaqtida',
    late:    'Kechikdi',
    active:  'Faol',
    pending: 'Kutilmoqda',
    banned:  'Bloklangan',
    admin:   'Admin',
    user:    'Xodim',
  }
  return map[status] ?? status
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    on_time: 'bg-emerald-100 text-emerald-700',
    late:    'bg-amber-100 text-amber-700',
    active:  'bg-emerald-100 text-emerald-700',
    pending: 'bg-amber-100 text-amber-700',
    banned:  'bg-red-100 text-red-700',
    admin:   'bg-purple-100 text-purple-700',
    user:    'bg-blue-100 text-blue-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-700'
}
