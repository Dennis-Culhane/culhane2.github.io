window.toggleArticleSelection = toggleArticleSelection;
window.toggleSelectMode = toggleSelectMode;
window.deleteSelected = deleteSelected;
window.editArticle = editArticle;

// 添加文件上传函数
async function uploadFileToGitHub(file, fileName) {
    try {
        // 将文件转换为 Base64
        const base64Content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(file);
        });

        // GitHub API 配置
        const apiUrl = `https://api.github.com/repos/Dennis-Culhane/culhane2.github.io/contents/papers/${fileName}`;
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`, // 需要设置您的 GitHub Token
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload paper: ${fileName}`,
                content: base64Content
            })
        });

        if (!response.ok) {
            throw new Error('Failed to upload file to GitHub');
        }

        return `${GITHUB_REPO_URL}/papers/${fileName}`;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// 修改 handleArticleSubmit 函数
window.handleArticleSubmit = async function(formData) {
    try {
        // 验证表单数据
        const pdfFile = formData.get('pdf-file');
        if (!pdfFile) throw new Error('PDF file is required');

        // 上传文件到 GitHub
        const fileUrl = await uploadFileToGitHub(pdfFile, pdfFile.name);
        
        // 创建文章对象
        const newArticle = {
            title: formData.get('title'),
            authors: formData.get('authors'),
            date: formData.get('date'),
            categories: Array.from(window.selectedCategories || []),
            abstract: formData.get('abstract'),
            fileName: pdfFile.name,
            pdfUrl: fileUrl
        };

        // 保存文章数据
        const savedArticle = saveArticle(newArticle);
        
        console.log('Article saved successfully:', savedArticle);
        alert('Article added successfully!');
        return savedArticle;
    } catch (error) {
        console.error('Error saving article:', error);
        alert('Error saving article: ' + error.message);
        throw error;
    }
};