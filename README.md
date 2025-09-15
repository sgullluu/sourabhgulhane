# Personal Prompt Manager 🧠

A comprehensive web-based application for managing and organizing your AI prompts using GitHub as the backend storage. This modern, feature-rich application provides a complete solution for prompt management with advanced categorization, filtering, and analytics capabilities.

## ✨ Core Features

### 🏠 **Dashboard Analytics**
- **Real-time Statistics**: Total prompts, verified prompts, categories count, and average rating
- **Recent Activity**: Track your latest prompt creations and modifications
- **Category Overview**: Visual breakdown of prompts by category with color-coded statistics
- **Top Rated Prompts**: Quick access to your highest-rated prompts
- **Quick Actions**: One-click access to common tasks (add prompt, manage categories, refresh data, export)

### 📝 **Advanced Prompt Management**
- **Three-Tab Interface**: Dashboard, Add Prompt, and Saved Prompts for organized workflow
- **Rich Prompt Creation**: Name, text, category selection, and file attachments
- **Edit Functionality**: Modify existing prompts with form pre-population
- **Collapsible Cards**: Clean, expandable prompt display showing titles initially
- **One-Click Copy**: Copy prompt text to clipboard with modern Clipboard API
- **Verification System**: Mark prompts as verified/unverified with visual indicators
- **Interactive Rating**: 5-star rating system with hover effects and visual feedback

### 🗂️ **Smart Categorization & Filtering**
- **Dynamic Categories**: 
  - 10 default categories (DEFAULT, CODING, WRITING, MARKETING, etc.)
  - Add/remove custom categories with validation (max 3 words, capitals)
  - Categories stored in GitHub for cross-device sync
- **Advanced Filtering**:
  - Verification status (All/Verified/Unverified)
  - Category-based filtering
  - Rating-based filtering (1+ to 5+ stars)
  - Clear all filters functionality
- **Category Grouping**: Prompts organized by category with color-coded headers

### 📁 **GitHub Integration & Storage**
- **Secure Storage**: All data stored in your GitHub repository
- **Categories Sync**: Categories stored in `config/categories.json` for cross-device access
- **File Attachments**: Support for documents, images, and various file types (up to 10MB)
- **Data Export**: Complete JSON export of all prompts and categories
- **Version Control**: Leverage Git history for prompt versioning

### 📱 **Modern User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Touch-Friendly**: Enhanced touch targets and interactions for mobile users
- **Progressive Enhancement**: Fallback support for older browsers
- **Smooth Animations**: Modern CSS transitions and hover effects
- **Visual Feedback**: Status messages, loading indicators, and confirmation dialogs

## 📁 Project Structure

```
prompt-manager/
├── index.html              # Main application entry point
├── README.md              # Complete documentation
├── config/
│   ├── config.js          # Configuration management & category handling
│   └── categories.json    # Category definitions (synced via GitHub)
├── css/
│   └── styles.css         # Complete styling with responsive design
├── js/
│   ├── app.js            # Main application logic & dashboard
│   ├── github-api.js     # GitHub REST API integration
│   └── prompt-manager.js # Prompt CRUD operations & UI management
├── prompts/              # Individual prompt files (JSON)
│   ├── example_prompt_1.json
│   └── example_prompt_2.json
└── assets/               # Static assets (if any)
```

## 🎯 Use Cases

### **For Developers**
- Store and organize code generation prompts
- Categorize by programming language or framework
- Rate effectiveness of different coding prompts
- Share prompt collections via GitHub

### **For Content Creators**
- Manage writing prompts and templates
- Organize by content type (blog, social media, marketing)
- Track performance with ratings and verification
- Export prompts for team collaboration

### **For AI Researchers**
- Collect and categorize experimental prompts
- Track prompt effectiveness with detailed analytics
- Share research prompts via version control
- Maintain prompt evolution history

### **For Teams & Organizations**
- Centralized prompt management via GitHub
- Cross-device synchronization of categories
- Collaborative prompt development
- Standardized prompt templates

## 🚀 Quick Start Guide

### 1. Repository Setup

1. **Create Repository**: Create a new GitHub repository or fork this one
2. **Access Level**: Ensure repository is public or you have appropriate access
3. **Deploy Files**: 
   - Clone/download this repository
   - Or deploy directly to GitHub Pages for instant access

### 2. GitHub Personal Access Token

1. Navigate to **GitHub Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **"Generate new token (classic)"**
3. Token Configuration:
   - **Name**: "Prompt Manager" (or your preferred name)
   - **Scopes**: Select `repo` (full repository access)
   - **Expiration**: Choose based on your security preferences
4. **Save Token**: Copy and securely store the generated token

### 3. Initial Configuration

1. **Open Application**: Launch `index.html` in your browser
2. **Configure GitHub**:
   - Click **"Configuration"** button
   - Enter **GitHub Personal Access Token**
   - Enter **GitHub Username**
   - Enter **Repository Name**
   - Specify **Branch Name** (default: main)
