function saveArticle(article) {
    try {
        const articles = loadArticles();
        const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) + 1 : 1;
        
        const newArticle = {
            ...article,
            id: newId,
            pdfUrl: `${GITHUB_REPO_URL}/papers/${article.fileName}`
        };
        
        articles.push(newArticle);
        window.saveArticlesToStorage(articles);
        console.log('Article saved with ID:', newId);
        return newArticle;
    } catch (error) {
        console.error('Error in saveArticle:', error);
        throw error;
    }
} 