// Shared data handling functions
window.ArticlesManager = {
    // Validate article data
    validateArticleData(articleData) {
        if (!articleData) {
            throw new Error('Article data is required');
        }
        if (!articleData.title || articleData.title.trim() === '') {
            throw new Error('Article title is required');
        }
        if (!articleData.authors || articleData.authors.trim() === '') {
            throw new Error('Article authors are required');
        }
        return true;
    },

    // Validate PDF file
    validatePDFFile(file) {
        if (!file) {
            throw new Error('PDF file is required');
        }
        if (!file.name || !file.name.toLowerCase().endsWith('.pdf')) {
            throw new Error('File must be a PDF');
        }
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error('PDF file size must be less than 50MB');
        }
        return true;
    },

    // Get articles from GitHub storage
    async getArticles() {
        try {
            console.log('Fetching articles from GitHub...');
            if (!window.getGitHubToken()) {
                throw new Error('GitHub token is not set');
            }

            const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                headers: {
                    'Authorization': `Bearer ${window.getGitHubToken()}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                console.log('No articles file found, creating new file');
                await this.saveArticles([]);
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
            } catch (error) {
                console.error('Error parsing articles JSON:', error);
                articles = [];
            }

            console.log('Articles loaded:', articles.length);
            return articles;
        } catch (error) {
            console.error('Error loading articles:', error);
            throw error;
        }
    },

    // Save articles to GitHub storage
    async saveArticles(articles) {
        try {
            if (!window.getGitHubToken()) {
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
                        'Authorization': `Bearer ${window.getGitHubToken()}`,
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
                    'Authorization': `Bearer ${window.getGitHubToken()}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
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
    },

    // Upload PDF file to GitHub
    async uploadPDF(file) {
        try {
            if (!window.getGitHubToken()) {
                throw new Error('GitHub token is not set');
            }

            this.validatePDFFile(file);
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

            // Check if file exists
            let sha = '';
            try {
                const checkResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(file.name)}`, {
                    headers: {
                        'Authorization': `Bearer ${window.getGitHubToken()}`,
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
                    'Authorization': `Bearer ${window.getGitHubToken()}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to upload PDF: ${errorData.message}`);
            }

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

    // Add new article
    async addArticle(articleData, pdfFile) {
        try {
            if (!window.getGitHubToken()) {
                throw new Error('GitHub token is not set');
            }

            // Validate inputs
            this.validateArticleData(articleData);
            this.validatePDFFile(pdfFile);

            // Get current articles first
            let articles = await this.getArticles();
            if (!Array.isArray(articles)) {
                articles = [];
            }
            
            // Upload PDF
            const pdfUrl = await this.uploadPDF(pdfFile);
            
            // Generate new ID
            const newId = (articles.length + 1).toString();

            // Create new article
            const newArticle = {
                id: newId,
                title: articleData.title.trim(),
                authors: articleData.authors.trim(),
                date: articleData.date || new Date().toISOString().split('T')[0],
                categories: Array.isArray(articleData.categories) ? articleData.categories.filter(c => c && c.trim()) : [],
                abstract: (articleData.abstract || '').trim(),
                fileName: pdfFile.name,
                pdfUrl: pdfUrl
            };

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

            let articles = await this.getArticles();
            if (!Array.isArray(articles)) {
                articles = [];
            }

            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error(`Container ${containerId} not found`);
            }

            if (articles.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">No articles found.</p>';
                return;
            }

            // Sort articles by date (newest first)
            articles.sort((a, b) => {
                try {
                    return new Date(b.date || 0) - new Date(a.date || 0);
                } catch (error) {
                    console.warn('Error sorting articles by date:', error);
                    return 0;
                }
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

    // Delete article
    async deleteArticle(id) {
        try {
            if (!window.getGitHubToken()) {
                throw new Error('GitHub token is not set');
            }

            if (!id) {
                throw new Error('Article ID is required');
            }

            if (!confirm('Are you sure you want to delete this article?')) {
                return;
            }

            let articles = await this.getArticles();
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
                            'Authorization': `Bearer ${window.getGitHubToken()}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });

                    if (pdfResponse.ok) {
                        const pdfData = await pdfResponse.json();
                        // Delete the PDF file
                        const deleteResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${encodeURIComponent(article.fileName)}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${window.getGitHubToken()}`,
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
                            throw new Error(`Failed to delete PDF: ${errorData.message}`);
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
            
            // Refresh the display
            await this.renderArticles('articles-list', true);
            
            console.log('Article deleted successfully');
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error deleting article: ' + error.message);
        }
    }
};