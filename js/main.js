// 显示研究领域
function displayResearchAreas() {
    const container = document.getElementById('research-areas');
    researchAreas.forEach(area => {
        const tag = document.createElement('span');
        tag.className = 'bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full';
        tag.textContent = area;
        container.appendChild(tag);
    });
}

// 显示简短简介
function displayBio() {
    document.getElementById('short-bio').textContent = shortBio;
    document.getElementById('bio-content').innerHTML = fullBio;
}

// 显示文章类别过滤器
function displayCategoryFilter() {
    const container = document.getElementById('category-filter');
    const articles = window.getArticlesFromStorage();
    const categories = [...new Set(articles.flatMap(article => article.categories))];
    
    container.innerHTML = `
        <div class="flex flex-wrap gap-2">
            <button 
                class="category-btn active bg-blue-600 text-white px-4 py-2 rounded-md text-sm"
                data-category="all"
            >
                All
            </button>
            ${categories.map(category => `
                <button 
                    class="category-btn bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md text-sm"
                    data-category="${category}"
                >
                    ${category}
                </button>
            `).join('')}
        </div>
    `;

    // 添加过滤器事件监听
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => filterArticles(btn.dataset.category));
    });
}

// 显示文章列表
function displayArticles(filteredArticles) {
    // 如果没有传入过滤后的文章，则从存储中获取所有文章
    const articles = filteredArticles || window.getArticlesFromStorage();
    const container = document.getElementById('articles-list');
    
    container.innerHTML = articles.map(article => `
        <div class="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 class="text-xl font-semibold mb-2">
                <a href="#" class="hover:text-blue-600" onclick="showArticleModal(${article.id}); return false;">
                    ${article.title}
                </a>
            </h3>
            <div class="flex flex-wrap gap-2 mb-3">
                ${article.categories.map(category => 
                    `<span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        ${category}
                    </span>`
                ).join('')}
            </div>
            <p class="text-gray-600 text-sm mb-2">${article.authors}</p>
            <p class="text-gray-500 text-sm">${article.date}</p>
        </div>
    `).join('');
}

// 过滤文章
function filterArticles(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-200');
    });
    
    const activeBtn = document.querySelector(`[data-category="${category}"]`);
    activeBtn.classList.add('active', 'bg-blue-600', 'text-white');
    activeBtn.classList.remove('bg-gray-200');

    const articles = window.getArticlesFromStorage();
    const filteredArticles = category === 'all' 
        ? articles 
        : articles.filter(article => article.categories.includes(category));
    
    displayArticles(filteredArticles);
}

// 显示文章详情模态框
function showArticleModal(articleId) {
    const articles = window.getArticlesFromStorage();
    const article = articles.find(a => a.id === articleId);
    if (!article) return;

    document.getElementById('modal-title').textContent = article.title;
    document.getElementById('modal-authors').textContent = article.authors;
    document.getElementById('modal-date').textContent = article.date;
    document.getElementById('modal-abstract').textContent = article.abstract;
    document.getElementById('modal-pdf').href = article.pdfUrl;
    
    document.getElementById('modal-categories').innerHTML = article.categories
        .map(category => `
            <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                ${category}
            </span>
        `).join('');

    document.getElementById('article-modal').classList.remove('hidden');
    document.getElementById('article-modal').classList.add('flex');
}

// 关闭文章详情模态框
function closeModal() {
    document.getElementById('article-modal').classList.add('hidden');
    document.getElementById('article-modal').classList.remove('flex');
}

// 显示完整简介模态框
function showBioModal() {
    document.getElementById('bio-modal').classList.remove('hidden');
    document.getElementById('bio-modal').classList.add('flex');
}

// 关闭简介模态框
function closeBioModal() {
    document.getElementById('bio-modal').classList.add('hidden');
    document.getElementById('bio-modal').classList.remove('flex');
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 确保数据已经初始化
    if (!localStorage.getItem('articles')) {
        window.saveArticlesToStorage();
    }
    
    displayResearchAreas();
    displayBio();
    displayCategoryFilter();
    displayArticles();
    
    // 设置年份
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // 设置 Read More 按钮事件
    document.getElementById('read-more-btn').addEventListener('click', showBioModal);
}); 