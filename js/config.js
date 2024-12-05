// GitHub 配置
const GITHUB_CONFIG = {
    TOKEN: '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',
    REPO_OWNER: 'Dennis-Culhane',
    REPO_NAME: 'culhane2.github.io',
    BRANCH: 'main'
};

// GitHub API URLs
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`;
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/${GITHUB_CONFIG.BRANCH}`;

// 导出配置
module.exports = {
    GITHUB_CONFIG,
    GITHUB_API_URL,
    GITHUB_RAW_URL
};