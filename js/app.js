// Main application logic for the Personal Prompt Manager
import PromptManager from './prompt-manager.js';
import Config from '../config/config.js';

// Global instances
let promptManager;
let config;

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('App initialization started');
    // Initialize managers
    promptManager = new PromptManager();
    config = new Config();
    console.log('Managers initialized');

    // Make promptManager globally available for inline onclick handlers
    window.promptManager = promptManager;

    // Setup event listeners
    await setupEventListeners();

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
async function setupEventListeners() {
    console.log('Setting up event listeners');
    // Configuration toggle
    const configToggle = document.getElementById('config-toggle');
    const configPanel = document.getElementById('config-panel');
    console.log('Config elements found:', !!configToggle, !!configPanel);
    
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
    await setupCategoryManagement();
}

// Setup tab navigation functionality
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const targetTab = button.getAttribute('data-tab');
            await switchToTab(targetTab);
        });
    });
}

// Switch to a specific tab
async function switchToTab(targetTab) {
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
        
        // Handle tab-specific actions
        if (targetTab === 'saved-prompts' && config.isConfigured()) {
            promptManager.refreshPrompts();
            // Ensure category filter is populated
            await populateCategoryFilter();
        } else if (targetTab === 'dashboard') {
            await updateDashboard();
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
            
            // Apply combined filters
            applyAllFilters();
        });
    });
    
    // Setup advanced filters
    setupAdvancedFilters();
}

// Setup advanced filter functionality
function setupAdvancedFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const ratingFilter = document.getElementById('rating-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    // Populate category filter dropdown
    populateCategoryFilter();
    
    // Add event listeners for filter changes
    categoryFilter.addEventListener('change', applyAllFilters);
    ratingFilter.addEventListener('change', applyAllFilters);
    
    // Clear filters functionality
    clearFiltersBtn.addEventListener('click', clearAllFilters);
}

// Populate category filter dropdown
async function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    try {
        const categories = await config.getCategories();
        
        // Clear existing options except the first one
        categoryFilter.innerHTML = '<option value="">All Categories</option>';
        
        // Add category options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating category filter:', error);
    }
}

// Apply all active filters
function applyAllFilters() {
    const activeTab = document.querySelector('.filter-tab.active');
    const verificationFilter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
    const categoryFilter = document.getElementById('category-filter').value;
    const ratingFilter = document.getElementById('rating-filter').value;
    
    const filters = {
        verification: verificationFilter,
        category: categoryFilter,
        minRating: ratingFilter ? parseInt(ratingFilter) : null
    };
    
    promptManager.filterPrompts(filters);
}

// Clear all filters
function clearAllFilters() {
    // Reset verification filter to "All"
    const allTab = document.querySelector('.filter-tab[data-filter="all"]');
    if (allTab) {
        document.querySelectorAll('.filter-tab').forEach(btn => btn.classList.remove('active'));
        allTab.classList.add('active');
    }
    
    // Reset dropdown filters
    document.getElementById('category-filter').value = '';
    document.getElementById('rating-filter').value = '';
    
    // Apply filters (which will show all prompts)
    applyAllFilters();
}

