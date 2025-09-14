// GitHub API wrapper for prompt management
import Config from '../config/config.js';

class GitHubAPI {
    constructor() {
        this.config = new Config();
    }

    // Create or update a prompt file in the repository
    async createPrompt(promptData) {
        if (!this.config.isConfigured()) {
            throw new Error('GitHub configuration is not set. Please configure your settings first.');
        }

        // Create a safe filename from the prompt name
        const filename = this.createSafeFilename(promptData.name);
        const url = `${this.config.getApiBaseUrl()}/contents/${this.config.promptsFolder}/${filename}.json`;

        // Add metadata to the prompt data
        const promptWithMetadata = {
            ...promptData,
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const data = {
            message: `Add prompt: ${promptData.name}`,
            content: btoa(JSON.stringify(promptWithMetadata, null, 2)),
            branch: 'main'
        };

        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.config.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to create prompt: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating prompt:', error);
            throw error;
        }
    }

    // Fetch all prompts from the repository
    async fetchPrompts() {
        if (!this.config.isConfigured()) {
            throw new Error('GitHub configuration is not set. Please configure your settings first.');
        }

        const url = `${this.config.getApiBaseUrl()}/contents/${this.config.promptsFolder}`;

        try {
            const response = await fetch(url, {
                headers: this.config.getHeaders()
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // Prompts folder doesn't exist yet, return empty array
                    return [];
                }
                throw new Error(`Failed to fetch prompts: ${response.status} ${response.statusText}`);
            }

            const files = await response.json();
            
            // Filter only JSON files
            const jsonFiles = files.filter(file => file.name.endsWith('.json'));
            
            if (jsonFiles.length === 0) {
                return [];
            }

            // Fetch content of each JSON file
            const promptPromises = jsonFiles.map(async (file) => {
                try {
                    const contentResponse = await fetch(file.download_url);
                    if (!contentResponse.ok) {
                        console.warn(`Failed to fetch content for ${file.name}`);
                        return null;
                    }
                    const promptData = await contentResponse.json();
                    return {
                        ...promptData,
                        filename: file.name,
                        sha: file.sha // For potential future updates/deletes
                    };
                } catch (error) {
                    console.warn(`Error parsing ${file.name}:`, error);
                    return null;
                }
            });

            const prompts = await Promise.all(promptPromises);
            // Filter out null values (failed fetches)
            return prompts.filter(prompt => prompt !== null);

        } catch (error) {
            console.error('Error fetching prompts:', error);
            throw error;
        }
    }

    // Delete a prompt file
    async deletePrompt(filename, sha) {
        if (!this.config.isConfigured()) {
            throw new Error('GitHub configuration is not set.');
        }

        const url = `${this.config.getApiBaseUrl()}/contents/${this.config.promptsFolder}/${filename}`;

        const data = {
            message: `Delete prompt: ${filename}`,
            sha: sha,
            branch: 'main'
        };

        try {
            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.config.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`Failed to delete prompt: ${response.status} ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting prompt:', error);
            throw error;
        }
    }

    // Check if the prompts folder exists, create if it doesn't
    async ensurePromptsFolder() {
        if (!this.config.isConfigured()) {
            throw new Error('GitHub configuration is not set.');
        }

        const url = `${this.config.getApiBaseUrl()}/contents/${this.config.promptsFolder}`;

        try {
            const response = await fetch(url, {
                headers: this.config.getHeaders()
            });

            if (response.status === 404) {
                // Create the folder by creating a .gitkeep file
                const createUrl = `${this.config.getApiBaseUrl()}/contents/${this.config.promptsFolder}/.gitkeep`;
                const data = {
                    message: 'Create prompts folder',
                    content: btoa('# This file keeps the prompts folder in git'),
                    branch: 'main'
                };

                const createResponse = await fetch(createUrl, {
                    method: 'PUT',
                    headers: this.config.getHeaders(),
                    body: JSON.stringify(data)
                });

                if (!createResponse.ok) {
                    throw new Error(`Failed to create prompts folder: ${createResponse.status} ${createResponse.statusText}`);
                }
            }
        } catch (error) {
            console.error('Error ensuring prompts folder:', error);
            throw error;
        }
    }

    // Test the GitHub API configuration
    async testConnection() {
        if (!this.config.isConfigured()) {
            throw new Error('GitHub configuration is not set.');
        }

        const url = `${this.config.getApiBaseUrl()}`;

        try {
            const response = await fetch(url, {
                headers: this.config.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to connect to repository: ${response.status} ${response.statusText}`);
            }

            const repoData = await response.json();
            return {
                success: true,
                repository: repoData.full_name,
                private: repoData.private
            };
        } catch (error) {
            console.error('Error testing connection:', error);
            throw error;
        }
    }

    // Utility methods
    createSafeFilename(name) {
        // Replace spaces and special characters with underscores
        return name.toLowerCase()
            .replace(/[^a-z0-9\-_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Upload attachment (convert to base64 and store in the JSON)
    async processAttachment(file) {
        if (!file) return null;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target.result // This will be the base64 data URL
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

export default GitHubAPI;