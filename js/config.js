// GitHub Configuration
window.GITHUB_CONFIG = {
    REPO_OWNER: 'Dennis-Culhane',
    REPO_NAME: 'culhane2.github.io',
    BRANCH: 'main'
};

// GitHub API URLs
window.GITHUB_API_URL = `https://api.github.com/repos/${window.GITHUB_CONFIG.REPO_OWNER}/${window.GITHUB_CONFIG.REPO_NAME}`;
window.GITHUB_RAW_URL = `https://raw.githubusercontent.com/${window.GITHUB_CONFIG.REPO_OWNER}/${window.GITHUB_CONFIG.REPO_NAME}/${window.GITHUB_CONFIG.BRANCH}`;

// Helper function to get GitHub token
window.getGitHubToken = function() {
    return sessionStorage.getItem('github_token');
};