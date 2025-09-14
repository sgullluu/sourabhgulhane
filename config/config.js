// Configuration management for GitHub API
class Config {
    constructor() {
        this.repoOwner = localStorage.getItem('repo-owner') || '';
        this.repoName = localStorage.getItem('repo-name') || '';
        this.branchName = localStorage.getItem('branch-name') || 'main';
        this.promptsFolder = 'prompts';
        
        // Simple permanent token storage
        this.githubToken = localStorage.getItem('github-token') || '';
    }

    save(token, owner, repo, branch = 'main') {
        this.githubToken = token;
        this.repoOwner = owner;
        this.repoName = repo;
        this.branchName = branch;
        
        // Store everything in localStorage permanently
        localStorage.setItem('github-token', token);
        localStorage.setItem('repo-owner', owner);
        localStorage.setItem('repo-name', repo);
        localStorage.setItem('branch-name', branch);
    }

    isConfigured() {
        return this.githubToken && this.repoOwner && this.repoName && this.branchName;
    }

    getApiBaseUrl() {
        return `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`;
    }

    getHeaders() {
        return {
            'Authorization': `Bearer ${this.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
    }

    // No expiration - always return false
    isTokenExpired() {
        return false;
    }
}

export default Config;