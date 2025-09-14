// Prompt management utilities and UI helpers
import GitHubAPI from './github-api.js';

class PromptManager {
    constructor() {
        this.githubAPI = new GitHubAPI();
        this.prompts = [];
    }

    // Validate prompt data
    validatePromptData(name, promptText, rating) {
        const errors = [];

        if (!name || name.trim().length === 0) {
            errors.push('Name is required');
        }

        if (!promptText || promptText.trim().length === 0) {
            errors.push('Prompt text is required');
        }

        if (!rating || rating < 1 || rating > 5) {
            errors.push('Rating must be between 1 and 5');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Save a prompt to GitHub
    async savePrompt(promptData) {
        try {
            const result = await this.githubAPI.createPrompt(promptData);
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Load all prompts from GitHub
    async loadPrompts() {
        try {
            this.prompts = await this.githubAPI.fetchPrompts();
            return { success: true, prompts: this.prompts };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Delete a prompt
    async deletePrompt(filename, sha) {
        try {
            await this.githubAPI.deletePrompt(filename, sha);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Format prompt for display
    formatPromptForDisplay(prompt) {
        const ratingStars = '⭐'.repeat(parseInt(prompt.rating));
        const createdDate = prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : 'Unknown';
        
        const attachmentHtml = prompt.attachment ? 
            `<div class="prompt-attachment">
                <i class="fas fa-paperclip"></i>
                <a href="${prompt.attachment.data}" download="${prompt.attachment.name}" target="_blank">
                    ${prompt.attachment.name}
                </a>
            </div>` : '';

        return `
            <div class="prompt-card" data-filename="${prompt.filename}" data-sha="${prompt.sha}">
                <div class="prompt-header">
                    <h3 class="prompt-name">${this.escapeHtml(prompt.name)}</h3>
                    <div class="prompt-rating">${ratingStars}</div>
                </div>
                <div class="prompt-text">${this.escapeHtml(prompt.promptText)}</div>
                ${attachmentHtml}
                <div class="prompt-meta">
                    <span class="prompt-date">Created: ${createdDate}</span>
                    <button class="delete-btn" onclick="promptManager.handleDeletePrompt('${prompt.filename}', '${prompt.sha}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Display prompts in the UI
    displayPrompts(prompts) {
        console.log('displayPrompts called with:', prompts);
        const container = document.getElementById('prompts-container');
        console.log('Container found:', container);
        
        if (!prompts || prompts.length === 0) {
            console.log('No prompts to display, showing empty message');
            container.innerHTML = `
                <div class="no-prompts">
                    <i class="fas fa-info-circle"></i>
                    <p>No prompts found. Add your first prompt above!</p>
                </div>
            `;
            return;
        }

        // Sort prompts by creation date (newest first)
        const sortedPrompts = prompts.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        console.log('Sorted prompts:', sortedPrompts);
        
        const htmlContent = sortedPrompts
            .map(prompt => this.formatPromptForDisplay(prompt))
            .join('');
        
        console.log('Generated HTML:', htmlContent);
        container.innerHTML = htmlContent;
        console.log('Updated container innerHTML');
    }

    // Handle prompt deletion
    async handleDeletePrompt(filename, sha) {
        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }

        this.showStatus('Deleting prompt...', 'info');
        
        const result = await this.deletePrompt(filename, sha);
        
        if (result.success) {
            this.showStatus('Prompt deleted successfully!', 'success');
            // Reload prompts
            await this.refreshPrompts();
        } else {
            this.showStatus(`Error deleting prompt: ${result.error}`, 'error');
        }
    }

    // Refresh prompts display
    async refreshPrompts() {
        console.log('Refreshing prompts...');
        this.showLoading(true);
        const result = await this.loadPrompts();
        this.showLoading(false);

        console.log('Load prompts result:', result);

        if (result.success) {
            console.log('Displaying prompts:', result.prompts);
            this.displayPrompts(result.prompts);
        } else {
            console.error('Error loading prompts:', result.error);
            this.showStatus(`Error loading prompts: ${result.error}`, 'error');
        }
    }

    // Show/hide loading indicator
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = show ? 'block' : 'none';
        }
    }

    // Show status messages
    showStatus(message, type = 'info') {
        // Remove any existing status messages
        const existingStatus = document.querySelector('.status-message');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Create new status message
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message status-${type}`;
        statusDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i> ${message}`;

        // Insert at the top of the main content
        const main = document.querySelector('main');
        main.insertBefore(statusDiv, main.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 5000);
    }

    // Utility function to escape HTML
    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Test GitHub connection
    async testGitHubConnection() {
        try {
            const result = await this.githubAPI.testConnection();
            return { success: true, data: result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Ensure prompts folder exists
    async ensurePromptsFolder() {
        try {
            await this.githubAPI.ensurePromptsFolder();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default PromptManager;