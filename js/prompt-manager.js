// Prompt management utilities and UI helpers
import GitHubAPI from './github-api.js';

class PromptManage        return `
            <div class="prompt-card collapsible" 
                 data-filename="${prompt.filename}" 
                 data-sha="${prompt.sha}" 
                 data-verified="${verified}" 
                 data-category="${prompt.category || 'DEFAULT'}" 
                 data-rating="${prompt.rating || 0}">
                <div class="prompt-header" onclick="promptManager.togglePromptCard('${promptId}')">`
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
            <div class="prompt-card collapsible" data-filename="${prompt.filename}" data-sha="${prompt.sha}" data-verified="${verified}">
                <div class="prompt-header" onclick="promptManager.togglePromptCard('${promptId}')">
                    <div class="prompt-title-section">
                        <div class="prompt-category-badge">${prompt.category || 'DEFAULT'}</div>
                        <h3 class="prompt-name">${this.escapeHtml(prompt.name)}</h3>
                        <div class="prompt-status">
                            ${verified ? '<i class="fas fa-check-circle verified-icon" title="Verified"></i>' : '<i class="fas fa-clock unverified-icon" title="Unverified"></i>'}
                        </div>
                    </div>
                    <div class="expand-icon">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="prompt-content" id="content-${promptId}">
                    <div class="prompt-actions-top">
                        <button class="copy-btn" onclick="promptManager.copyPromptText('${promptId}')" title="Copy prompt text">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                        <button class="edit-btn" onclick="promptManager.editPrompt('${prompt.filename}', '${prompt.sha}')" title="Edit prompt">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                    </div>
                    <div class="prompt-text" id="text-${promptId}">${this.escapeHtml(prompt.promptText)}</div>
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

        // Group prompts by category
        const groupedPrompts = this.groupPromptsByCategory(prompts);
        console.log('Grouped prompts:', groupedPrompts);
        
        // Create HTML for each category group
        let htmlContent = '';
        
        // Sort categories: DEFAULT first, then alphabetically
        const sortedCategories = Object.keys(groupedPrompts).sort((a, b) => {
            if (a === 'DEFAULT') return -1;
            if (b === 'DEFAULT') return 1;
            return a.localeCompare(b);
        });
        
        sortedCategories.forEach(category => {
            const categoryPrompts = groupedPrompts[category];
            const categoryIcon = this.getCategoryIcon(category);
            
            htmlContent += `
                <div class="category-section">
                    <div class="category-header">
                        <h3 class="category-title">
                            <i class="${categoryIcon}"></i>
                            ${category}
                            <span class="category-count">(${categoryPrompts.length})</span>
                        </h3>
                    </div>
                    <div class="category-prompts">
                        ${categoryPrompts.map(prompt => this.formatPromptForDisplay(prompt)).join('')}
                    </div>
                </div>
            `;
        });
        
        console.log('Generated HTML:', htmlContent);
        container.innerHTML = htmlContent;
        console.log('Updated container innerHTML');
    }

    // Group prompts by category
    groupPromptsByCategory(prompts) {
        const grouped = {};
        
        prompts.forEach(prompt => {
            const category = prompt.category || 'DEFAULT';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(prompt);
        });
        
        // Sort prompts within each category by creation date (newest first)
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
        });
        
        return grouped;
    }

    // Get icon for category
    getCategoryIcon(category) {
        const icons = {
            'DEFAULT': 'fas fa-folder',
            'CODING': 'fas fa-code',
            'WRITING': 'fas fa-pen',
            'MARKETING': 'fas fa-bullhorn',
            'ANALYSIS': 'fas fa-chart-line',
            'CREATIVE': 'fas fa-palette',
            'BUSINESS': 'fas fa-briefcase',
            'EDUCATION': 'fas fa-graduation-cap',
            'RESEARCH': 'fas fa-search',
            'PRODUCTIVITY': 'fas fa-tasks'
        };
        return icons[category] || 'fas fa-folder';
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
            
            // Update dashboard if updateDashboard function exists
            if (typeof window.updateDashboard === 'function') {
                window.updateDashboard();
            }
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

    // Copy prompt text to clipboard
    async copyPromptText(promptId) {
        const textElement = document.getElementById(`text-${promptId}`);
        if (!textElement) return;
        
        try {
            await navigator.clipboard.writeText(textElement.textContent);
            this.showStatus('Prompt text copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = textElement.textContent;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showStatus('Prompt text copied to clipboard!', 'success');
        }
    }

    // Edit prompt functionality
    editPrompt(filename, sha) {
        // Find the prompt data
        const prompt = this.prompts.find(p => p.filename === filename);
        if (!prompt) {
            this.showStatus('Prompt not found for editing', 'error');
            return;
        }

        // Fill the form with existing data
        document.getElementById('prompt-name').value = prompt.name;
        document.getElementById('prompt-text').value = prompt.promptText;
        document.getElementById('prompt-category').value = prompt.category || 'DEFAULT';
        
        // Switch to add prompt tab
        const addTab = document.querySelector('[data-tab="add-prompt"]');
        const addPane = document.getElementById('add-prompt');
        
        // Remove active from all tabs
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Activate add prompt tab
        addTab.classList.add('active');
        addPane.classList.add('active');
        
        // Store the editing info (will be used when saving)
        this.editingPrompt = { filename, sha };
        
        // Update form title and button
        const formTitle = document.querySelector('#add-prompt h2');
        const submitBtn = document.querySelector('.submit-btn');
        
        formTitle.innerHTML = '<i class="fas fa-edit"></i> Edit Prompt';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Prompt';
        
        this.showStatus('Prompt loaded for editing', 'info');
    }

    // Update prompt rating
    async updateRating(filename, sha, rating) {
        try {
            // Find and update the prompt
            const prompt = this.prompts.find(p => p.filename === filename);
            if (!prompt) return;
            
            prompt.rating = rating;
            prompt.updatedAt = new Date().toISOString();
            
            // Save to GitHub
            const result = await this.githubAPI.updatePrompt(filename, sha, prompt);
            
            if (result.success) {
                // Update the display
                const starContainer = document.querySelector(`[data-filename="${filename}"] .star-rating`);
                if (starContainer) {
                    const stars = starContainer.querySelectorAll('.fa-star');
                    stars.forEach((star, index) => {
                        if (index < rating) {
                            star.classList.add('active');
                        } else {
                            star.classList.remove('active');
                        }
                    });
                }
                this.showStatus(`Rating updated to ${rating} star${rating > 1 ? 's' : ''}`, 'success');
            }
        } catch (error) {
            this.showStatus('Error updating rating', 'error');
        }
    }

    // Update prompt verification status
    async updateVerification(filename, sha, verified) {
        try {
            // Find and update the prompt
            const prompt = this.prompts.find(p => p.filename === filename);
            if (!prompt) return;
            
            prompt.verified = verified;
            prompt.updatedAt = new Date().toISOString();
            
            // Save to GitHub
            const result = await this.githubAPI.updatePrompt(filename, sha, prompt);
            
            if (result.success) {
                // Update the card's data attribute
                const card = document.querySelector(`[data-filename="${filename}"]`);
                if (card) {
                    card.setAttribute('data-verified', verified);
                    
                    // Update the status icon
                    const statusIcon = card.querySelector('.prompt-status i');
                    if (statusIcon) {
                        statusIcon.className = verified ? 
                            'fas fa-check-circle verified-icon' : 
                            'fas fa-clock unverified-icon';
                        statusIcon.title = verified ? 'Verified' : 'Unverified';
                    }
                }
                
                this.showStatus(`Prompt ${verified ? 'verified' : 'unverified'}`, 'success');
                
                // Refresh display if we're filtering
                const activeFilter = document.querySelector('.filter-tab.active');
                if (activeFilter) {
                    const filter = activeFilter.getAttribute('data-filter');
                    if (filter !== 'all') {
                        this.filterPrompts(filter);
                    }
                }
            }
        } catch (error) {
            this.showStatus('Error updating verification status', 'error');
        }
    }

    // Filter prompts by verification status
    filterPrompts(filters) {
        const cards = document.querySelectorAll('.prompt-card');
        const categorySections = document.querySelectorAll('.category-section');
        
        // Handle both old string format and new object format for backward compatibility
        let verificationFilter, categoryFilter, minRatingFilter;
        
        if (typeof filters === 'string') {
            verificationFilter = filters;
            categoryFilter = '';
            minRatingFilter = null;
        } else {
            verificationFilter = filters.verification || 'all';
            categoryFilter = filters.category || '';
            minRatingFilter = filters.minRating || null;
        }
        
        cards.forEach(card => {
            const verified = card.getAttribute('data-verified') === 'true';
            const category = card.getAttribute('data-category') || '';
            const rating = parseInt(card.getAttribute('data-rating') || '0');
            
            let show = true;
            
            // Apply verification filter
            switch(verificationFilter) {
                case 'verified':
                    show = show && verified;
                    break;
                case 'unverified':
                    show = show && !verified;
                    break;
                case 'all':
                default:
                    // Show all
                    break;
            }
            
            // Apply category filter
            if (categoryFilter && categoryFilter !== '') {
                show = show && (category === categoryFilter);
            }
            
            // Apply rating filter
            if (minRatingFilter !== null && minRatingFilter > 0) {
                show = show && (rating >= minRatingFilter);
            }
            
            card.style.display = show ? 'block' : 'none';
        });
        
        // Hide empty category sections
        categorySections.forEach(section => {
            const visibleCardsInCategory = section.querySelectorAll('.prompt-card[style="display: block;"], .prompt-card:not([style*="display: none"])');
            section.style.display = visibleCardsInCategory.length > 0 ? 'block' : 'none';
        });
        
        // Update counts and show no results if needed
        const visibleCards = document.querySelectorAll('.prompt-card[style="display: block;"], .prompt-card:not([style*="display: none"])').length;
        const container = document.getElementById('prompts-container');
        
        if (visibleCards === 0 && cards.length > 0) {
            const noResults = document.querySelector('.no-results') || document.createElement('div');
            noResults.className = 'no-results';
            noResults.innerHTML = `
                <div class="no-prompts">
                    <i class="fas fa-search"></i>
                    <p>No prompts match the current filters.</p>
                    <small>Try adjusting your filter criteria</small>
                </div>
            `;
            if (!document.querySelector('.no-results')) {
                container.appendChild(noResults);
            }
        } else {
            const noResults = document.querySelector('.no-results');
            if (noResults) {
                noResults.remove();
            }
        }
    }

    // Get all loaded prompts
    getAllPrompts() {
        return this.prompts || [];
    }

    // Reset form to add mode
    resetToAddMode() {
        this.editingPrompt = null;
        
        const formTitle = document.querySelector('#add-prompt h2');
        const submitBtn = document.querySelector('.submit-btn');
        
        formTitle.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Prompt';
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Prompt';
    }
}

export default PromptManager;