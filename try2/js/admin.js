window.handleArticleSubmit = handleArticleSubmit;
window.renderArticlesList = renderArticlesList;
window.renderExistingCategories = renderExistingCategories;
window.renderSelectedCategories = renderSelectedCategories;
window.toggleArticleSelection = toggleArticleSelection;
window.toggleSelectMode = toggleSelectMode;
window.deleteSelected = deleteSelected;
window.editArticle = editArticle;
window.adminFunctions = {
    deleteArticle: deleteArticle
};

// 在文件开头添加全局变量
window.isSelectMode = false;
window.selectedArticles = new Set();

// 修改 toggleSelectMode 函数
function toggleSelectMode() {
    window.isSelectMode = !window.isSelectMode;
    const selectModeBtn = document.getElementById('select-mode-btn');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');
    
    if (window.isSelectMode) {
        selectModeBtn.textContent = 'Cancel Selection';
        selectModeBtn.classList.add('bg-gray-200');
        deleteSelectedBtn.classList.remove('hidden');
    } else {
        selectModeBtn.textContent = 'Select Mode';
        selectModeBtn.classList.remove('bg-gray-200');
        deleteSelectedBtn.classList.add('hidden');
        window.selectedArticles.clear();
    }
    renderArticlesList();
}

// 修改 toggleArticleSelection 函数
function toggleArticleSelection(articleId) {
    if (window.selectedArticles.has(articleId)) {
        window.selectedArticles.delete(articleId);
    } else {
        window.selectedArticles.add(articleId);
    }
    renderArticlesList();
}

// 修改 deleteSelected 函数
function deleteSelected() {
    if (window.selectedArticles.size === 0) {
        alert('Please select articles to delete');
        return;
    }

    if (confirm(`Are you sure you want to delete ${window.selectedArticles.size} articles?`)) {
        const articles = window.getArticlesFromStorage();
        const selectedIds = Array.from(window.selectedArticles);
        const newArticles = articles.filter(article => !selectedIds.includes(article.id));
        
        window.saveArticlesToStorage(newArticles);
        
        window.selectedArticles.clear();
        window.isSelectMode = false;
        document.getElementById('select-mode-btn').textContent = 'Select Mode';
        document.getElementById('select-mode-btn').classList.remove('bg-gray-200');
        document.getElementById('delete-selected-btn').classList.add('hidden');
        
        renderArticlesList();
        renderExistingCategories();
    }
}

// 添加删除文章功能
window.adminFunctions = {
    deleteArticle: function(articleId) {
        try {
            if (confirm('Are you sure you want to delete this article?')) {
                const articles = window.getArticlesFromStorage();
                const updatedArticles = articles.filter(article => article.id !== articleId);
                
                // 保存更新后的文章列表
                window.saveArticlesToStorage(updatedArticles);
                
                // 立即重新渲染
                renderArticlesList();
                renderExistingCategories();
                
                console.log('Article deleted successfully:', articleId);
            }
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error deleting article: ' + error.message);
        }
    },
    // ... 其他函数保持不变
};

