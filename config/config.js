// Configuration management for GitHub API
class Config {
    constructor() {
        this.githubToken = localStorage.getItem('github-token') || '';
        this.repoOwner = localStorage.getItem('repo-owner') || '';
        this.repoName = localStorage.getItem('repo-name') || '';
        this.branchName = localStorage.getItem('branch-name') || 'main';
        this.promptsFolder = 'prompts';
    }

    save(token, owner, repo, branch = 'main') {
        this.githubToken = token;
        this.repoOwner = owner;
        this.repoName = repo;
        this.branchName = branch;
        
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
}

export default Config;