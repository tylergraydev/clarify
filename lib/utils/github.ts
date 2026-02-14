/**
 * Check if a remote URL is a GitHub repository.
 */
export function isGitHubRepo(remoteUrl: null | string | undefined): boolean {
  if (!remoteUrl) return false;
  return remoteUrl.includes('github.com');
}

/**
 * Parse owner and repo name from a GitHub remote URL.
 * Supports both HTTPS and SSH formats.
 */
export function parseGitHubRemoteUrl(url: string): null | { owner: string; repo: string } {
  // HTTPS: https://github.com/owner/repo.git or https://github.com/owner/repo
  const httpsMatch = url.match(/github\.com[/:]([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (httpsMatch && httpsMatch[1] && httpsMatch[2]) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  // SSH: git@github.com:owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/([^/.]+?)(?:\.git)?$/);
  if (sshMatch && sshMatch[1] && sshMatch[2]) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}
