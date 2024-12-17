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

// 统一配置对象
const config = {
    // GitHub相关配置
    apiBaseUrl: window.GITHUB_API_URL,
    rawBaseUrl: window.GITHUB_RAW_URL,
    branch: window.GITHUB_CONFIG.BRANCH,
    
    // 文件存储路径配置
    articlesPath: 'data/articles.json',
    pdfStoragePath: 'papers/',  // PDF文件存储路径
    
    // 文件访问URL配置
    getPdfUrl: function(filename) {
        return `${this.rawBaseUrl}/${this.pdfStoragePath}${encodeURIComponent(filename)}`;
    },
    
    // 其他配置
    maxFileSize: 50 * 1024 * 1024, // 最大文件大小（50MB）
    allowedFileTypes: ['.pdf'],    // 允许的文件类型
    
    // GitHub API配置
    headers: {
        base: {
            'Accept': 'application/vnd.github.v3+json'
        },
        get auth() {
            const token = window.getGitHubToken();
            return token ? { 'Authorization': `Bearer ${token}` } : {};
        }
    },
    
    // 获取文章数据的URL
    getArticlesUrl() {
        return `${this.rawBaseUrl}/${this.articlesPath}`;
    }
};

// 导出配置
window.config = config;