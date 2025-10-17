'use client'
import { SearchBox } from 'react-instantsearch'
import { t } from '../lib/i18n'

export default function SearchBar(){
  // Thin wrapper to keep design consistent if used standalone
  return (
    <div className="w-full">
      <SearchBox placeholder={t('search_placeholder')} />
    </div>
  )
}
