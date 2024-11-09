document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuthStatus()) {
        return;
    }

    // Hiển thị thông tin người dùng đầy đủ hơn
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.username;
        }
    }
});
