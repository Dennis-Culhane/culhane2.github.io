window.toggleArticleSelection = toggleArticleSelection;
window.toggleSelectMode = toggleSelectMode;
window.deleteSelected = deleteSelected;
window.editArticle = editArticle;

// 添加文件上传函数
async function uploadFileToGitHub(file, fileName) {
    try {
        // 将文件转换为 Base64
        const base64Content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        // GitHub API 配置
        const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/contents/papers/${fileName}`;
        
        // 添加错误日志
        console.log('Attempting to upload file to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'  // 添加 API 版本
            },
            body: JSON.stringify({
                message: `Upload paper: ${fileName}`,
                content: base64Content,
                branch: 'main'  // 指定分支
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('GitHub API Error:', errorData);
            throw new Error(`Failed to upload file: ${errorData.message}`);
        }

        const responseData = await response.json();
        console.log('Upload successful:', responseData);

        // 返回文件的 GitHub Pages URL
        return `https://dennis-culhane.github.io/culhane2.github.io/papers/${fileName}`;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
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

        // 创建文章对象
        const newArticle = {
            id: Date.now(), // 使用时间戳作为唯一ID
            title: title,
            authors: authors,
            date: date,
            categories: Array.from(window.selectedCategories || []),
            abstract: abstract,
            fileName: pdfFile.name,
            pdfUrl: `${GITHUB_REPO_URL}/papers/${pdfFile.name}`
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
        
        alert('Article added successfully!');
        return newArticle;
    } catch (error) {
        console.error('Error saving article:', error);
        alert('Error saving article: ' + error.message);
        throw error;
    }
};

// 修改 saveArticle 函数
function saveArticle(article) {
    try {
        const articles = window.getArticlesFromStorage() || [];
        const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) + 1 : 1;
        
        const newArticle = {
            ...article,
            id: newId
        };
        
        articles.push(newArticle);
        window.saveArticlesToStorage(articles);
        
        // 立即重新渲染
        renderArticlesList();
        renderExistingCategories();
        
        return newArticle;
    } catch (error) {
        console.error('Error in saveArticle:', error);
        throw error;
    }
}