/**
 * Utility to synchronize app data with a GitHub repository using the Git Data API.
 * This allows updating multiple files in a single commit.
 */

interface SyncFile {
  path: string;
  content: string;
}

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch?: string;
}

export async function commitMultipleFiles(config: GitHubConfig, files: SyncFile[], message: string = 'Cloud Sync: Update data files') {
  const { token, owner, repo, branch = 'main' } = config;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  try {
    // 1. Get the latest commit SHA of the branch
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, { headers });
    if (!refResponse.ok) throw new Error(`Failed to get ref: ${refResponse.statusText}`);
    const refData = await refResponse.json();
    const latestCommitSha = refData.object.sha;

    // 2. Create blobs for each file
    const treeItems = await Promise.all(files.map(async (file) => {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8'
        })
      });
      if (!blobResponse.ok) throw new Error(`Failed to create blob for ${file.path}`);
      const blobData = await blobResponse.json();
      
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha
      };
    }));

    // 3. Create a new tree on top of the latest commit
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: latestCommitSha,
        tree: treeItems
      })
    });
    if (!treeResponse.ok) throw new Error(`Failed to create tree: ${treeResponse.statusText}`);
    const treeData = await treeResponse.json();

    // 4. Create the commit
    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [latestCommitSha]
      })
    });
    if (!commitResponse.ok) throw new Error(`Failed to create commit: ${commitResponse.statusText}`);
    const commitData = await commitResponse.json();

    // 5. Update the branch reference to the new commit
    const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: commitData.sha,
        force: false
      })
    });
    if (!updateRefResponse.ok) throw new Error(`Failed to update ref: ${updateRefResponse.statusText}`);

    return { success: true, sha: commitData.sha };
  } catch (error) {
    console.error('GitHub Sync Error:', error);
    return { success: false, error: (error as Error).message };
  }
}
