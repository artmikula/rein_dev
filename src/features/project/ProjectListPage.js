import ProjectList from 'features/shared/components/ProjectList';
import React from 'react';
import { Container } from 'reactstrap';
import ProjectLayout from './components/ProjectLayout';

export default function ProjectListPage() {
  return (
    <ProjectLayout>
      <Container>
        <div className="mt-5">
          <ProjectList />
        </div>
      </Container>
    </ProjectLayout>
  );
}
