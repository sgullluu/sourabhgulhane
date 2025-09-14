// Configuration management for GitHub API
class Config {
    constructor() {
        // Use sessionStorage for token (expires when browser closes)
        // and encrypt the token before storing
        this.githubToken = this.getSecureToken() || '';
        this.repoOwner = localStorage.getItem('repo-owner') || '';
        this.repoName = localStorage.getItem('repo-name') || '';
        this.branchName = localStorage.getItem('branch-name') || 'main';
        this.promptsFolder = 'prompts';
        
        // Generate a unique session key for encryption
        this.sessionKey = this.getOrCreateSessionKey();
    }

    save(token, owner, repo, branch = 'main') {
        this.githubToken = token;
        this.repoOwner = owner;
        this.repoName = repo;
        this.branchName = branch;
        
        // Store token securely in sessionStorage with encryption
        this.setSecureToken(token);
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