3. **Save & Test**: Click "Save Configuration" to test connection
4. **Auto-Setup**: App will automatically create required folders

### 4. Category Management Setup

1. **Access Categories**: Click **"Manage Categories"** button
2. **Default Categories**: 10 pre-configured categories available
3. **Custom Categories**: 
   - Add new categories (max 3 words, capitals)
   - Remove unused categories (except DEFAULT)
4. **GitHub Sync**: Categories automatically sync across devices via `config/categories.json`

### 5. Deployment Options

#### **Option A: GitHub Pages (Recommended)**
1. Push all files to your GitHub repository
2. Repository **Settings** → **Pages**
3. Source: **"Deploy from a branch"**
4. Branch: **"main"** / Path: **"/ (root)"**
5. Access at: `https://yourusername.github.io/your-repo-name`

#### **Option B: Local Development**
1. Use any local web server (Python, Node.js, VS Code Live Server)
2. Ensure CORS policies allow GitHub API access
3. All data persists in your GitHub repository

## 📖 Detailed Usage Guide

### **Dashboard Overview**
- **Statistics Cards**: Monitor your prompt collection growth
- **Recent Activity**: Track latest prompt additions and updates  
- **Category Distribution**: Visual breakdown of prompt organization
- **Top Rated**: Quick access to your most effective prompts
- **Quick Actions**: One-click access to common operations

### **Creating Prompts**
1. **Navigate**: Switch to "Add Prompt" tab
2. **Form Fields**:
   - **Name**: Descriptive, searchable title
   - **Prompt Text**: Your actual AI prompt content
   - **Category**: Select from dropdown (managed via Categories panel)
   - **Attachment**: Optional files (documents, images, up to 10MB)
3. **Save**: Prompts automatically get timestamp and unique filename
4. **Auto-Navigate**: Returns to Dashboard after successful save

### **Managing Existing Prompts**
- **View All**: "Saved Prompts" tab shows organized, collapsible cards
- **Filter Options**:
  - **Status**: All, Verified, Unverified
  - **Category**: Select specific categories
  - **Rating**: Filter by minimum star rating
- **Individual Actions**:
  - **Expand/Collapse**: Click title to view full content
  - **Copy**: One-click copy to clipboard
  - **Edit**: Pre-populates Add Prompt form
  - **Rate**: Interactive 5-star system
  - **Verify**: Toggle verification status
  - **Delete**: Remove with confirmation

### **Category Management**
- **Dynamic System**: Add/remove categories as needed
- **Validation**: Enforces naming conventions (capitals, max 3 words)
- **Cross-Device Sync**: Categories stored in GitHub for universal access
- **Protected Categories**: DEFAULT category cannot be removed
- **Real-Time Updates**: Category changes immediately reflect in dropdowns

### **Data Export & Backup**
- **Complete Export**: JSON file with all prompts and metadata
- **Structured Format**: Includes categories, timestamps, ratings
- **Portable**: Easy import into other systems
- **Version Control**: GitHub provides automatic versioning and history

### File Structure

When you save a prompt, it creates a JSON file in your repository:

```
your-repo/
├── prompts/
│   ├── my_awesome_prompt.json
│   ├── another_prompt.json
│   └── .gitkeep
└── (your other files)
```

Each JSON file contains:
```json
{
  "id": "unique-id",
  "name": "My Awesome Prompt",
  "promptText": "You are a helpful assistant...",
  "rating": 5,
  "attachment": {
    "name": "example.txt",
    "type": "text/plain",
    "data": "data:text/plain;base64,..."
  },
  "createdAt": "2025-09-14T12:00:00.000Z",
  "updatedAt": "2025-09-14T12:00:00.000Z"
}
```

## 📊 Data Structure & Storage

### **GitHub Repository Structure**
```
your-repository/
├── config/
│   └── categories.json     # Category definitions (synced)
├── prompts/               # Individual prompt files
│   ├── prompt_1757860500000.json
│   ├── prompt_1757860600000.json
│   └── .gitkeep
└── (prompt-manager application files)
```

### **Prompt JSON Structure**
```json
{
  "id": "prompt_1757860500000",
  "name": "Code Review Assistant",
  "promptText": "You are an expert code reviewer...",
  "category": "CODING",
  "rating": 4,
  "verified": true,
  "attachment": {
    "name": "code_example.py", 
    "type": "text/plain",
    "size": 1024,
    "data": "data:text/plain;base64,..."
  },
  "createdAt": "2025-09-14T12:00:00.000Z",
  "updatedAt": "2025-09-14T12:30:00.000Z"
}
```

### **Categories JSON Structure**
```json
{
  "version": "1.0",
  "lastUpdated": "2025-09-14T12:00:00.000Z",
  "categories": [
    "DEFAULT", "CODING", "WRITING", "MARKETING",
    "ANALYSIS", "CREATIVE", "BUSINESS", "EDUCATION", 
    "RESEARCH", "PRODUCTIVITY", "AI TOOLS"
  ]
}
```

