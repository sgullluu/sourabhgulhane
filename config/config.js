// Configuration management for GitHub API
class Config {
    constructor() {
        this.repoOwner = localStorage.getItem('repo-owner') || '';
        this.repoName = localStorage.getItem('repo-name') || '';
        this.branchName = localStorage.getItem('branch-name') || 'main';
        this.promptsFolder = 'prompts';
        
        // Simple permanent token storage
        this.githubToken = localStorage.getItem('github-token') || '';
        
        // Initialize default categories
        this.initializeDefaultCategories();
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

    // Initialize categories - will be loaded from GitHub when needed
    initializeDefaultCategories() {
        // Categories will now be loaded from GitHub on demand
        // Keep a local cache for offline access
        this.categoriesCache = null;
        this.categoriesLoaded = false;
    }

    // Get all categories (async method now)
    async getCategories() {
        if (!this.isConfigured()) {
            // If not configured, return cached categories or defaults
            return this.getCachedCategories();
        }

        try {
            // Import GitHubAPI dynamically to avoid circular dependency
            const { default: GitHubAPI } = await import('../js/github-api.js');
            const githubAPI = new GitHubAPI();
            const categories = await githubAPI.fetchCategories();
            
            // Cache the categories locally
            this.setCachedCategories(categories);
            this.categoriesLoaded = true;
            
            return categories;
        } catch (error) {
            console.warn('Failed to load categories from GitHub, using cached/default:', error);
            return this.getCachedCategories();
        }
    }

    // Get cached categories from localStorage
    getCachedCategories() {
        const categories = localStorage.getItem('cached-categories');
        return categories ? JSON.parse(categories) : [
            'DEFAULT', 'CODING', 'WRITING', 'MARKETING', 'ANALYSIS',
            'CREATIVE', 'BUSINESS', 'EDUCATION', 'RESEARCH', 'PRODUCTIVITY'
        ];
    }

    // Cache categories locally for offline access
    setCachedCategories(categories) {
        localStorage.setItem('cached-categories', JSON.stringify(categories));
    }

    // Save categories to GitHub
    async saveCategories(categories) {
        if (!this.isConfigured()) {
            throw new Error('GitHub configuration required to save categories');
        }

        try {
            const { default: GitHubAPI } = await import('../js/github-api.js');
            const githubAPI = new GitHubAPI();
            await githubAPI.saveCategories(categories);
            
            // Update local cache
            this.setCachedCategories(categories);
            return categories;
        } catch (error) {
            console.error('Failed to save categories to GitHub:', error);
            throw error;
        }
    }

    // Add a new category
    async addCategory(categoryName) {
        const categories = await this.getCategories();
        const upperCaseName = categoryName.toUpperCase().trim();
        
        // Validate category name
        if (!upperCaseName) {
            throw new Error('Category name cannot be empty');
        }
        
        if (upperCaseName.split(' ').length > 3) {
            throw new Error('Category name cannot exceed 3 words');
        }
        
        if (categories.includes(upperCaseName)) {
            throw new Error('Category already exists');
        }
        
        categories.push(upperCaseName);
        await this.saveCategories(categories);
        return categories;
    }

    // Remove a category
    async removeCategory(categoryName) {
        const categories = await this.getCategories();
        const upperCaseName = categoryName.toUpperCase().trim();
        
        // Prevent removal of DEFAULT category
        if (upperCaseName === 'DEFAULT') {
            throw new Error('Cannot remove DEFAULT category');
        }
        
        const index = categories.indexOf(upperCaseName);
        if (index === -1) {
            throw new Error('Category not found');
        }
        
        categories.splice(index, 1);
        await this.saveCategories(categories);
        return categories;
    }

    // Force reload categories from GitHub
    async reloadCategories() {
        this.categoriesLoaded = false;
        return await this.getCategories();
    }
}

export default Config;