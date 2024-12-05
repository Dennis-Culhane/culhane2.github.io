// 修改初始化逻辑
function initializeStorage() {
    const existingArticles = localStorage.getItem('articles');
    if (!existingArticles || existingArticles === '[]' || existingArticles === 'null') {
        console.log('Initializing storage with default articles');
        saveArticlesToStorage(defaultArticles);
    } else {
        try {
            const articles = JSON.parse(existingArticles);
            console.log('Storage already initialized with', articles.length, 'articles');
        } catch (error) {
            console.error('Error parsing stored articles, reinitializing:', error);
            saveArticlesToStorage(defaultArticles);
        }
    }
}

// 确保在 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', initializeStorage); 