## 🛠️ Technical Architecture

### **Frontend Stack**
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript (ES6+)**: No external dependencies
- **Modular Architecture**: ES6 modules for clean code organization

### **Backend Integration**
- **GitHub REST API**: Direct integration for data persistence
- **Real-time Sync**: Immediate synchronization across devices
- **Version Control**: Automatic versioning through Git
- **File-based Storage**: JSON files for human-readable data

### **Browser Support**
- **Modern Browsers**: Chrome 61+, Firefox 60+, Safari 10.1+, Edge 79+
- **ES6 Modules**: Native module support required
- **Fetch API**: Modern HTTP client
- **LocalStorage**: Configuration caching

### **Security & Privacy**
- **Local Token Storage**: GitHub PAT stored in browser localStorage
- **HTTPS Only**: All API communications encrypted
- **Repository Scoped**: Access limited to specified repositories
- **No External Services**: Complete data control via GitHub

## 📱 Responsive Design Features

### **Mobile Optimization**
- **Touch-Friendly**: 44px+ touch targets for mobile interaction
- **Responsive Grid**: Adaptive layouts for all screen sizes
- **Swipe Gestures**: Natural mobile navigation patterns
- **Optimized Forms**: Mobile-friendly form inputs and validation

### **Desktop Enhancement**
- **Hover Effects**: Rich visual feedback for desktop users
- **Keyboard Navigation**: Full keyboard accessibility support
- **Multi-Column Layouts**: Efficient space utilization
- **Advanced Filtering**: Complex filter combinations

### **Progressive Enhancement**
- **Core Functionality First**: Basic features work without JavaScript
- **Enhanced Experience**: Rich interactions for capable browsers
- **Graceful Degradation**: Fallbacks for older browsers
- **Offline Tolerance**: Cached categories for offline browsing

## 🔧 Advanced Configuration

### **Custom GitHub Setup**
- **Private Repositories**: Full support for private prompt storage
- **Organization Repos**: Team-based prompt management
- **Branch Selection**: Use specific branches for prompt storage
- **Folder Customization**: Modify storage paths in configuration

### **Development Mode**
```bash
# Local development server (Python)
python -m http.server 8080

# Local development server (Node.js)
npx http-server -p 8080

# VS Code Live Server extension recommended
```

### **GitHub Pages Advanced Setup**
1. **Custom Domain**: Configure custom domain in repository settings
2. **HTTPS Enforcement**: Enable HTTPS for secure token transmission
3. **Branch Protection**: Protect main branch from accidental changes
4. **Deployment Keys**: Use deploy keys for enhanced security

## 🔍 Troubleshooting Guide

### **Common Issues**

#### **Configuration Problems**
- **"Configuration not set" error**: Verify all GitHub configuration fields are complete
- **"Invalid token" error**: Check token permissions and expiration
- **"Repository not found"**: Confirm repository name spelling and access rights

#### **Data Loading Issues**
- **"Failed to fetch prompts"**: Verify repository access and network connection
- **"Empty prompts display"**: Check if prompts folder exists in repository
- **"Categories not syncing"**: Ensure config/categories.json has proper permissions

#### **Performance Issues**
- **Slow loading**: Large attachment files may impact performance
- **Memory usage**: Consider archiving old prompts for better performance
- **Network timeouts**: Check internet connection and GitHub API status

### **Browser Compatibility**
- **ES6 Module Errors**: Update to modern browser version
- **LocalStorage Issues**: Clear browser cache and cookies
- **CORS Errors**: Serve application from web server, not file://

### **GitHub API Limits**
- **Rate Limiting**: 5000 requests per hour for authenticated requests
- **File Size Limits**: Individual files limited to 100MB
- **Repository Size**: Soft limit of 1GB per repository

## 📞 Support & Community

### **Getting Help**
1. **Browser Console**: Check for JavaScript errors and API responses
2. **GitHub Status**: Verify GitHub API availability
3. **Token Validation**: Test token with GitHub's API directly
4. **Network Debug**: Use browser dev tools to inspect network requests

### **Feature Requests & Bug Reports**
- Create issues in the GitHub repository
- Provide detailed reproduction steps
- Include browser and OS information
- Share relevant error messages

### **Contributing**
- Fork the repository
- Create feature branches
- Submit pull requests with clear descriptions
- Follow existing code style and patterns

## 📄 License & Credits

### **License**
This project is released under the **MIT License**, allowing free use, modification, and distribution.

### **Acknowledgments**
- **GitHub REST API**: For providing robust data storage capabilities
- **FontAwesome**: For comprehensive icon library
- **Modern Web Standards**: CSS Grid, Flexbox, ES6 Modules
- **Community Feedback**: User suggestions and bug reports

---

**🎉 Ready to get started?** Clone this repository and begin organizing your AI prompts like a pro!