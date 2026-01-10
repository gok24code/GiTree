// src/components/ForceGraphView.tsx
import React from 'react';
import { type GitTreeResponse } from '../services/github';
import ForceGraph from './ForceGraph'; // Import the new ForceGraph component

interface ForceGraphViewProps {
  data: GitTreeResponse;
}

const ForceGraphView: React.FC<ForceGraphViewProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--background-color)' }}>
      <ForceGraph data={data} />
    </div>
  );
};

export default ForceGraphView;