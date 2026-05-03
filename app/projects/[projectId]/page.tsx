// app/projects/[projectId]/page.tsx
import { Metadata } from 'next';
import ProjectListingPage from '@/components/ProjectListingPage';

export const metadata: Metadata = {
  title: 'Proyecto | VIVENTA',
  description: 'Explora inventario, disponibilidad y opciones de financiamiento de proyectos en República Dominicana.',
};

export default function PublicProjectDetailPage({ params }: { params: { projectId: string } }) {
  return <ProjectListingPage projectId={params.projectId} />;
}
