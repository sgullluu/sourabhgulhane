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

    // Check if token has expired
    if (config.isTokenExpired() && config.repoOwner && config.repoName) {
        showTokenExpiredMessage();
    }
    
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
    });

    // Save configuration
    const saveConfigBtn = document.getElementById('save-config');
    saveConfigBtn.addEventListener('click', handleSaveConfiguration);

    // Prompt form submission
    const promptForm = document.getElementById('prompt-form');
    promptForm.addEventListener('submit', handlePromptSubmission);

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
}

// Load existing configuration into the UI
function loadConfigurationUI() {
    if (config.isConfigured()) {
        document.getElementById('github-token').value = config.githubToken;
        document.getElementById('repo-owner').value = config.repoOwner;
        document.getElementById('repo-name').value = config.repoName;
        document.getElementById('branch-name').value = config.branchName;
    }
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
        
        // Ensure prompts folder exists
        const folderResult = await promptManager.ensurePromptsFolder();
        if (folderResult.success) {
            // Load prompts
            await loadInitialPrompts();
            
            // Hide configuration panel
            document.getElementById('config-panel').classList.remove('show');
        } else {
            promptManager.showStatus(`Warning: Could not create prompts folder: ${folderResult.error}`, 'error');
        }
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
    const rating = parseInt(document.getElementById('prompt-rating').value);
    const attachmentFile = document.getElementById('prompt-attachment').files[0];

    // Validate form data
    const validation = promptManager.validatePromptData(name, promptText, rating);
    
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
            rating,
            attachment
        };

        // Save to GitHub
        const result = await promptManager.savePrompt(promptData);

        if (result.success) {
            promptManager.showStatus('Prompt saved successfully!', 'success');
            
            // Reset form
            document.getElementById('prompt-form').reset();
            
            // Refresh prompts display
            await promptManager.refreshPrompts();
        } else {
            promptManager.showStatus(`Error saving prompt: ${result.error}`, 'error');
        }

    } catch (error) {
        console.error('Error submitting prompt:', error);
        promptManager.showStatus(`Unexpected error: ${error.message}`, 'error');
    }
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
            <p><strong>Security Features:</strong></p>
            <ul>
                <li>✓ Token stored encrypted in session storage</li>
                <li>✓ Automatic expiration after 2 hours</li>
                <li>✓ Token cleared when browser closes</li>
                <li>✓ No persistent storage of sensitive data</li>
            </ul>
        </div>
    `;
}

// Show token expired message
function showTokenExpiredMessage() {
    const container = document.getElementById('prompts-container');
    container.innerHTML = `
        <div class="config-help-card" style="border-left-color: #f39c12;">
            <h3><i class="fas fa-exclamation-triangle" style="color: #f39c12;"></i> Session Expired</h3>
            <p>Your GitHub token has expired for security reasons.</p>
            <p>Please click the Configuration button <i class="fas fa-cog"></i> and re-enter your GitHub token to continue.</p>
            <p><strong>Why did this happen?</strong></p>
            <ul>
                <li>Enhanced security: Tokens automatically expire after 2 hours</li>
                <li>Session-based storage: Tokens are cleared when browser closes</li>
                <li>Encrypted storage: Tokens are encrypted before being stored</li>
            </ul>
            <p><em>This is a security feature to protect your GitHub access token.</em></p>
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