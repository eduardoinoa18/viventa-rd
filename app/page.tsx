import Link from 'next/link'
import { t } from '../lib/i18n'
export default function Home(){
  return (
    <div>
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold">{t('search_placeholder')}</h1>
          <p className="mt-4 text-lg text-gray-700">Viventa RD — MLS-grade search for the Dominican Republic.</p>
          <div className="mt-6">
            <Link href="/search" className="px-4 py-2 bg-[#00A6A6] text-white rounded">{t('search_button')}</Link>
          </div>
        </div>
        <div>
          <img src="/hero.png" alt="hero" className="rounded shadow"/>
        </div>
      </section>
    </div>
  )
}
