// 检查认证状态
function checkAuth() {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'admin.html';
    }
}

// 登出功能
function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'admin.html';
}

// 添加新的文章输入框
function addArticleEntry() {
    const template = document.querySelector('.article-entry').cloneNode(true);
    // 清空所有输入
    template.querySelectorAll('input, textarea').forEach(input => {
        input.value = '';
    });
    document.getElementById('article-entries').appendChild(template);
}

// 处理文章上传
document.getElementById('upload-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const entries = document.querySelectorAll('.article-entry');
    const newArticles = [];
    
    entries.forEach((entry, index) => {
        const pdfFile = entry.querySelector('input[name="pdf[]"]').files[0];
        const articleData = {
            id: `new-${Date.now()}-${index}`,
            title: entry.querySelector('input[name="title[]"]').value,
            category: entry.querySelector('select[name="category[]"]').value,
            authors: entry.querySelector('input[name="authors[]"]').value.split(',').map(a => a.trim()),
            publicationDate: entry.querySelector('input[name="date[]"]').value,
            abstract: entry.querySelector('textarea[name="abstract[]"]').value,
            pdfUrl: pdfFile ? URL.createObjectURL(pdfFile) : '#'
        };
        
        newArticles.push(articleData);
    });
    
    try {
        // 更新文章数据
        const updatedArticles = [...window.articlesData, ...newArticles];
        updateArticles(updatedArticles);
        
        // 重新渲染文章列表
        renderArticles();
        
        // 重置表单
        this.reset();
        
        // 清除额外的文章输入框
        const articleEntries = document.getElementById('article-entries');
        while (articleEntries.children.length > 1) {
            articleEntries.removeChild(articleEntries.lastChild);
        }
        
        alert('Articles uploaded successfully!');
    } catch (error) {
        alert('Upload failed: ' + error.message);
    }
});

// 渲染文章列表
function renderArticles() {
    const tbody = document.getElementById('articles-table');
    if (!tbody) {
        console.error('Articles table not found');
        return;
    }

    tbody.innerHTML = window.articlesData.map(article => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                     onclick="editArticle('${article.id}')">${article.title}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    ${article.category}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${new Date(article.publicationDate).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editArticle('${article.id}')"
                    class="text-blue-600 hover:text-blue-900 mr-4">
                    Edit
                </button>
                <button onclick="deleteArticle('${article.id}')"
                    class="text-red-600 hover:text-red-900">
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

// 编辑文章
function editArticle(id) {
    const article = window.articlesData.find(a => a.id === id);
    if (!article) return;
    
    // 填充表单
    document.getElementById('edit-id').value = article.id;
    document.getElementById('edit-title').value = article.title;
    document.getElementById('edit-category').value = article.category;
    document.getElementById('edit-authors').value = article.authors.join(', ');
    document.getElementById('edit-date').value = new Date(article.publicationDate).toISOString().split('T')[0];
    document.getElementById('edit-abstract').value = article.abstract;
    
    // 显示模态框
    const modal = document.getElementById('edit-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
}

// 处理编辑表单提交
document.getElementById('edit-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const articleData = {
        id: document.getElementById('edit-id').value,
        title: document.getElementById('edit-title').value,
        category: document.getElementById('edit-category').value,
        authors: document.getElementById('edit-authors').value.split(',').map(a => a.trim()),
        publicationDate: document.getElementById('edit-date').value,
        abstract: document.getElementById('edit-abstract').value
    };
    
    const pdfFile = document.getElementById('edit-pdf').files[0];
    
    try {
        const index = window.articlesData.findIndex(a => a.id === articleData.id);
        if (index !== -1) {
            const updatedArticles = [...window.articlesData];
            updatedArticles[index] = {
                ...updatedArticles[index],
                ...articleData,
                pdfUrl: pdfFile ? URL.createObjectURL(pdfFile) : updatedArticles[index].pdfUrl
            };
            updateArticles(updatedArticles);
        }
        
        closeEditModal();
        renderArticles();
        alert('Article updated successfully!');
    } catch (error) {
        alert('Failed to update article: ' + error.message);
    }
});

// 删除文章
function deleteArticle(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
        const updatedArticles = window.articlesData.filter(article => article.id !== id);
        updateArticles(updatedArticles);
        renderArticles();
        alert('Article deleted successfully!');
    } catch (error) {
        alert('Failed to delete article: ' + error.message);
    }
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    // 确保 articlesData 在全局范围内可用
    window.articlesData = window.articlesData || [];
    renderArticles();
}); 