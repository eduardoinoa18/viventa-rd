import type { Metadata } from 'next'
import ProjectsCatalogPage from '@/components/ProjectsCatalogPage'

export const metadata: Metadata = {
  title: 'Proyectos | VIVENTA',
  description: 'Explora proyectos activos, preventas y desarrollos con inventario vivo en República Dominicana.',
}

export default function ProjectsPage() {
  return <ProjectsCatalogPage />
}
