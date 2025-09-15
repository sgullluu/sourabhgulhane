// Prompt management utilities and UI helpers
import GitHubAPI from './github-api.js';

class PromptManager {
    constructor() {
        this.githubAPI = new GitHubAPI();
        this.prompts = [];
    }

    // Validate prompt data
    validatePromptData(name, promptText) {
        const errors = [];

        if (!name || name.trim().length === 0) {
            errors.push('Name is required');
        }

        if (!promptText || promptText.trim().length === 0) {
            errors.push('Prompt text is required');
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
        const rating = parseInt(prompt.rating) || 0;
        const verified = prompt.verified || false;
        const createdDate = prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : 'Unknown';
        const promptId = this.generateId(); // Generate unique ID for each prompt card
        
        let attachmentHtml = '';
        if (prompt.attachment) {
            const isImage = this.isImageFile(prompt.attachment.type || prompt.attachment.name);
            
            if (isImage) {
                attachmentHtml = `
                    <div class="prompt-attachment image-attachment">
                        <div class="attachment-header">
                            <i class="fas fa-image"></i>
                            <span>${prompt.attachment.name}</span>
                        </div>
                        <div class="attachment-preview">
                            <img src="${prompt.attachment.data}" alt="${prompt.attachment.name}" onclick="this.requestFullscreen()" style="cursor: pointer;" title="Click to view fullscreen">
                        </div>
                        <div class="attachment-actions">
                            <a href="${prompt.attachment.data}" download="${prompt.attachment.name}" class="download-link">
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>
                    </div>
                `;
            } else {
                attachmentHtml = `
                    <div class="prompt-attachment file-attachment">
                        <div class="attachment-header">
                            <i class="fas fa-paperclip"></i>
                            <span>${prompt.attachment.name}</span>
                        </div>
                        <div class="file-details">
                            <span class="file-size">${this.formatFileSize(prompt.attachment.size)}</span>
                            <span class="file-type">${this.getFileExtension(prompt.attachment.name)}</span>
                        </div>
                        <div class="attachment-actions">
                            <a href="${prompt.attachment.data}" download="${prompt.attachment.name}" target="_blank" class="download-link">
                                <i class="fas fa-download"></i> Download
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        return `
            <div class="prompt-card collapsible" data-filename="${prompt.filename}" data-sha="${prompt.sha}">
                <div class="prompt-header" onclick="promptManager.togglePromptCard('${promptId}')">
                    <div class="prompt-title-section">
                        <h3 class="prompt-name">${this.escapeHtml(prompt.name)}</h3>
                        <div class="prompt-status">
                            ${verified ? '<i class="fas fa-check-circle verified-icon" title="Verified"></i>' : ''}
                        </div>
                    </div>
                    <div class="expand-icon">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="prompt-content" id="content-${promptId}">
                    <div class="prompt-text">${this.escapeHtml(prompt.promptText)}</div>
                    ${attachmentHtml}
                    <div class="prompt-controls">
                        <div class="rating-control">
                            <label>Rating:</label>
                            <div class="star-rating" data-filename="${prompt.filename}" data-sha="${prompt.sha}">
                                ${[1,2,3,4,5].map(star => 
                                    `<i class="fas fa-star ${star <= rating ? 'active' : ''}" 
                                       onclick="promptManager.updateRating('${prompt.filename}', '${prompt.sha}', ${star})"
                                       data-rating="${star}"></i>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="verify-control">
                            <label class="verify-checkbox">
                                <input type="checkbox" ${verified ? 'checked' : ''} 
                                       onchange="promptManager.updateVerification('${prompt.filename}', '${prompt.sha}', this.checked)">
                                <span class="checkmark"></span>
                                Verified
                            </label>
                        </div>
                    </div>
                    <div class="prompt-meta">
                        <span class="prompt-date">Created: ${createdDate}</span>
                        <button class="delete-btn" onclick="promptManager.handleDeletePrompt('${prompt.filename}', '${prompt.sha}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
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
        
        // Make sure we have the latest configuration
        this.githubAPI.refreshConfig();
        
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
            const result = await this.githubAPI.ensurePromptsFolder();
            return result;
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Check if a file is an image
    isImageFile(type) {
        return type && type.startsWith('image/');
    }

    // Format file size for display
    formatFileSize(bytes) {
        if (!bytes) return 'Unknown size';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Get file extension
    getFileExtension(filename) {
        if (!filename) return 'Unknown';
        
        const ext = filename.split('.').pop();
        return ext ? ext.toUpperCase() : 'Unknown';
    }

    // Toggle prompt card expansion
    togglePromptCard(promptId) {
        const content = document.getElementById(`content-${promptId}`);
        const card = content.closest('.prompt-card');
        const icon = card.querySelector('.expand-icon i');
        
        if (card.classList.contains('expanded')) {
            // Collapse
            card.classList.remove('expanded');
            content.style.maxHeight = '0';
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        } else {
            // Expand
            card.classList.add('expanded');
            content.style.maxHeight = content.scrollHeight + 'px';
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
    }

    // Generate unique ID for prompt cards
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Update prompt rating
    async updateRating(filename, sha, newRating) {
        try {
            // Find the prompt in our local array
            const prompt = this.prompts.find(p => p.filename === filename);
            if (!prompt) {
                this.showStatus('Prompt not found', 'error');
                return;
            }

            // Update the rating
            prompt.rating = newRating;
            prompt.updatedAt = new Date().toISOString();

            // Save to GitHub
            const result = await this.updatePromptFile(filename, sha, prompt);
            if (result.success) {
                this.showStatus('Rating updated successfully!', 'success');
                // Update the visual stars
                this.updateStarsVisual(filename, newRating);
            } else {
                this.showStatus(`Error updating rating: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Error updating rating: ${error.message}`, 'error');
        }
    }

    // Update prompt verification status
    async updateVerification(filename, sha, verified) {
        try {
            // Find the prompt in our local array
            const prompt = this.prompts.find(p => p.filename === filename);
            if (!prompt) {
                this.showStatus('Prompt not found', 'error');
                return;
            }

            // Update the verification status
            prompt.verified = verified;
            prompt.updatedAt = new Date().toISOString();

            // Save to GitHub
            const result = await this.updatePromptFile(filename, sha, prompt);
            if (result.success) {
                this.showStatus(`Prompt ${verified ? 'verified' : 'unverified'} successfully!`, 'success');
                // Update the visual verification icon
                this.updateVerificationVisual(filename, verified);
            } else {
                this.showStatus(`Error updating verification: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Error updating verification: ${error.message}`, 'error');
        }
    }

    // Update prompt file on GitHub
    async updatePromptFile(filename, sha, promptData) {
        try {
            const url = `${this.githubAPI.config.getApiBaseUrl()}/contents/${this.githubAPI.config.promptsFolder}/${filename}`;
            
            const data = {
                message: `Update prompt: ${promptData.name}`,
                content: btoa(JSON.stringify(promptData, null, 2)),
                sha: sha,
                branch: this.githubAPI.config.branchName
            };

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.githubAPI.config.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Failed to update prompt: ${response.status} ${response.statusText}. ${errorData.message || ''}`);
            }

            return { success: true, data: await response.json() };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Update stars visual display
    updateStarsVisual(filename, rating) {
        const starContainer = document.querySelector(`[data-filename="${filename}"] .star-rating`);
        if (starContainer) {
            const stars = starContainer.querySelectorAll('.fas.fa-star');
            stars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.add('active');
                } else {
                    star.classList.remove('active');
                }
            });
        }
    }

    // Update verification visual display
    updateVerificationVisual(filename, verified) {
        const card = document.querySelector(`[data-filename="${filename}"]`);
        if (card) {
            const statusDiv = card.querySelector('.prompt-status');
            if (verified) {
                statusDiv.innerHTML = '<i class="fas fa-check-circle verified-icon" title="Verified"></i>';
            } else {
                statusDiv.innerHTML = '';
            }
        }
    }
}

export default PromptManager;