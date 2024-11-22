const GITHUB_REPO_URL = 'https://dennis-culhane.github.io/Culhane.github.io';

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

// 本地存储功能
function saveArticlesToStorage(articles) {
    try {
        if (!Array.isArray(articles)) {
            throw new Error('Invalid articles data type');
        }
        localStorage.setItem('articles', JSON.stringify(articles));
        console.log('Saved articles count:', articles.length);
    } catch (error) {
        console.error('Error saving articles:', error);
        throw error;
    }
}

function getArticlesFromStorage() {
    try {
        const storedArticles = localStorage.getItem('articles');
        if (!storedArticles) {
            return defaultArticles;
        }
        const articles = JSON.parse(storedArticles);
        if (!Array.isArray(articles)) {
            console.error('Invalid stored data format');
            return defaultArticles;
        }
        return articles;
    } catch (error) {
        console.error('Error getting articles:', error);
        return defaultArticles;
    }
}

// 添加初始化标志
let isInitialized = false;

function initializeStorage() {
    if (isInitialized) {
        return;
    }

    try {
        const existingArticles = localStorage.getItem('articles');
        if (!existingArticles || existingArticles === '[]' || existingArticles === 'null') {
            console.log('Initializing storage with default articles');
            saveArticlesToStorage(defaultArticles);
        } else {
            try {
                const articles = JSON.parse(existingArticles);
                if (!Array.isArray(articles) || articles.length === 0) {
                    console.log('Invalid or empty articles array, reinitializing');
                    saveArticlesToStorage(defaultArticles);
                } else {
                    console.log('Storage initialized with', articles.length, 'articles');
                }
            } catch (error) {
                console.error('Error parsing stored articles, reinitializing:', error);
                saveArticlesToStorage(defaultArticles);
            }
        }
        isInitialized = true;
    } catch (error) {
        console.error('Error during initialization:', error);
        saveArticlesToStorage(defaultArticles);
        isInitialized = true;
    }
}

// 修改初始化调用
document.addEventListener('DOMContentLoaded', () => {
    if (!isInitialized) {
        console.log('Starting storage initialization');
        initializeStorage();
        console.log('Storage initialization complete');
    }
});

// 导出函数要放在最后
window.saveArticlesToStorage = saveArticlesToStorage;
window.getArticlesFromStorage = getArticlesFromStorage;