// Setup category management
async function setupCategoryManagement() {
    // Load categories on page load
    await loadCategoriesDisplay();
    await populateCategoryDropdown();

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
async function handleAddCategory() {
    const input = document.getElementById('new-category-input');
    const categoryName = input.value.trim();
    
    if (!categoryName) {
        promptManager.showStatus('Please enter a category name', 'error');
        return;
    }
    
    try {
        promptManager.showStatus('Adding category...', 'info');
        await config.addCategory(categoryName);
        input.value = '';
        await loadCategoriesDisplay();
        await populateCategoryDropdown();
        promptManager.showStatus(`Category "${categoryName}" added successfully!`, 'success');
    } catch (error) {
        promptManager.showStatus(`Error: ${error.message}`, 'error');
    }
}

// Handle removing category
async function handleRemoveCategory(categoryName) {
    if (!confirm(`Are you sure you want to remove the category "${categoryName}"?\n\nNote: Existing prompts with this category will keep their category, but you won't be able to select it for new prompts.`)) {
        return;
    }

    try {
        promptManager.showStatus('Removing category...', 'info');
        await config.removeCategory(categoryName);
        await loadCategoriesDisplay();
        await populateCategoryDropdown();
        promptManager.showStatus(`Category "${categoryName}" removed successfully!`, 'success');
    } catch (error) {
        promptManager.showStatus(`Error: ${error.message}`, 'error');
    }
}

// Load and display categories in management panel
async function loadCategoriesDisplay() {
    const categoriesList = document.getElementById('categories-list');
    
    try {
        const categories = await config.getCategories();

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
    } catch (error) {
        categoriesList.innerHTML = '<p class="no-categories">Error loading categories. Please check your GitHub configuration.</p>';
        console.error('Error loading categories display:', error);
    }
}

// Populate category dropdown in add prompt form
async function populateCategoryDropdown() {
    const categorySelect = document.getElementById('prompt-category');
    
    try {
        const categories = await config.getCategories();

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
        
        // Also update the filter dropdown if it exists
        const categoryFilterExists = document.getElementById('category-filter');
        if (categoryFilterExists) {
            await populateCategoryFilter();
        }
    } catch (error) {
        console.error('Error populating category dropdown:', error);
        // Fallback to default categories
        const defaultCategories = ['DEFAULT', 'CODING', 'WRITING'];
        categorySelect.innerHTML = '';
        defaultCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
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
            
            // Switch to dashboard to see updated statistics
            await switchToTab('dashboard');
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
        
        // Update dashboard with loaded data
        await updateDashboard();
        
        if (result.prompts.length > 0) {
            promptManager.showStatus(`Loaded ${result.prompts.length} prompt(s)`, 'success');
        }
    } else {
        promptManager.showStatus(`Error loading prompts: ${result.error}`, 'error');
        // Show dashboard even if loading failed
        await updateDashboard();
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

// Dashboard functionality
async function updateDashboard() {
    if (!config.isConfigured()) {
        showDashboardNotConfigured();
        return;
    }
    
    const prompts = promptManager.getAllPrompts();
    await updateDashboardStats(prompts);
    updateRecentActivity(prompts);
    await updateCategoryOverview(prompts);
    updateTopRatedPrompts(prompts);
}

async function updateDashboardStats(prompts) {
    const totalCount = prompts.length;
    const verifiedCount = prompts.filter(p => p.verified).length;
    const categories = await config.getCategories();
    const avgRating = totalCount > 0 
        ? (prompts.reduce((sum, p) => sum + (p.rating || 0), 0) / totalCount).toFixed(1)
        : 0.0;
    
    document.getElementById('total-prompts-count').textContent = totalCount;
    document.getElementById('verified-prompts-count').textContent = verifiedCount;
    document.getElementById('categories-count').textContent = categories.length;
    document.getElementById('avg-rating').textContent = avgRating;
}

function updateRecentActivity(prompts) {
    const container = document.getElementById('recent-activity');
    
    if (prompts.length === 0) {
        container.innerHTML = '<div class="no-activity">No prompts created yet</div>';
        return;
    }
    
    // Sort by creation date (newest first) and take first 5
    const recentPrompts = [...prompts]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);
    
    const activityHtml = recentPrompts.map(prompt => {
        const timeAgo = getTimeAgo(prompt.createdAt || Date.now());
        const actionIcon = prompt.verified ? 'check-circle' : 'plus-circle';
        const actionText = prompt.verified ? 'Verified prompt' : 'Created prompt';
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${actionIcon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${actionText}: "${prompt.name}"</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = activityHtml;
}

async function updateCategoryOverview(prompts) {
    const container = document.getElementById('category-overview');
    const categories = await config.getCategories();
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="no-categories-dashboard">No categories configured</div>';
        return;
    }
    
    // Count prompts per category
    const categoryStats = categories.map(category => {
        const count = prompts.filter(p => p.category === category).length;
        return { name: category, count, color: getCategoryColor(category) };
    }).filter(stat => stat.count > 0);
    
    if (categoryStats.length === 0) {
        container.innerHTML = '<div class="no-categories-dashboard">No prompts in any category yet</div>';
        return;
    }
    
    const statsHtml = categoryStats.map(stat => `
        <div class="category-stat">
            <div class="category-stat-info">
                <div class="category-color" style="background-color: ${stat.color}"></div>
                <span class="category-stat-name">${stat.name}</span>
            </div>
            <div class="category-stat-count">${stat.count}</div>
        </div>
    `).join('');
    
    container.innerHTML = statsHtml;
}

function updateTopRatedPrompts(prompts) {
    const container = document.getElementById('top-rated-prompts');
    
    // Filter prompts with ratings and sort by rating (highest first)
    const ratedPrompts = prompts
        .filter(p => p.rating && p.rating > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
    
    if (ratedPrompts.length === 0) {
        container.innerHTML = '<div class="no-rated-prompts">No rated prompts yet</div>';
        return;
    }
    
    const topRatedHtml = ratedPrompts.map(prompt => {
        const stars = Array(5).fill().map((_, i) => {
            const filled = i < (prompt.rating || 0);
            return `<i class="fas fa-star ${filled ? 'filled' : ''}"></i>`;
        }).join('');
        
        return `
            <div class="top-rated-item">
                <div class="top-rated-info">
                    <div class="top-rated-title">${prompt.name}</div>
                    <div class="top-rated-category">${prompt.category || 'DEFAULT'}</div>
                </div>
                <div class="top-rated-rating">
                    <div class="rating-stars">${stars}</div>
                    <span class="rating-value">${prompt.rating}/5</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = topRatedHtml;
}

function showDashboardNotConfigured() {
    const dashboardSection = document.querySelector('#dashboard .dashboard-section');
    dashboardSection.innerHTML = `
        <h2><i class="fas fa-tachometer-alt"></i> Dashboard</h2>
        <div style="text-align: center; padding: 3rem; background: #f8f9fa; border-radius: 12px; margin: 2rem 0;">
            <i class="fas fa-cog" style="font-size: 3rem; color: #6c757d; margin-bottom: 1rem;"></i>
            <h3 style="color: #495057; margin-bottom: 1rem;">Configuration Required</h3>
            <p style="color: #6c757d; margin-bottom: 2rem;">Please configure your GitHub settings to view dashboard analytics.</p>
            <button onclick="document.getElementById('config-toggle').click()" class="quick-action-btn" style="display: inline-flex;">
                <i class="fas fa-cog"></i>
                <span>Configure Now</span>
            </button>
        </div>
    `;
}

function getCategoryColor(category) {
    const colors = {
        'DEFAULT': '#6c757d',
        'CODING': '#28a745',
        'WRITING': '#17a2b8',
        'MARKETING': '#e83e8c',
        'ANALYSIS': '#6f42c1',
        'CREATIVE': '#fd7e14',
        'BUSINESS': '#ffc107',
        'EDUCATION': '#20c997',
        'RESEARCH': '#6610f2',
        'PRODUCTIVITY': '#e74c3c'
    };
    return colors[category] || '#667eea';
}

function getTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

// Export functionality
function exportPrompts() {
    const prompts = promptManager.getAllPrompts();
    const categories = config.getCategories();
    
    const exportData = {
        metadata: {
            exportDate: new Date().toISOString(),
            version: '1.0',
            totalPrompts: prompts.length,
            totalCategories: categories.length
        },
        categories: categories,
        prompts: prompts.map(prompt => ({
            ...prompt,
            // Add export timestamp
            exportedAt: new Date().toISOString()
        }))
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `prompt-manager-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    promptManager.showStatus('Data exported successfully!', 'success');
}

// Make functions globally available
window.switchToTab = switchToTab;
window.exportPrompts = exportPrompts;
window.updateDashboard = updateDashboard;

document.head.insertAdjacentHTML('beforeend', additionalStyles);