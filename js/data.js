// Shared data handling functions
window.ArticlesManager = {
    // Get articles from GitHub storage
    async getArticles(useToken = false) {
        try {
            console.log('Fetching articles from GitHub...');
            
            // 构建请求头
            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            };
            
            // 仅在需要时添加 token
            if (useToken) {
                const token = window.getGitHubToken();
                if (!token) {
                    throw new Error('GitHub token is not set');
                }
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                headers: headers
            });

            if (response.status === 404) {
                console.log('No articles file found, initializing with empty array');
                if (useToken) {
                    await this.saveArticles([]);
                }
                return [];
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to fetch articles: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();
            if (!data.content) {
                console.warn('No content found in articles file');
                return [];
            }

            const content = atob(data.content);
            let articles = [];
            
            try {
                articles = JSON.parse(content);
                if (!Array.isArray(articles)) {
                    console.warn('Articles data is not an array, initializing empty array');
                    articles = [];
                }

                // 确保每篇文章都有唯一的 ID
                articles = articles.map(article => {
                    if (!article.id) {
                        article.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                    }
                    return article;
                });
            } catch (error) {
                console.error('Error parsing articles JSON:', error);
                articles = [];
            }

            console.log('Articles loaded:', articles);
            return articles;
        } catch (error) {
            console.error('Error loading articles:', error);
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
    async addArticle(articleData, pdfFile) {
        try {
            const token = window.getGitHubToken();
            if (!token) {
                throw new Error('GitHub token is not set');
            }

            if (!articleData || !articleData.title || !articleData.authors) {
                throw new Error('Article title and authors are required');
            }

            if (!pdfFile) {
                throw new Error('PDF file is required');
            }

            // Get current articles first
            let articles = await this.getArticles(true);
            console.log('Current articles:', articles);

            // Ensure articles is an array
            if (!Array.isArray(articles)) {
                console.log('Articles is not an array, initializing empty array');
                articles = [];
            }

            // Upload PDF
            const pdfUrl = await this.uploadPDF(pdfFile);
            console.log('PDF uploaded, URL:', pdfUrl);

            // Create new article
            const newArticle = {
                id: Date.now().toString(),
                title: articleData.title.trim(),
                authors: articleData.authors.trim(),
                date: articleData.date || new Date().toISOString().split('T')[0],
                categories: Array.isArray(articleData.categories) ? articleData.categories.filter(Boolean) : [],
                abstract: articleData.abstract ? articleData.abstract.trim() : '',
                fileName: pdfFile.name,
                pdfUrl: pdfUrl
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

    // Render articles list
    async renderArticles(containerId, isAdmin = false) {
        try {
            if (!containerId) {
                throw new Error('Container ID is required');
            }

            // 如果是管理页面，使用 token 获取数据
            let articles = await this.getArticles(isAdmin);
            console.log('Rendering articles:', articles);

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
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

            // 获取当前的文章数据
            const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch articles data');
            }

            const data = await response.json();
            const content = atob(data.content);
            let articles = JSON.parse(content);

            // 找到要删除的文章
            const articleIndex = articles.findIndex(a => String(a.id) === String(id));
            if (articleIndex === -1) {
                throw new Error('Article not found');
            }

            const articleToDelete = articles[articleIndex];

            // 如果有 PDF 文件，先删除它
            if (articleToDelete.fileName) {
                try {
                    const pdfResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(articleToDelete.fileName)}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (pdfResponse.ok) {
                        const pdfData = await pdfResponse.json();
                        await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(articleToDelete.fileName)}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                message: `Delete PDF: ${articleToDelete.fileName}`,
                                sha: pdfData.sha,
                                branch: window.GITHUB_CONFIG.BRANCH
                            })
                        });
                    }
                } catch (error) {
                    console.error('Error deleting PDF file:', error);
                    // 继续删除文章数据，即使 PDF 删除失败
                }
            }

            // 从数组中删除文章
            articles.splice(articleIndex, 1);

            // 更新 articles.json 文件
            const updatedContent = JSON.stringify(articles, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(updatedContent)));

            const updateResponse = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: `Delete article: ${articleToDelete.title}`,
                    content: encodedContent,
                    sha: data.sha,
                    branch: window.GITHUB_CONFIG.BRANCH
                })
            });

            if (!updateResponse.ok) {
                throw new Error('Failed to update articles data');
            }

            return true;
        } catch (error) {
            console.error('Error deleting article:', error);
            throw error;
        }
    }
};