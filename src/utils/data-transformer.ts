// src/utils/data-transformer.ts
import { GitTreeItem } from "../services/github";

export interface TreeNode {
  name: string;
  children: TreeNode[];
  id: string;
  isBranch: boolean;
  path: string;
}

export const buildTree = (paths: GitTreeItem[]): TreeNode[] => {
  const root: TreeNode = { name: 'root', children: [], id: 'root', isBranch: true, path: '' };

  for (const item of paths) {
    const parts = item.path.split('/');
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isBranch = i < parts.length - 1 || item.type === 'tree';
      let childNode = currentNode.children.find(child => child.name === part);

      if (!childNode) {
        childNode = {
          name: part,
          children: [],
          id: item.path,
          isBranch,
          path: parts.slice(0, i + 1).join('/'),
        };
        currentNode.children.push(childNode);
      }

      currentNode = childNode;
    }
  }

  return root.children;
};
