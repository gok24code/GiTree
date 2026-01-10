// src/components/TreeView.tsx
import React from 'react';
import TreeView, { flattenTree } from 'react-accessible-treeview';
import { GitTreeResponse } from '../services/github'; // Removed getFileContent
import { buildTree, TreeNode } from '../utils/data-transformer';
import { FaFolder, FaFile } from 'react-icons/fa';
// Removed FileViewer import
import './TreeView.css';

interface TreeViewProps {
  data: GitTreeResponse;
}

const TreeViewComponent: React.FC<TreeViewProps> = ({ data }) => {
  // Removed useState for selectedFileContent and selectedFileName

  const hierarchicalData = buildTree(data.tree);

  const flattenedData = flattenTree({
    name: '',
    children: hierarchicalData,
  });

  // Removed handleFileClick function

  return (
    <div className="tree-view-wrapper">
      <TreeView
        data={flattenedData}
        aria-label="File tree"
        className="basic"
        nodeRenderer={({ element, isBranch, isExpanded, getNodeProps, level }) => (
          <div
            {...getNodeProps()}
            style={{ paddingLeft: level * 20 }}
            // Removed onClick handler
            className={!isBranch ? 'file-node' : ''} // Still keep class for styling, but no click
          >
            {isBranch ? <FaFolder /> : <FaFile />}
            <span className="name">{element.name}</span>
          </div>
        )}
      />
      {/* Removed FileViewer rendering */}
    </div>
  );
};

export default TreeViewComponent;