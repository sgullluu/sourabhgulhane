// Main application logic for the Personal Prompt Manager
import PromptManager from './prompt-manager.js';
import Config from '../config/config.js';

// Global instances
let promptManager;
let config;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize managers
    promptManager = new PromptManager();
    config = new Config();

    // Make promptManager globally available for inline onclick handlers
    window.promptManager = promptManager;

    // Setup event listeners
    setupEventListeners();

    // Load configuration UI
    loadConfigurationUI();
    
    // If configured, load prompts
    if (config.isConfigured()) {
        await loadInitialPrompts();
    } else {
        showConfigurationHelp();
    }
});

// Setup all event listeners
function setupEventListeners() {
    // Configuration toggle
    const configToggle = document.getElementById('config-toggle');
    const configPanel = document.getElementById('config-panel');
    
    configToggle.addEventListener('click', () => {
        configPanel.classList.toggle('show');
        // Hide category panel if open
        document.getElementById('category-panel').classList.remove('show');
    });

    // Category management toggle
    const categoryToggle = document.getElementById('category-toggle');
    const categoryPanel = document.getElementById('category-panel');
    
    categoryToggle.addEventListener('click', () => {
        categoryPanel.classList.toggle('show');
        // Hide config panel if open
        configPanel.classList.remove('show');
    });

    // Save configuration
    const saveConfigBtn = document.getElementById('save-config');
    saveConfigBtn.addEventListener('click', handleSaveConfiguration);

    // Prompt form submission
    const promptForm = document.getElementById('prompt-form');
    promptForm.addEventListener('submit', handlePromptSubmission);

    // File attachment preview
    const fileInput = document.getElementById('prompt-attachment');
    fileInput.addEventListener('change', handleFileSelection);

    // Refresh prompts button
    const refreshBtn = document.getElementById('refresh-prompts');
    refreshBtn.addEventListener('click', () => {
        promptManager.refreshPrompts();
    });

    // Handle enter key in configuration inputs
    const configInputs = document.querySelectorAll('#config-panel input');
    configInputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSaveConfiguration();
            }
        });
    });

    // Tab navigation
    setupTabNavigation();

    // Filter tabs for saved prompts
    setupFilterTabs();

    // Category management
    setupCategoryManagement();
}

// Setup tab navigation functionality
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            switchToTab(targetTab);
        });
    });
}

// Switch to a specific tab
function switchToTab(targetTab) {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Remove active class from all buttons and panes
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabPanes.forEach(pane => pane.classList.remove('active'));
    
    // Add active class to target button and pane
    const targetButton = document.querySelector(`[data-tab="${targetTab}"]`);
    const targetPane = document.getElementById(targetTab);
    
    if (targetButton && targetPane) {
        targetButton.classList.add('active');
        targetPane.classList.add('active');
        
        // If switching to saved prompts tab, refresh the prompts
        if (targetTab === 'saved-prompts' && config.isConfigured()) {
            promptManager.refreshPrompts();
        }
    }
}

// Setup filter tabs for saved prompts
function setupFilterTabs() {
    const filterButtons = document.querySelectorAll('.filter-tab');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Remove active class from all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Filter prompts based on selection
            promptManager.filterPrompts(filter);
        });
    });
}

// Setup category management
function setupCategoryManagement() {
    // Load categories on page load
    loadCategoriesDisplay();
    populateCategoryDropdown();

    // Add category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    addCategoryBtn.addEventListener('click', handleAddCategory);

    // Enter key support for adding categories
    const categoryInput = document.getElementById('new-category-input');
    categoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleAddCategory();
        }
    });

    // Input validation
    categoryInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase();
        // Only allow letters, spaces, and limit to 3 words
        value = value.replace(/[^A-Z\s]/g, '');
        const words = value.trim().split(/\s+/).filter(word => word.length > 0);
        if (words.length > 3) {
            value = words.slice(0, 3).join(' ');
        }
        e.target.value = value;
    });
}

