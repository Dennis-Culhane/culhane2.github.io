document.addEventListener('DOMContentLoaded', async () => {
    // 检查是否已有token
    const token = sessionStorage.getItem('github_token');
    if (token) {
        try {
            if (await checkToken(token)) {
                document.getElementById('token-input-section').classList.add('hidden');
                document.getElementById('main-content').classList.remove('hidden');
                await ArticlesManager.renderArticles();
            } else {
                sessionStorage.removeItem('github_token');
            }
        } catch (error) {
            console.error('Error during initialization:', error);
            sessionStorage.removeItem('github_token');
        }
    }
});

// Shared data handling functions
window.ArticlesManager = {
    // Get articles from GitHub storage
    async getArticles(includeContent = false) {
        try {
            const token = sessionStorage.getItem('github_token');
            if (!token) throw new Error('No GitHub token found');

            const response = await fetch(`${config.apiBaseUrl}/contents/${config.articlesPath}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) throw new Error('Failed to fetch articles');
            
            const data = await response.json();
            if (response.status === 404) {
                return [];
            }
            
            if (!data || !data.content) {
                console.warn('No content found in response');
                return [];
            }

            const articles = JSON.parse(atob(data.content));
            
            if (!includeContent) {
                articles.forEach(article => {
                    delete article.content;
                });
            }
            
            return articles;
        } catch (error) {
            console.error('Error fetching articles:', error);
            return [];
        }
    },

    // Save articles to GitHub storage (需要 token)
    async saveArticles(articles) {
        try {
            const token = window.getGitHubToken();
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!Array.isArray(articles)) {
                console.error('Articles is not an array:', articles);
                articles = [];
            }

            // Validate each article
            articles = articles.filter(article => {
                try {
                    return article && article.id && article.title && article.authors;
                } catch (error) {
                    console.warn('Invalid article filtered out:', article);
                    return false;
                }
            });

            console.log('Saving articles:', articles);

            // Convert to JSON string with pretty printing
            const jsonContent = JSON.stringify(articles, null, 2);
            console.log('JSON content to save:', jsonContent);

            // Convert to base64
            const base64Content = btoa(unescape(encodeURIComponent(jsonContent)));

            // Get existing file SHA if it exists
            let sha = '';
            try {
                const checkResponse = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (checkResponse.ok) {
                    const data = await checkResponse.json();
                    sha = data.sha;
                }
            } catch (error) {
                console.log('No existing file found, will create new one');
            }

            // Prepare request body
            const body = {
                message: 'Update articles data',
                content: base64Content,
                branch: window.GITHUB_CONFIG.BRANCH
            };

            if (sha) {
                body.sha = sha;
            }

            // Save to GitHub
            const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`GitHub API Error: ${errorData.message}`);
            }

            // 等待文件保存完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('Articles saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving articles:', error);
            throw error;
        }
    },

    // Upload PDF file to GitHub (需要 token)
    async uploadPDF(file) {
        try {
            const token = window.getGitHubToken();
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!file) {
                throw new Error('PDF file is required');
            }

            console.log('Uploading PDF:', file.name);

            // Convert file to base64
            const base64Content = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    try {
                        const base64 = reader.result.split(',')[1];
                        if (!base64) {
                            reject(new Error('Failed to convert file to base64'));
                            return;
                        }
                        resolve(base64);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });

            // Create papers directory if it doesn't exist
            try {
                const dirResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });

                if (!dirResponse.ok && dirResponse.status !== 404) {
                    throw new Error('Failed to check papers directory');
                }
            } catch (error) {
                console.log('Creating papers directory...');
            }

            // Check if file exists
            let sha = '';
            try {
                const checkResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(file.name)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (checkResponse.ok) {
                    const data = await checkResponse.json();
                    sha = data.sha;
                }
            } catch (error) {
                console.log('No existing file found');
            }

            // Prepare request body
            const body = {
                message: `Upload PDF: ${file.name}`,
                content: base64Content,
                branch: window.GITHUB_CONFIG.BRANCH
            };

            if (sha) {
                body.sha = sha;
            }

            // Upload to GitHub
            const response = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(file.name)}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to upload PDF: ${errorData.message}`);
            }

            // 等待文件上传完成
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('PDF uploaded successfully');
            // Generate the raw URL for the PDF
            const pdfUrl = `${window.GITHUB_RAW_URL}/papers/${encodeURIComponent(file.name)}`;
            console.log('PDF URL:', pdfUrl);
            return pdfUrl;
        } catch (error) {
            console.error('Error uploading PDF:', error);
            throw error;
        }
    },

    // Add new article (需要 token)
    async addArticle(articleData) {
        try {
            const token = window.getGitHubToken();
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!articleData || !articleData.title || !articleData.authors) {
                throw new Error('Article title and authors are required');
            }

            if (!articleData.pdfUrl || !articleData.pdfUrl.trim()) {
                throw new Error('URL is required');
            }

            // 验证URL格式
            try {
                new URL(articleData.pdfUrl);
            } catch (e) {
                throw new Error('Invalid URL format');
            }

            // Get current articles first
            let articles = await this.getArticles(true);
            console.log('Current articles:', articles);

            // Ensure articles is an array
            if (!Array.isArray(articles)) {
                console.log('Articles is not an array, initializing empty array');
                articles = [];
            }

            // Create new article
            const newArticle = {
                id: Date.now().toString(),
                title: articleData.title.trim(),
                authors: articleData.authors.trim(),
                date: articleData.date || new Date().toISOString().split('T')[0],
                categories: Array.isArray(articleData.categories) ? articleData.categories.filter(Boolean) : [],
                abstract: articleData.abstract ? articleData.abstract.trim() : '',
                pdfUrl: articleData.pdfUrl.trim()
            };

            console.log('New article object:', newArticle);

            // Add to articles array
            articles.push(newArticle);

            // Save updated articles
            await this.saveArticles(articles);
            console.log('New article added successfully:', newArticle);

            return newArticle;
        } catch (error) {
            console.error('Error adding article:', error);
            throw error;
        }
    },

    // Delete article (需要 token)
    async deleteArticle(id) {
        try {
            const token = window.getGitHubToken();
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!id) {
                throw new Error('Article ID is required');
            }

            let articles = await this.getArticles(true);
            if (!Array.isArray(articles)) {
                articles = [];
                return;
            }

            // Find the article to get its PDF filename
            const article = articles.find(a => a.id === id);
            if (!article) {
                throw new Error('Article not found');
            }

            if (article.fileName) {
                // Try to delete the PDF file
                try {
                    // Get the PDF file SHA
                    const pdfResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(article.fileName)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (pdfResponse.ok) {
                        const pdfData = await pdfResponse.json();
                        // Delete the PDF file
                        const deleteResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(article.fileName)}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Accept': 'application/vnd.github.v3+json'
                            },
                            body: JSON.stringify({
                                message: `Delete PDF: ${article.fileName}`,
                                sha: pdfData.sha,
                                branch: window.GITHUB_CONFIG.BRANCH
                            })
                        });

                        if (!deleteResponse.ok) {
                            const errorData = await deleteResponse.json();
                            console.error('Failed to delete PDF:', errorData);
                        }
                    }
                } catch (error) {
                    console.error('Error deleting PDF file:', error);
                    // Continue with article deletion even if PDF deletion fails
                }
            }

            // Remove the article from the array
            articles = articles.filter(article => article.id !== id);

            // Save the updated articles
            await this.saveArticles(articles);
            
            return true;
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    },

    // Render articles list
    async renderArticles(containerId = 'articles-list', isAdmin = false) {
        try {
            // 如果是管理页面，使用 token 获取数据
            let articles = await this.getArticles(isAdmin);
            console.log('Rendering articles:', articles);

            const container = document.getElementById(containerId);
            if (!container) {
                console.warn(`Container ${containerId} not found`);
                return;
            }

            if (!Array.isArray(articles) || articles.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">No articles found.</p>';
                return;
            }

            // Sort articles by date (newest first)
            articles.sort((a, b) => {
                const dateA = a.date ? new Date(a.date) : new Date(0);
                const dateB = b.date ? new Date(b.date) : new Date(0);
                return dateB - dateA;
            });

            container.innerHTML = articles.map(article => {
                try {
                    return `
                        <div class="bg-white rounded-lg shadow-md p-6 mb-4">
                            <h3 class="text-xl font-bold mb-2">${article.title || 'Untitled'}</h3>
                            <p class="text-gray-600 mb-2">Authors: ${article.authors || 'Unknown'}</p>
                            <p class="text-gray-600 mb-2">Date: ${article.date || 'No date'}</p>
                            ${article.categories && article.categories.length > 0 ? 
                                `<p class="text-gray-600 mb-2">Categories: ${article.categories.join(', ')}</p>` : ''}
                            <p class="text-gray-700 mb-4">${article.abstract || 'No abstract available'}</p>
                            <div class="flex justify-between items-center">
                                <a href="${article.pdfUrl}" target="_blank" 
                                   class="text-blue-600 hover:text-blue-800">
                                    View PDF
                                </a>
                                ${isAdmin ? `
                                    <button onclick="ArticlesManager.deleteArticle('${article.id}')" 
                                        class="text-red-600 hover:text-red-800">
                                        Delete
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                } catch (error) {
                    console.error('Error rendering article:', error);
                    return '';
                }
            }).filter(Boolean).join('');
        } catch (error) {
            console.error('Error rendering articles:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<p class="text-red-500 text-center">Error loading articles: ${error.message}</p>`;
            }
        }
    }
};

// 验证token是否有效
async function checkToken(token) {
    try {
        const response = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            console.error('Token verification failed:', response.status, response.statusText);
            return false;
        }
        
        try {
            const data = await response.json();
            return !!data;
        } catch (e) {
            console.error('Failed to parse response:', e);
            return false;
        }

    } catch (error) {
        console.error('Token verification error:', error);
        return false;
    }
}

// 保存token
document.getElementById('save-token-btn').addEventListener('click', async function() {
    const token = document.getElementById('github-token').value.trim();
    
    if (!token) {
        alert('Please enter a GitHub token');
        return;
    }

    try {
        if (await checkToken(token)) {
            sessionStorage.setItem('github_token', token);
            document.getElementById('token-input-section').classList.add('hidden');
            document.getElementById('main-content').classList.remove('hidden');
            await ArticlesManager.renderArticles();
        } else {
            alert('Invalid GitHub token. Please check your token and try again.');
        }
    } catch (error) {
        console.error('Error saving token:', error);
        alert('Failed to verify token. Please check your connection and try again.');
    }
});