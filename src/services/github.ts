// src/services/github.ts

export const parseGitHubUrl = (inputUrl: string): { owner: string; repo: string } | null => {
  try {
    console.log('Attempting to parse URL:', inputUrl);
    let url = inputUrl.trim();

    // If it doesn't start with http(s)://, assume it's a shorthand for github.com
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://github.com/${url}`;
    }

    // Remove .git suffix if present
    if (url.endsWith('.git')) {
      url = url.slice(0, -4);
    }

    const urlObject = new URL(url);
    console.log('Processed Hostname:', urlObject.hostname);
    console.log('Processed Pathname:', urlObject.pathname);

    if (urlObject.hostname !== 'github.com') {
      console.log('Hostname is not github.com');
      return null;
    }

    const pathParts = urlObject.pathname.split('/').filter(part => part);
    console.log('Path parts:', pathParts);

    if (pathParts.length < 2) {
      console.log('Not enough path parts');
      return null;
    }

    const [owner, repo] = pathParts;
    return { owner, repo };
  } catch (error) {
    console.error('Invalid URL:', error);
    return null;
  }
};

export interface GitTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface GitTreeResponse {
  sha: string;
  url: string;
  tree: GitTreeItem[];
  truncated: boolean;
}

export const getRepoTree = async (owner: string, repo: string, pat?: string): Promise<GitTreeResponse | null> => {
  try {
    const headers: HeadersInit = {};
    if (pat) {
      headers.Authorization = `token ${pat}`;
    }

    let branch = await getDefaultBranch(owner, repo, pat);
    if (!branch) {
      console.warn(`Could not determine default branch for ${owner}/${repo}. Attempting 'main' then 'master'.`);
      branch = 'main'; // Fallback 1
    }

    let response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });

    if (!response.ok) {
      // If the first attempt failed and we used a fallback, try the other common fallback
      if (branch === 'main') {
        console.warn(`Fetching tree with 'main' failed for ${owner}/${repo}. Attempting 'master'.`);
        branch = 'master'; // Fallback 2
        response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      }
    }

    if (!response.ok) {
      console.error('Error fetching repository tree after all attempts:', response.statusText, await response.text());
      return null;
    }
    const data: GitTreeResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching repository tree:', error);
    return null;
  }
};

export const getRepoLanguages = async (owner: string, repo: string, pat?: string): Promise<Record<string, number> | null> => {
  try {
    const headers: HeadersInit = {};
    if (pat) {
      headers.Authorization = `token ${pat}`;
    }
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/languages`, { headers });
    if (!response.ok) {
      console.error(`Error fetching languages for ${owner}/${repo}:`, response.statusText, await response.text());
      return null;
    }
    const data: Record<string, number> = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching languages for ${owner}/${repo}:`, error);
    return null;
  }
};

export const getDefaultBranch = async (owner: string, repo: string, pat?: string): Promise<string | null> => {
  try {
    const headers: HeadersInit = {};
    if (pat) {
      headers.Authorization = `token ${pat}`;
    }
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!response.ok) {
      console.error(`Error fetching repository details for ${owner}/${repo}:`, response.statusText, await response.text());
      return null;
    }
    const data = await response.json();
    return data.default_branch || null;
  } catch (error) {
    console.error(`Error fetching repository details for ${owner}/${repo}:`, error);
    return null;
  }
};

