# Personal Prompt Manager

A web-based application for managing and organizing your AI prompts using GitHub as the backend storage. This application allows you to save, rate, and organize your prompts with attachments, all stored directly in your GitHub repository.

## Features

- ✨ **Add Prompts**: Save prompts with name, text, rating (1-5 stars), and optional attachments
- 📁 **GitHub Integration**: Uses GitHub REST API to store prompts as JSON files
- 🔍 **View & Search**: Display all saved prompts in a beautiful, organized interface
- 📎 **Attachments**: Support for file attachments (stored as base64 in JSON)
- ⭐ **Rating System**: 5-star rating system for prompt effectiveness
- 🗑️ **Delete Prompts**: Remove prompts you no longer need
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔒 **Secure**: Uses your personal GitHub access token (stored locally)

## Project Structure

```
prompt-manager
├── index.html          # Main HTML document for the website
├── css
│   └── styles.css     # Styles for the website
├── js
│   ├── app.js         # Main JavaScript file for application logic
│   ├── github-api.js   # Functions for interacting with the GitHub REST API
│   └── prompt-manager.js # Logic related to prompts
├── prompts
│   └── .gitkeep       # Keeps the prompts directory tracked by Git
├── config
│   └── config.js      # Configuration settings for GitHub API
└── README.md          # Documentation for the project
```

## Features

- Submit prompts with the following fields:
  - Name
  - Prompt Text
  - Rating
  - Optional Attachment
- Fetch and display all saved prompts from the `/prompts/` folder.
- Store prompts as JSON files in the GitHub repository.

## Setup Instructions

### 1. Repository Setup

1. Create a new GitHub repository or use an existing one
2. Make sure the repository is public or you have appropriate access
3. Clone this repository or download the files to your local machine

### 2. GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Prompt Manager"
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
5. Click "Generate token" and copy the token (save it somewhere safe!)

### 3. Configuration

1. Open `index.html` in your browser
2. Click the "Configuration" button
3. Enter your:
   - **GitHub Personal Access Token**
   - **GitHub Username**
   - **Repository Name** (where prompts will be stored)
4. Click "Save Configuration"
5. The app will test the connection and create a `prompts` folder if needed

### 4. GitHub Pages Deployment (Optional)

To host your prompt manager on GitHub Pages:

1. Push all files to your GitHub repository
2. Go to Repository Settings → Pages
3. Select "Deploy from a branch"
4. Choose "main" branch and "/ (root)"
5. Your site will be available at `https://yourusername.github.io/your-repo-name`

## Usage

### Adding a Prompt

1. Fill in the prompt details:
   - **Name**: A descriptive name for your prompt
   - **Prompt Text**: The actual prompt content
   - **Rating**: How effective the prompt is (1-5 stars)
   - **Attachment**: Optional file attachment
2. Click "Save Prompt"
3. The prompt will be saved as a JSON file in the `prompts/` folder

### Managing Prompts

- **View Prompts**: All prompts are displayed in reverse chronological order
- **Delete Prompts**: Click the delete button on any prompt card
- **Refresh**: Click the refresh button to reload prompts from GitHub

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

## Technical Details

### Architecture

- **Frontend**: Pure HTML, CSS, and JavaScript (ES6 modules)
- **Backend**: GitHub REST API
- **Storage**: JSON files in GitHub repository
- **Authentication**: Personal Access Token

### Browser Compatibility

- Modern browsers with ES6 module support
- Chrome 61+, Firefox 60+, Safari 10.1+, Edge 79+

### Security Notes

- Your GitHub token is stored locally in browser localStorage
- Never share your personal access token
- The token only has access to repositories you specify
- All communication is over HTTPS

## File Structure

```
prompt-manager/
├── index.html              # Main HTML file
├── README.md              # This file
├── css/
│   └── styles.css         # Styling
├── js/
│   ├── app.js            # Main application logic
│   ├── github-api.js     # GitHub API wrapper
│   └── prompt-manager.js # Prompt management utilities
├── config/
│   └── config.js         # Configuration management
└── prompts/
    └── .gitkeep          # Keeps the prompts folder in git
```

## Troubleshooting

### Common Issues

1. **"Configuration not set" error**
   - Make sure you've entered all configuration fields
   - Verify your GitHub token has the correct permissions

2. **"Failed to fetch prompts" error**
   - Check that your repository name is correct
   - Ensure your token has access to the repository
   - Verify the repository exists

3. **"Failed to create prompt" error**
   - Make sure you have write access to the repository
   - Check that the prompts folder exists
   - Verify your token hasn't expired

4. **Attachments not working**
   - Large files (>1MB) may cause issues due to GitHub's API limits
   - Try using smaller files or external hosting for large attachments

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your GitHub token permissions
3. Make sure your repository is accessible
4. Check that JavaScript modules are enabled in your browser

## Contributing

Feel free to submit issues, feature requests, or pull requests to improve this tool!

## License

This project is open source and available under the MIT License.