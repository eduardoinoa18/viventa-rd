// app/master/projects/[projectId]/page.tsx
import { Metadata } from 'next';
import ProjectListingPage from '@/components/ProjectListingPage';

export const metadata: Metadata = {
  title: 'Project Details | VIVENTA',
  description: 'View project details and unit inventory',
};

export default function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  return (
    <main className="bg-white min-h-screen">
      <ProjectListingPage projectId={params.projectId} />
    </main>
  );
}
