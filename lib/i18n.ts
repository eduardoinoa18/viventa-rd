import es from '../locales/es.json'
import en from '../locales/en.json'

const dicts: Record<string, Record<string, string>> = { es: es as any, en: en as any }

export function t(key: string) {
	if (typeof window === 'undefined') return (dicts['es'][key] ?? key)
	const lang = (localStorage.getItem('viventa_lang') || 'es') as keyof typeof dicts
	const table = dicts[lang] || dicts['es']
	return table[key] ?? key
}