// Handle adding new category
function handleAddCategory() {
    const input = document.getElementById('new-category-input');
    const categoryName = input.value.trim();

    if (!categoryName) {
        promptManager.showStatus('Please enter a category name', 'error');
        return;
    }

    try {
        config.addCategory(categoryName);
        input.value = '';
        loadCategoriesDisplay();
        populateCategoryDropdown();
        promptManager.showStatus(`Category "${categoryName}" added successfully!`, 'success');
    } catch (error) {
        promptManager.showStatus(`Error: ${error.message}`, 'error');
    }
}

// Handle removing category
function handleRemoveCategory(categoryName) {
    if (!confirm(`Are you sure you want to remove the category "${categoryName}"?\n\nNote: Existing prompts with this category will keep their category, but you won't be able to select it for new prompts.`)) {
        return;
    }

    try {
        config.removeCategory(categoryName);
        loadCategoriesDisplay();
        populateCategoryDropdown();
        promptManager.showStatus(`Category "${categoryName}" removed successfully!`, 'success');
    } catch (error) {
        promptManager.showStatus(`Error: ${error.message}`, 'error');
    }
}

// Load and display categories in management panel
function loadCategoriesDisplay() {
    const categoriesList = document.getElementById('categories-list');
    const categories = config.getCategories();

    if (categories.length === 0) {
        categoriesList.innerHTML = '<p class="no-categories">No categories found.</p>';
        return;
    }

    const categoriesHtml = categories.map(category => {
        const isDefault = category === 'DEFAULT';
        return `
            <div class="category-item ${isDefault ? 'default-category' : ''}">
                <div class="category-info">
                    <span class="category-name">${category}</span>
                    ${isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                ${!isDefault ? `
                    <button class="remove-category-btn" onclick="handleRemoveCategory('${category}')" title="Remove category">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
    }).join('');

    categoriesList.innerHTML = categoriesHtml;
}

// Populate category dropdown in add prompt form
function populateCategoryDropdown() {
    const categorySelect = document.getElementById('prompt-category');
    const categories = config.getCategories();

    // Clear existing options
    categorySelect.innerHTML = '';

    // Add categories as options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        if (category === 'DEFAULT') {
            option.selected = true;
        }
        categorySelect.appendChild(option);
    });
}

// Make handleRemoveCategory globally available
window.handleRemoveCategory = handleRemoveCategory;

// Load existing configuration into the UI
function loadConfigurationUI() {
    if (config.isConfigured()) {
        document.getElementById('github-token').value = config.githubToken;
        document.getElementById('repo-owner').value = config.repoOwner;
        document.getElementById('repo-name').value = config.repoName;
        document.getElementById('branch-name').value = config.branchName;
    }
    
    // Load categories display and dropdown
    loadCategoriesDisplay();
    populateCategoryDropdown();
}

// Handle configuration saving
async function handleSaveConfiguration() {
    const token = document.getElementById('github-token').value.trim();
    const owner = document.getElementById('repo-owner').value.trim();
    const repo = document.getElementById('repo-name').value.trim();
    const branch = document.getElementById('branch-name').value.trim() || 'main';

    if (!token || !owner || !repo) {
        promptManager.showStatus('Please fill in all configuration fields', 'error');
        return;
    }

    // Save configuration
    config.save(token, owner, repo, branch);
    
    // Refresh the local config instance
    config = new Config();
    
    // Update the prompt manager's GitHub API instance with new configuration
    promptManager.githubAPI.refreshConfig();
    
    // Clear any cached prompts since we're switching repositories
    promptManager.prompts = [];
    
    // Clear the UI to show we're loading new data
    document.getElementById('prompts-container').innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Switching to new repository...</div>';

    console.log('Configuration updated. New settings:', {
        owner: config.repoOwner,
        repo: config.repoName,
        branch: config.branchName,
        apiUrl: config.getApiBaseUrl()
    });

    promptManager.showStatus('Testing GitHub connection...', 'info');

    // Test the connection
    const connectionTest = await promptManager.testGitHubConnection();
    
    if (connectionTest.success) {
        promptManager.showStatus(`Successfully connected to ${connectionTest.data.repository}!`, 'success');
        
        // Ensure prompts folder exists (but don't fail if it already exists)
        const folderResult = await promptManager.ensurePromptsFolder();
        if (!folderResult.success) {
            console.warn('Folder creation issue:', folderResult.error);
            // Continue anyway - the folder might already exist
        }
        
        // Load prompts regardless of folder creation result
        await loadInitialPrompts();
        
        // Hide configuration panel
        document.getElementById('config-panel').classList.remove('show');
    } else {
        promptManager.showStatus(`Connection failed: ${connectionTest.error}`, 'error');
    }
}

