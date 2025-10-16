import es from '../locales/es.json'
import en from '../locales/en.json'

type Dict = Record<string, string>
const esDict = es as unknown as Dict
const enDict = en as unknown as Dict

export function t(key: string): string {
  if (typeof window === 'undefined') return esDict[key] ?? key
  const lang = localStorage.getItem('viventa_lang') || 'es'
  const dict = lang === 'es' ? esDict : enDict
  return dict[key] ?? key
}
