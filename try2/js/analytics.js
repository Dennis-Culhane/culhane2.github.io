// 检查认证状态
function checkAuth() {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = '/admin.html';
    }
}

// 登出功能
function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/admin.html';
}

// 模拟分析数据
const analyticsData = {
    downloads: {
        total: 1547,
        byDate: {
            // 最近30天的数据
            dates: Array.from({length: 30}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().split('T')[0];
            }).reverse(),
            counts: Array.from({length: 30}, () => Math.floor(Math.random() * 50 + 10))
        },
        byCategory: {
            'Homelessness': 623,
            'Assisted Housing Policy': 489,
            'Policy Analysis Research Methods': 435
        },
        byCountry: {
            'United States': 845,
            'United Kingdom': 234,
            'Canada': 156,
            'Australia': 123,
            'Others': 189
        },
        topArticles: articlesData.map(article => ({
            ...article,
            downloads: Math.floor(Math.random() * 500 + 100)
        })).sort((a, b) => b.downloads - a.downloads)
    }
};

// 创建下载趋势图
function createTrendsChart() {
    const ctx = document.getElementById('trends-chart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: analyticsData.downloads.byDate.dates,
            datasets: [{
                label: 'Downloads',
                data: analyticsData.downloads.byDate.counts,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 创建分类分布图
function createCategoryChart() {
    const ctx = document.getElementById('category-chart').getContext('2d');
    const data = analyticsData.downloads.byCategory;
    
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// 创建地理分布图
function createGeoChart() {
    const ctx = document.getElementById('geo-chart').getContext('2d');
    const data = analyticsData.downloads.byCountry;
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                data: Object.values(data),
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// 更新统计数据
function updateStats() {
    document.getElementById('total-downloads').textContent = analyticsData.downloads.total;
    document.getElementById('most-downloaded').textContent = analyticsData.downloads.topArticles[0].title;
    document.getElementById('avg-downloads').textContent = 
        Math.round(analyticsData.downloads.total / 30);
}

// 更新热门文章列表
function updateTopArticles() {
    const container = document.getElementById('top-articles');
    container.innerHTML = analyticsData.downloads.topArticles
        .slice(0, 5)
        .map((article, index) => `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <span class="text-lg font-bold text-gray-500 w-8">#${index + 1}</span>
                    <div>
                        <p class="font-medium text-gray-900">${article.title}</p>
                        <p class="text-sm text-gray-500">${article.category}</p>
                    </div>
                </div>
                <span class="font-medium text-blue-600">${article.downloads} downloads</span>
            </div>
        `).join('');
}

// 更新所有图表
function updateCharts() {
    // 在实际应用中，这里应该根据选择的过滤器重新获取数据
    createTrendsChart();
    createCategoryChart();
    createGeoChart();
    updateStats();
    updateTopArticles();
}

// 页面加载时执行
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    updateCharts();
}); 