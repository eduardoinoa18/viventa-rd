'use client'
import {useState} from 'react'
import { t } from '../../lib/i18n'
export default function SearchPage(){
  const [q,setQ]=useState('')
  const [results, setResults] = useState<any[]>([])
  const demo = [{id:1,title:'Casa Punta Cana',price:'USD 240,000',beds:3,city:'Punta Cana'},{id:2,title:'Condo Samaná',price:'USD 380,000',beds:2,city:'Samaná'}]
  function doSearch(e: React.FormEvent){ e.preventDefault(); setResults(demo.filter((d)=>d.title.toLowerCase().includes(q.toLowerCase()) || d.city.toLowerCase().includes(q.toLowerCase())))}
  return (
    <div>
      <h1 className="text-2xl font-bold">{t('search_button')}</h1>
      <form onSubmit={doSearch} className="mt-4 flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder={t('search_placeholder')} className="flex-1 px-3 py-2 rounded border"/>
        <button className="px-4 py-2 bg-[#FF6B35] text-white rounded">{t('search_button')}</button>
      </form>

      <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(r=>(
          <div key={r.id} className="p-4 bg-white rounded shadow">
            <div className="h-40 bg-gray-100 rounded mb-3"/>
            <div className="font-semibold">{r.title}</div>
            <div className="text-sm text-gray-600">{r.price} • {r.beds} hab</div>
          </div>
        ))}
      </div>
    </div>
  )
}
