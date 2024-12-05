function checkAuth() {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'admin.html';
    }
}

function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'admin.html';
} 