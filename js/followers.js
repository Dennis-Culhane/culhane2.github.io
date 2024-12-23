const FollowersManager = {
    async getFollowers() {
        try {
            const token = sessionStorage.getItem('github_token');
            const headers = {
                'Accept': 'application/vnd.github.v3+json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${config.apiBaseUrl}/contents/data/followers.json`, {
                headers: headers
            });

            if (response.status === 404) {
                return [];
            }

            const data = await response.json();
            return JSON.parse(atob(data.content));
        } catch (error) {
            console.error('Error fetching followers:', error);
            return [];
        }
    },

    async saveFollowers(followers) {
        const token = sessionStorage.getItem('github_token');
        if (!token) {
            throw new Error('GitHub token is required for admin operations');
        }

        try {
            // 获取现有文件的 SHA
            let sha = '';
            try {
                const response = await fetch(`${config.apiBaseUrl}/contents/data/followers.json`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    sha = data.sha;
                }
            } catch (error) {
                console.log('No existing followers file');
            }

            // 保存更新后的数据
            const content = btoa(JSON.stringify(followers, null, 2));
            const body = {
                message: '[skip ci] Update followers list',
                content: content,
                branch: config.branch
            };

            if (sha) {
                body.sha = sha;
            }

            const saveResponse = await fetch(`${config.apiBaseUrl}/contents/data/followers.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(body)
            });

            if (!saveResponse.ok) {
                throw new Error('Failed to save followers');
            }

            return true;
        } catch (error) {
            console.error('Error saving followers:', error);
            throw error;
        }
    },

    async addFollower(email) {
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }

        const followers = await this.getFollowers();
        if (followers.includes(email)) {
            throw new Error('Email already subscribed');
        }

        followers.push(email);
        await this.saveFollowers(followers);
        return true;
    },

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
}; 