// Handle prompt form submission
async function handlePromptSubmission(event) {
    event.preventDefault();

    if (!config.isConfigured()) {
        promptManager.showStatus('Please configure GitHub settings first', 'error');
        return;
    }

    // Get form data
    const name = document.getElementById('prompt-name').value.trim();
    const promptText = document.getElementById('prompt-text').value.trim();
    const category = document.getElementById('prompt-category').value || 'DEFAULT';
    const attachmentFile = document.getElementById('prompt-attachment').files[0];

    // Validate form data
    const validation = promptManager.validatePromptData(name, promptText);
    
    if (!validation.isValid) {
        promptManager.showStatus(`Validation error: ${validation.errors.join(', ')}`, 'error');
        return;
    }

    // Show saving status
    promptManager.showStatus('Saving prompt...', 'info');

    try {
        // Process attachment if present
        let attachment = null;
        if (attachmentFile) {
            attachment = await promptManager.githubAPI.processAttachment(attachmentFile);
        }

        // Create prompt data
        const promptData = {
            name,
            promptText,
            category,
            rating: null, // Will be set later in saved prompts
            verified: false, // Default to unverified
            attachment
        };

        // Check if we're editing an existing prompt
        let result;
        if (promptManager.editingPrompt) {
            // Update existing prompt
            const existingPrompt = promptManager.prompts.find(p => p.filename === promptManager.editingPrompt.filename);
            if (existingPrompt) {
                // Preserve existing rating and verification status
                promptData.rating = existingPrompt.rating;
                promptData.verified = existingPrompt.verified;
                promptData.id = existingPrompt.id;
                promptData.createdAt = existingPrompt.createdAt;
            }
            
            result = await promptManager.githubAPI.updatePrompt(
                promptManager.editingPrompt.filename, 
                promptManager.editingPrompt.sha, 
                promptData
            );
        } else {
            // Save new prompt
            result = await promptManager.savePrompt(promptData);
        }

        if (result.success) {
            const isEditing = promptManager.editingPrompt !== null;
            promptManager.showStatus(`Prompt ${isEditing ? 'updated' : 'saved'} successfully!`, 'success');
            
            // Reset form
            document.getElementById('prompt-form').reset();
            
            // Remove file preview if exists
            const existingPreview = document.querySelector('.attachment-preview-form');
            if (existingPreview) {
                existingPreview.remove();
            }
            
            // Reset to add mode
            promptManager.resetToAddMode();
            
            // Refresh prompts display
            await promptManager.refreshPrompts();
            
            // Switch to saved prompts tab
            switchToTab('saved-prompts');
        } else {
            promptManager.showStatus(`Error ${promptManager.editingPrompt ? 'updating' : 'saving'} prompt: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Error submitting prompt:', error);
        promptManager.showStatus(`Unexpected error: ${error.message}`, 'error');
    }
}

// Handle file selection and preview
function handleFileSelection(event) {
    const file = event.target.files[0];
    const existingPreview = document.querySelector('.attachment-preview-form');
    
    // Remove existing preview
    if (existingPreview) {
        existingPreview.remove();
    }
    
    if (!file) return;
    
    // Check file size (limit to 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        promptManager.showStatus('File size too large. Maximum size is 10MB.', 'error');
        event.target.value = '';
        return;
    }
    
    // Create preview container
    const preview = document.createElement('div');
    preview.className = 'attachment-preview-form';
    preview.style.marginTop = '1rem';
    preview.style.padding = '1rem';
    preview.style.border = '1px solid #e1e5e9';
    preview.style.borderRadius = '8px';
    preview.style.background = '#f8f9fa';
    
    const isImage = file.type.startsWith('image/');
    
    if (isImage) {
        // Image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `
                <div class="preview-header">
                    <i class="fas fa-image"></i>
                    <strong>${file.name}</strong>
                    <span class="file-size">${formatFileSize(file.size)}</span>
                </div>
                <div class="image-preview" style="text-align: center; margin-top: 0.5rem;">
                    <img src="${e.target.result}" alt="${file.name}" style="max-width: 100%; max-height: 200px; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                </div>
            `;
        };
        reader.readAsDataURL(file);
    } else {
        // File preview
        preview.innerHTML = `
            <div class="preview-header">
                <i class="fas fa-paperclip"></i>
                <strong>${file.name}</strong>
                <span class="file-size">${formatFileSize(file.size)}</span>
                <span class="file-type">${getFileExtension(file.name)}</span>
            </div>
        `;
    }
    
    // Insert preview after the file input
    event.target.parentNode.appendChild(preview);
}

// Helper functions for file handling
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(filename) {
    return filename.split('.').pop().toUpperCase();
}

// Load initial prompts
async function loadInitialPrompts() {
    promptManager.showLoading(true);
    
    const result = await promptManager.loadPrompts();
    
    promptManager.showLoading(false);

    if (result.success) {
        promptManager.displayPrompts(result.prompts);
        
        if (result.prompts.length > 0) {
            promptManager.showStatus(`Loaded ${result.prompts.length} prompt(s)`, 'success');
        }
    } else {
        promptManager.showStatus(`Error loading prompts: ${result.error}`, 'error');
    }
}

// Show configuration help
function showConfigurationHelp() {
    const container = document.getElementById('prompts-container');
    container.innerHTML = `
        <div class="config-help-card">
            <h3><i class="fas fa-info-circle"></i> Welcome to Personal Prompt Manager!</h3>
            <p>To get started, you need to configure your GitHub settings:</p>
            <ol>
                <li><strong>Create a GitHub Personal Access Token</strong>:
                    <ul>
                        <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                        <li>Generate a new token with <code>repo</code> permissions</li>
                    </ul>
                </li>
                <li><strong>Click the Configuration button above</strong> and enter:
                    <ul>
                        <li>Your Personal Access Token</li>
                        <li>Your GitHub username</li>
                        <li>Your repository name</li>
                    </ul>
                </li>
                <li><strong>Save the configuration</strong> and start managing your prompts!</li>
            </ol>
            <p><strong>Note:</strong> Make sure your repository exists and is accessible with the provided token.</p>
            <p><strong>Your token will be stored permanently in your browser for convenience.</strong></p>
        </div>
    `;
}

// Add some additional styles for the help card
const additionalStyles = `
    <style>
        .config-help-card {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            border-radius: 15px;
            padding: 2rem;
            border-left: 4px solid #667eea;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .config-help-card h3 {
            color: #333;
            margin-bottom: 1rem;
        }
        
        .config-help-card ol, .config-help-card ul {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }
        
        .config-help-card li {
            margin-bottom: 0.5rem;
        }
        
        .config-help-card code {
            background: rgba(102, 126, 234, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
        }
        
        .no-prompts {
            text-align: center;
            padding: 3rem;
            color: #666;
        }
        
        .no-prompts i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: #667eea;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);