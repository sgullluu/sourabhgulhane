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

    // Initialize default categories if not already set
    initializeDefaultCategories() {
        const existingCategories = this.getCategories();
        if (existingCategories.length === 0) {
            const defaultCategories = [
                'DEFAULT', 'CODING', 'WRITING', 'MARKETING', 'ANALYSIS',
                'CREATIVE', 'BUSINESS', 'EDUCATION', 'RESEARCH', 'PRODUCTIVITY'
            ];
            this.saveCategories(defaultCategories);
        }
    }

    // Get all categories
    getCategories() {
        const categories = localStorage.getItem('custom-categories');
        return categories ? JSON.parse(categories) : [];
    }

    // Save categories to localStorage
    saveCategories(categories) {
        localStorage.setItem('custom-categories', JSON.stringify(categories));
    }

    // Add a new category
    addCategory(categoryName) {
        const categories = this.getCategories();
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
        this.saveCategories(categories);
        return categories;
    }

    // Remove a category
    removeCategory(categoryName) {
        const categories = this.getCategories();
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
        this.saveCategories(categories);
        return categories;
    }
}

export default Config;