// 修改文件上传函数
async function uploadFileToGitHub(file, fileName) {
    try {
        // 将文件转换为 Base64
        const base64Content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        console.log('Starting file upload...');
        
        // GitHub API 配置
        const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/contents/papers/${fileName}`;
        
        console.log('Uploading to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify({
                message: `Upload paper: ${fileName}`,
                content: base64Content,
                branch: GITHUB_CONFIG.BRANCH
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API Error:', errorData);
            throw new Error(`Failed to upload file: ${errorData.message}`);
        }

        console.log('File uploaded successfully');
        return `${GITHUB_REPO_URL}/papers/${fileName}`;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// 修改 handleArticleSubmit 函数
window.handleArticleSubmit = async function(formData) {
    try {
        // 验证表单数据
        const title = document.getElementById('title').value;
        const authors = document.getElementById('authors').value;
        const date = document.getElementById('date').value;
        const abstract = document.getElementById('abstract').value;
        const pdfFile = document.getElementById('pdf-file').files[0];

        if (!title || !authors || !date || !abstract || !pdfFile) {
            throw new Error('Please fill in all required fields');
        }

        console.log('Starting file upload to GitHub...');
        // 先上传文件到 GitHub
        const fileUrl = await uploadFileToGitHub(pdfFile, pdfFile.name);
        console.log('File uploaded successfully, URL:', fileUrl);

        // 创建文章对象
        const newArticle = {
            id: Date.now(), // 使用时间戳作为唯一ID
            title: title,
            authors: authors,
            date: date,
            categories: Array.from(window.selectedCategories || []),
            abstract: abstract,
            fileName: pdfFile.name,
            pdfUrl: fileUrl  // 使用上传后返回的 URL
        };

        // 获取现有文章
        const articles = window.getArticlesFromStorage() || [];
        
        // 添加新文章
        articles.push(newArticle);
        
        // 保存到 localStorage
        window.saveArticlesToStorage(articles);
        
        console.log('Article saved successfully:', newArticle);
        console.log('Current articles:', articles);

        // 重新渲染文章列表
        renderArticlesList();
        renderExistingCategories();
        
        // 重置表单
        document.getElementById('article-form').reset();
        window.selectedCategories = new Set();
        renderSelectedCategories();
        
        alert('Article added successfully!');
        return newArticle;
    } catch (error) {
        console.error('Error saving article:', error);
        alert('Error saving article: ' + error.message);
        throw error;
    }
};

// 修改 saveArticle 函数
async function saveArticle(article) {
    try {
        const articles = await window.getArticlesFromStorage();
        const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) + 1 : 1;
        
        const newArticle = {
            ...article,
            id: newId
        };
        
        articles.push(newArticle);
        await window.saveArticlesToStorage(articles);
        
        // 立即重新渲染
        await renderArticlesList();
        renderExistingCategories();
        
        return newArticle;
    } catch (error) {
        console.error('Error in saveArticle:', error);
        throw error;
    }
}

// 添加 renderArticlesList 函数
function renderArticlesList() {
    const articlesList = document.getElementById('articles-list');
    const articles = window.getArticlesFromStorage();
    
    if (!articles || articles.length === 0) {
        articlesList.innerHTML = `
            <p class="text-gray-500 text-center py-8">No articles yet</p>
        `;
        return;
    }

    articlesList.innerHTML = articles.map(article => {
        const title = String(article.title || '');
        const authors = String(article.authors || '');
        const date = String(article.date || '');
        const abstract = String(article.abstract || '');
        const categories = Array.isArray(article.categories) ? article.categories : [];

        return `
            <div class="border rounded-lg p-6 hover:shadow-md transition-shadow ${
                window.selectedArticles.has(article.id) ? 'bg-blue-50 border-blue-300' : ''
            }">
                <div class="flex justify-between items-start">
                    <div class="flex-grow">
                        ${window.isSelectMode ? `
                            <div class="flex items-center gap-3 mb-3">
                                <input 
                                    type="checkbox" 
                                    ${window.selectedArticles.has(article.id) ? 'checked' : ''}
                                    onchange="toggleArticleSelection(${article.id})"
                                    class="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                >
                            </div>
                        ` : ''}
                        <h3 class="text-xl font-semibold text-gray-900 mb-2">${title}</h3>
                        <div class="flex flex-wrap gap-2 mb-3">
                            ${categories.map(category => `
                                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                                    ${String(category)}
                                </span>
                            `).join('')}
                        </div>
                        <p class="text-gray-600 mb-2">Authors: ${authors}</p>
                        <p class="text-gray-600 mb-2">Date: ${date}</p>
                        <p class="text-gray-700 line-clamp-3">${abstract}</p>
                    </div>
                    ${!window.isSelectMode ? `
                        <div class="flex gap-2">
                            <button 
                                class="text-red-600 hover:text-red-800 p-2"
                                onclick="window.adminFunctions.deleteArticle(${article.id})"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                    />
                                </svg>
                            </button>
                            <button 
                                class="text-blue-600 hover:text-blue-800 p-2"
                                onclick="window.editArticle(${article.id})"
                            >
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" 
                                    />
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 添加这些函数到文件中
function renderExistingCategories() {
    const existingCategoriesContainer = document.getElementById('existing-categories');
    const articles = window.getArticlesFromStorage();
    const categories = new Set(articles.flatMap(article => article.categories || []));
    
    existingCategoriesContainer.innerHTML = Array.from(categories).map(category => `
        <button type="button"
            class="existing-category px-3 py-1 rounded-full text-sm font-medium
            ${(window.selectedCategories || new Set()).has(category) 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
            data-category="${category}">
            ${category}
        </button>
    `).join('');
}

function renderSelectedCategories() {
    const selectedCategoriesContainer = document.getElementById('selected-categories');
    selectedCategoriesContainer.innerHTML = Array.from(window.selectedCategories || new Set()).map(category => `
        <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
            ${category}
            <button type="button" class="remove-selected-category" data-category="${category}">
                ×
            </button>
        </span>
    `).join('');
}