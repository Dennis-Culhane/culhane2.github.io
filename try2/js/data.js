const GITHUB_REPO_URL = 'https://dennis-culhane.github.io/culhane2.github.io';

const researchAreas = [
    "Homelessness",
    "Housing Policy",
    "Social Policy",
    "Integrated Data Systems",
    "Policy Analysis"
];

const shortBio = "Dennis P. Culhane is the Dana and Andrew Stone Professor of Social Policy...";

const fullBio = `
    <p>Dennis P. Culhane is the Dana and Andrew Stone Professor...</p>
    <!-- 其他简介内容 -->
`;

// 默认文章数据
const defaultArticles = [
    {
        id: 1,
        title: "Understanding Homelessness Prevention",
        authors: "Dennis P. Culhane, Dan Treglia, Randall Kuhn",
        date: "2023",
        categories: ["Homelessness", "Policy Analysis"],
        abstract: "This paper examines the effectiveness of homelessness prevention programs...",
        pdfUrl: `${GITHUB_REPO_URL}/papers/homelessness-prevention-2023.pdf`
    },
    {
        id: 2,
        title: "Integrated Data Systems in Policy Research",
        authors: "Dennis P. Culhane, John Fantuzzo",
        date: "2022",
        categories: ["Integrated Data Systems", "Policy Analysis"],
        abstract: "A comprehensive review of integrated data systems...",
        pdfUrl: `${GITHUB_REPO_URL}/papers/integrated-data-2022.pdf`
    },
    {
        id: 3,
        title: "Housing First for People with Severe Mental Illness",
        authors: "Dennis P. Culhane, Stephen Metraux",
        date: "2023",
        categories: ["Housing Policy", "Social Policy"],
        abstract: "An evaluation of Housing First programs for individuals with severe mental illness...",
        pdfUrl: `${GITHUB_REPO_URL}/papers/housing-first-2023.pdf`
    },
    {
        id: 4,
        title: "Youth Homelessness: Patterns and Interventions",
        authors: "Dennis P. Culhane, Matthew Morton",
        date: "2022",
        categories: ["Homelessness", "Social Policy"],
        abstract: "A comprehensive analysis of youth homelessness patterns and effective interventions...",
        pdfUrl: `${GITHUB_REPO_URL}/papers/youth-homelessness-2022.pdf`
    }
];

// 修改 GitHub API URL 和数据存储路径
const GITHUB_API_URL = 'https://api.github.com/repos/Dennis-Culhane/culhane2.github.io';
const DATA_PATH = 'data/articles.json';

// 从 GitHub 获取文章数据
async function getArticlesFromGitHub() {
    try {
        console.log('Fetching articles from GitHub...');
        const response = await fetch(`${GITHUB_API_URL}/contents/${DATA_PATH}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
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

// 保存文章数据到 GitHub
async function saveArticlesToGitHub(articles) {
    try {
        console.log('Starting save to GitHub...');
        
        // 获取现有文件的 SHA
        let sha = '';
        try {
            const response = await fetch(`${GITHUB_API_URL}/contents/${DATA_PATH}`, {
                headers: {
                    'Authorization': `Bearer ${GITHUB_CONFIG.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                sha = data.sha;
                console.log('Existing file SHA:', sha);
            }
        } catch (error) {
            console.log('No existing file found');
        }

        // 准备文件内容
        const content = utf8ToBase64(JSON.stringify(articles, null, 2));
        
        // 准备请求体
        const body = {
            message: 'Update articles data',
            content: content,
            branch: 'main'
        };

        if (sha) {
            body.sha = sha;
        }

        // 发送保存请求
        console.log('Sending save request...');
        const saveResponse = await fetch(`${GITHUB_API_URL}/contents/${DATA_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(body)
        });

        if (!saveResponse.ok) {
            const errorData = await saveResponse.json();
            console.error('GitHub API Error:', errorData);
            throw new Error(`GitHub API Error: ${errorData.message}`);
        }

        const responseData = await saveResponse.json();
        console.log('Save successful:', responseData);
        return true;
    } catch (error) {
        console.error('Error saving articles:', error);
        throw new Error('Failed to save articles: ' + error.message);
    }
}

// UTF-8 编码辅助函数
function utf8ToBase64(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode('0x' + p1);
        }));
}

// 导出函数
window.getArticlesFromStorage = getArticlesFromGitHub;
window.saveArticlesToStorage = saveArticlesToGitHub;