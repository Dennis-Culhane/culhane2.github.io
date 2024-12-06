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

// Helper function to get headers with token
function getAuthHeaders() {
    const token = window.getGitHubToken();
    if (!token) {
        throw new Error('GitHub token not found. Please authenticate first.');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    };
}

// File upload handler
async function uploadFileToGitHub(file, fileName) {
    try {
        console.log('Starting file upload...', fileName);
        
        // Convert file to Base64
        const base64Content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                console.log('File converted to base64');
                resolve(base64);
            };
            reader.readAsDataURL(file);
        });

        const apiUrl = `${window.GITHUB_API_URL}/contents/papers/${fileName}`;
        console.log('Uploading to:', apiUrl);

        // Check if file exists
        let sha;
        try {
            const checkResponse = await fetch(apiUrl, {
                headers: getAuthHeaders()
            });
            if (checkResponse.ok) {
                const data = await checkResponse.json();
                sha = data.sha;
            }
        } catch (error) {
            console.log('No existing file found');
        }

        const body = {
            message: `Upload paper: ${fileName}`,
            content: base64Content,
            branch: window.GITHUB_CONFIG.BRANCH
        };

        if (sha) {
            body.sha = sha;
        }

        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to upload file: ${errorData.message}`);
        }

        const responseData = await response.json();
        console.log('File uploaded successfully:', responseData);
        
        return `${window.GITHUB_RAW_URL}/papers/${fileName}`;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// 单个文章提交处理
async function handleArticleSubmit(event) {
    event.preventDefault(); // 阻止表单默认提交行为
    
    try {
        // 获取表单数据
        const title = document.getElementById('title').value;
        const authors = document.getElementById('authors').value;
        const date = document.getElementById('date').value;
        const abstract = document.getElementById('abstract').value;
        const pdfFile = document.getElementById('pdf-file').files[0];

        if (!title || !authors || !date || !abstract || !pdfFile) {
            throw new Error('Please fill in all required fields');
        }

        // 显示加载状态
        const submitButton = document.querySelector('#article-form button[type="button"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Uploading...';

        try {
            // 上传PDF文件
            console.log('Uploading PDF file...');
            const pdfUrl = await uploadFileToGitHub(pdfFile, pdfFile.name);
            console.log('PDF uploaded successfully:', pdfUrl);

            // 获取现有文章
            const articles = await window.getArticlesFromStorage() || [];
            const maxId = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) : 0;

            // 创建新文章对象
            const newArticle = {
                id: maxId + 1,
                title: title,
                authors: authors,
                date: date,
                categories: Array.from(window.selectedCategories || []),
                abstract: abstract,
                fileName: pdfFile.name,
                pdfUrl: pdfUrl
            };

            // 添加新文章并保存
            articles.push(newArticle);
            await window.saveArticlesToStorage(articles);

            // 重置表单和更新界面
            document.getElementById('article-form').reset();
            window.selectedCategories = new Set();
            await window.renderArticlesList();
            await window.renderExistingCategories();
            window.renderSelectedCategories();

            alert('Article added successfully!');
        } finally {
            // 恢复按钮状态
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    } catch (error) {
        console.error('Error saving article:', error);
        alert('Error saving article: ' + error.message);
    }
}

// 批量上传处理
async function handleBulkUpload(event) {
    event.preventDefault();
    
    const excelFile = document.getElementById('excel-file').files[0];
    if (!excelFile) {
        alert('Please select an Excel file');
        return;
    }

    const bulkUploadBtn = document.getElementById('batch-upload-btn');
    const originalText = bulkUploadBtn.textContent;
    bulkUploadBtn.disabled = true;
    bulkUploadBtn.textContent = 'Processing...';

    try {
        const data = await readExcelFile(excelFile);
        console.log('Excel data:', data);

        // 显示预览
        const previewArea = document.getElementById('preview-area');
        previewArea.classList.remove('hidden');
        previewArea.innerHTML = `
            <h3 class="text-lg font-medium mb-4">Preview Data</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Authors</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${data.map(row => `
                            <tr>
                                <td class="px-6 py-4 text-sm">${row.Title || ''}</td>
                                <td class="px-6 py-4 text-sm">${row.Authors || ''}</td>
                                <td class="px-6 py-4 text-sm">${row.Date || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <button id="confirm-batch-upload" class="mt-4 w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Confirm Upload
            </button>
        `;

        // 添加确认按钮事件处理
        document.getElementById('confirm-batch-upload').onclick = async () => {
            try {
                await confirmBatchUpload(data);
                previewArea.classList.add('hidden');
                document.getElementById('excel-file').value = '';
                alert('Batch upload completed successfully!');
            } catch (error) {
                console.error('Batch upload error:', error);
                alert('Batch upload failed: ' + error.message);
            }
        };
    } catch (error) {
        console.error('Error in bulk upload:', error);
        alert('Batch upload failed: ' + error.message);
    } finally {
        bulkUploadBtn.disabled = false;
        bulkUploadBtn.textContent = originalText;
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing admin page...');
    
    // 初始化全局变量
    window.selectedCategories = new Set();
    window.selectedArticles = new Set();
    window.isSelectMode = false;

    // Add functions to global scope
    window.readExcelFile = readExcelFile;
    window.confirmBatchUpload = confirmBatchUpload;
    window.getArticlesFromStorage = getArticlesFromStorage;
    window.saveArticlesToStorage = saveArticlesToStorage;
});

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

