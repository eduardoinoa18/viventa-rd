// app/projects/[projectId]/page.tsx
import { Metadata } from 'next';
import ProjectListingPage from '@/components/ProjectListingPage';

export const metadata: Metadata = {
  title: 'Project Details | VIVENTA',
  description: 'Explore project inventory, availability, and financing',
};

export default function PublicProjectDetailPage({ params }: { params: { projectId: string } }) {
  return (
    <main className="bg-white min-h-screen">
      <ProjectListingPage projectId={params.projectId} />
    </main>
  );
}
