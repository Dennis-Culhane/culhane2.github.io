// Shared data handling functions
window.ArticlesManager = {
    // Get articles from GitHub storage
    async getArticles() {
        try {
            console.log('Fetching articles from GitHub...');
            const response = await fetch(`${window.GITHUB_API_URL}/contents/data/articles.json`, {
                headers: {
                    'Authorization': `Bearer ${window.getGitHubToken()}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.status === 404) {
                console.log('No articles file found, creating new file');
                // Create empty articles file
                await this.saveArticles([]);
                return [];
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch articles: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = atob(data.content);
            const articles = JSON.parse(content);

            if (!Array.isArray(articles)) {
                console.warn('Articles data is not an array');
                return [];
            }

            console.log('Articles loaded:', articles.length);
            return articles;
        } catch (error) {
            console.error('Error loading articles:', error);
            return [];
        }
    },

    // Save articles to GitHub storage
    async saveArticles(articles) {
        if (!Array.isArray(articles)) {
            throw new Error('Articles must be an array');
        }

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
                console.log('Existing file SHA:', sha);
            }
        } catch (error) {
            console.log('No existing file found');
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
        console.log('Sending request to GitHub...');
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
    },

    // Upload PDF file to GitHub
    async uploadPDF(file) {
        try {
            console.log('Uploading PDF:', file.name);

            // Convert file to base64
            const base64Content = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result.split(',')[1];
                    resolve(base64);
                };
                reader.readAsDataURL(file);
            });

            // Check if file exists
            let sha = '';
            try {
                const checkResponse = await fetch(`${window.GITHUB_API_URL}/contents/papers/${file.name}`, {
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
            const response = await fetch(`${window.GITHUB_API_URL}/contents/papers/${file.name}`, {
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
            return `${window.GITHUB_RAW_URL}/papers/${file.name}`;
        } catch (error) {
            console.error('Error uploading PDF:', error);
            throw error;
        }
    },

    // Add new article
    async addArticle(articleData, pdfFile) {
        try {
            // Upload PDF first
            const pdfUrl = await this.uploadPDF(pdfFile);
            
            // Get current articles
            const articles = await this.getArticles();
            
            // Get max ID
            const maxId = articles.length > 0 
                ? Math.max(...articles.map(a => parseInt(a.id) || 0)) 
                : 0;

            // Create new article
            const newArticle = {
                id: maxId + 1,
                title: articleData.title,
                authors: articleData.authors,
                date: articleData.date,
                categories: articleData.categories || [],
                abstract: articleData.abstract,
                fileName: pdfFile.name,
                pdfUrl: pdfUrl
            };

            // Add to articles array
            articles.push(newArticle);

            // Save updated articles
            await this.saveArticles(articles);

            return newArticle;
        } catch (error) {
            console.error('Error adding article:', error);
            throw error;
        }
    },

    // Render articles list
    async renderArticles(containerId, isAdmin = false) {
        try {
            const articles = await this.getArticles();
            const container = document.getElementById(containerId);
            
            if (!container) {
                console.error(`Container ${containerId} not found`);
                return;
            }

            if (!Array.isArray(articles) || articles.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-center">No articles found.</p>';
                return;
            }

            // Sort articles by date (newest first)
            articles.sort((a, b) => new Date(b.date) - new Date(a.date));

            container.innerHTML = articles.map(article => `
                <div class="bg-white rounded-lg shadow-md p-6 mb-4">
                    <h3 class="text-xl font-bold mb-2">${article.title}</h3>
                    <p class="text-gray-600 mb-2">Authors: ${article.authors}</p>
                    <p class="text-gray-600 mb-2">Date: ${article.date}</p>
                    ${article.categories && article.categories.length > 0 ? 
                        `<p class="text-gray-600 mb-2">Categories: ${article.categories.join(', ')}</p>` : ''}
                    <p class="text-gray-700 mb-4">${article.abstract}</p>
                    <div class="flex justify-between items-center">
                        <a href="${article.pdfUrl}" target="_blank" 
                            class="text-blue-600 hover:text-blue-800">
                            View PDF
                        </a>
                        ${isAdmin ? `
                            <button onclick="ArticlesManager.deleteArticle(${article.id})" 
                                class="text-red-600 hover:text-red-800">
                                Delete
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error rendering articles:', error);
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = '<p class="text-red-500 text-center">Error loading articles.</p>';
            }
        }
    },

    // Delete article
    async deleteArticle(id) {
        if (!confirm('Are you sure you want to delete this article?')) {
            return;
        }

        try {
            let articles = await this.getArticles();
            articles = articles.filter(article => article.id !== id);
            await this.saveArticles(articles);
            await this.renderArticles('articles-list', true);
        } catch (error) {
            console.error('Error deleting article:', error);
            alert('Error deleting article: ' + error.message);
        }
    }
};