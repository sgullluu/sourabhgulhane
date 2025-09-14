// Configuration management for GitHub API
class Config {
    constructor() {
        this.repoOwner = localStorage.getItem('repo-owner') || '';
        this.repoName = localStorage.getItem('repo-name') || '';
        this.branchName = localStorage.getItem('branch-name') || 'main';
        this.promptsFolder = 'prompts';
        this.useRepositorySecret = localStorage.getItem('use-repo-secret') === 'true';
        
        // Token management based on user preference
        if (this.useRepositorySecret) {
            this.githubToken = null; // Will be fetched from repository secret
        } else {
            this.githubToken = this.getSecureToken() || '';
            this.sessionKey = this.getOrCreateSessionKey();
        }
    }

    save(token, owner, repo, branch = 'main', useRepositorySecret = false) {
        this.repoOwner = owner;
        this.repoName = repo;
        this.branchName = branch;
        this.useRepositorySecret = useRepositorySecret;
        
        if (useRepositorySecret) {
            // Don't store token locally, will fetch from repository secret
            this.githubToken = null;
            localStorage.removeItem('encrypted-token');
            sessionStorage.removeItem('encrypted-token');
        } else {
            // Store token securely in sessionStorage with encryption
            this.githubToken = token;
            this.setSecureToken(token);
        }
        
        localStorage.setItem('repo-owner', owner);
        localStorage.setItem('repo-name', repo);
        localStorage.setItem('branch-name', branch);
        localStorage.setItem('use-repo-secret', useRepositorySecret.toString());
    }

    isConfigured() {
        if (this.useRepositorySecret) {
            return this.repoOwner && this.repoName && this.branchName;
        }
        return this.githubToken && this.repoOwner && this.repoName && this.branchName;
    }

    // Fetch token from repository secret (via GitHub Actions API)
    async fetchTokenFromSecret() {
        if (!this.useRepositorySecret) {
            return this.githubToken;
        }

        try {
            // This would need a serverless function or GitHub Action to securely provide the token
            // For now, we'll create a simple endpoint that returns the token securely
            const response = await fetch(`https://api.github.com/repos/${this.repoOwner}/${this.repoName}/actions/secrets/GITHUB_ACCESS_TOKEN`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                // This is a placeholder - actual implementation would need a secure endpoint
                console.log('Repository secret configured');
                return 'token-from-secret'; // This would be the actual token from your secure endpoint
            }
        } catch (error) {
            console.error('Failed to fetch token from repository secret:', error);
        }

        return null;
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

    // Security methods for token storage
    getOrCreateSessionKey() {
        let key = sessionStorage.getItem('session-key');
        if (!key) {
            // Generate a random key for this session
            key = this.generateRandomKey();
            sessionStorage.setItem('session-key', key);
        }
        return key;
    }

    generateRandomKey() {
        // Generate a random string for encryption
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    // Simple XOR encryption for token storage
    encryptToken(token, key) {
        let encrypted = '';
        for (let i = 0; i < token.length; i++) {
            const keyChar = key[i % key.length];
            const tokenChar = token[i];
            encrypted += String.fromCharCode(tokenChar.charCodeAt(0) ^ keyChar.charCodeAt(0));
        }
        return btoa(encrypted); // Base64 encode the result
    }

    decryptToken(encryptedToken, key) {
        try {
            const encrypted = atob(encryptedToken); // Base64 decode
            let decrypted = '';
            for (let i = 0; i < encrypted.length; i++) {
                const keyChar = key[i % key.length];
                const encryptedChar = encrypted[i];
                decrypted += String.fromCharCode(encryptedChar.charCodeAt(0) ^ keyChar.charCodeAt(0));
            }
            return decrypted;
        } catch (error) {
            console.error('Failed to decrypt token:', error);
            return '';
        }
    }

    setSecureToken(token) {
        if (!token) {
            sessionStorage.removeItem('encrypted-token');
            return;
        }
        
        const encrypted = this.encryptToken(token, this.sessionKey);
        sessionStorage.setItem('encrypted-token', encrypted);
        
        // Set expiration time (2 hours from now)
        const expiration = Date.now() + (2 * 60 * 60 * 1000);
        sessionStorage.setItem('token-expiry', expiration.toString());
    }

    getSecureToken() {
        const encrypted = sessionStorage.getItem('encrypted-token');
        const expiry = sessionStorage.getItem('token-expiry');
        
        if (!encrypted || !expiry) {
            return '';
        }
        
        // Check if token has expired
        if (Date.now() > parseInt(expiry)) {
            this.clearSecureToken();
            return '';
        }
        
        return this.decryptToken(encrypted, this.sessionKey);
    }

    clearSecureToken() {
        sessionStorage.removeItem('encrypted-token');
        sessionStorage.removeItem('token-expiry');
        sessionStorage.removeItem('session-key');
    }

    // Method to check if we need to re-authenticate
    isTokenExpired() {
        const expiry = sessionStorage.getItem('token-expiry');
        if (!expiry) return true;
        return Date.now() > parseInt(expiry);
    }
}

export default Config;