// Excel文件处理函数
async function readExcelFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                console.log('Excel data parsed:', jsonData);
                resolve(jsonData);
            } catch (error) {
                console.error('Error parsing Excel:', error);
                reject(new Error('Failed to parse Excel file: ' + error.message));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsBinaryString(file);
    });
}

// 批量上传确认处理
async function confirmBatchUpload(data) {
    try {
        // 获取现有文章
        const articles = await window.getArticlesFromStorage() || [];
        const maxId = articles.length > 0 ? Math.max(...articles.map(a => a.id || 0)) : 0;

        // 转换数据格式
        const newArticles = await Promise.all(data.map(async (row, index) => {
            // 验证必需字段
            if (!row.Title || !row.Authors || !row.Date || !row.Abstract || !row['PDF URL']) {
                throw new Error(`Row ${index + 1} is incomplete. Please check all required fields`);
            }

            return {
                id: maxId + index + 1,
                title: row.Title,
                authors: row.Authors,
                date: row.Date,
                categories: row.Categories ? row.Categories.split(',').map(c => c.trim()) : [],
                abstract: row.Abstract,
                fileName: row['PDF URL'].split('/').pop(),
                pdfUrl: row['PDF URL']
            };
        }));

        // 添加新文章
        const updatedArticles = [...articles, ...newArticles];
        
        // 保存更新后的文章列表
        await window.saveArticlesToStorage(updatedArticles);
        
        // 更新界面
        await window.renderArticlesList();
        if (typeof window.renderExistingCategories === 'function') {
            await window.renderExistingCategories();
        }

        console.log('Batch upload completed successfully');
        return true;
    } catch (error) {
        console.error('Error in confirmBatchUpload:', error);
        throw error;
    }
}

// Storage Functions
async function getArticlesFromStorage() {
    try {
        console.log('Fetching articles from GitHub...');
        const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
            headers: getAuthHeaders()
        });

        if (response.status === 404) {
            console.log('No articles file found, returning empty array');
            return [];
        }

        if (!response.ok) {
            throw new Error('Failed to fetch articles');
        }

        const data = await response.json();
        const content = atob(data.content);
        const articles = JSON.parse(content);
        console.log('Articles fetched successfully:', articles.length);
        return articles;
    } catch (error) {
        console.error('Error fetching articles:', error);
        return [];
    }
}

async function saveArticlesToStorage(articles) {
    try {
        console.log('Saving articles to GitHub...');
        
        // Use UTF-8 encoding
        const content = btoa(unescape(encodeURIComponent(JSON.stringify(articles, null, 2))));
        
        // Get existing file SHA
        let sha = '';
        try {
            const getResponse = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                headers: getAuthHeaders()
            });
            
            if (getResponse.ok) {
                const data = await getResponse.json();
                sha = data.sha;
            }
        } catch (error) {
            console.log('No existing file found');
        }

        // Prepare request body
        const body = {
            message: 'Update articles data',
            content: content,
            branch: window.GITHUB_CONFIG.BRANCH
        };

        if (sha) {
            body.sha = sha;
        }

        // Send save request
        const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
            method: 'PUT',
            headers: {
                ...getAuthHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API Error: ${errorData.message}`);
        }

        console.log('Articles saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving articles:', error);
        throw error;
    }
}

// 将函数添加到全局作用域
window.readExcelFile = readExcelFile;
window.confirmBatchUpload = confirmBatchUpload;
window.getArticlesFromStorage = getArticlesFromStorage;
window.saveArticlesToStorage = saveArticlesToStorage;

// GitHub Configuration
const GITHUB_CONFIG = {
    TOKEN: process.env.GITHUB_TOKEN || window.GITHUB_CONFIG?.TOKEN,
    REPO_OWNER: 'Dennis-Culhane',
    REPO_NAME: 'culhane2.github.io',
    BRANCH: 'main'
};

// GitHub API URLs
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}`;
const GITHUB_RAW_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/${GITHUB_CONFIG.BRANCH}`;