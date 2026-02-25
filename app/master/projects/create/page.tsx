// app/master/projects/create/page.tsx
import { Metadata } from 'next';
import ProjectCreationForm from '@/components/ProjectCreationForm';

export const metadata: Metadata = {
  title: 'Create Project | VIVENTA',
  description: 'Create and list a new real estate development project',
};

export default function CreateProjectPage() {
  return (
    <main className="bg-white min-h-screen">
      <ProjectCreationForm />
    </main>
  );
}
