import Link from 'next/link'
import { t } from '../lib/i18n'
export default function Home(){
  return (
    <div>
      <section className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold">{t('hero_title')}</h1>
          <p className="mt-4 text-lg text-gray-700">Viventa RD — plataforma MLS‑grade para la República Dominicana.</p>
          <div className="mt-6">
            <Link href="/search" className="px-4 py-2 bg-[#00A6A6] text-white rounded">{t('search_button')}</Link>
          </div>
        </div>
        <div>
          <img src="/hero.png" alt="Viventa RD hero" className="rounded shadow"/>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold">{t('featured')}</h2>
        <div id="listings" className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-white rounded shadow">
            <div className="h-40 bg-gray-100 rounded mb-3"/>
            <div className="font-semibold">Casa en Punta Cana</div>
            <div className="text-sm text-gray-600">USD 240,000 • 3 hab • 2 baños</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="h-40 bg-gray-100 rounded mb-3"/>
            <div className="font-semibold">Condo en Samaná</div>
            <div className="text-sm text-gray-600">USD 380,000 • 2 hab • 2 baños</div>
          </div>
        </div>
      </section>
    </div>
  )
}
