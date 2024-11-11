const checkAuthStatus = () => {
    const userData = localStorage.getItem('userData');
    const currentPath = window.location.pathname;
    
    // If on login page
    if (currentPath === '/index.html' || currentPath === '/') {
        if (userData) {
            const user = JSON.parse(userData);
            // Redirect based on role
            window.location.href = user.role === 'admin' ? '/admin.html' : '/home.html';
        }
    } 
    // If on protected pages
    else if (currentPath === '/home.html' || currentPath === '/book.html' || currentPath === '/admin.html') {
        if (!userData) {
            // User is not logged in, redirect to login
            window.location.href = '/index.html';
        } else {
            const user = JSON.parse(userData);
            // Check if admin trying to access user pages or vice versa
            if ((user.role === 'admin' && (currentPath === '/home.html' || currentPath === '/book.html')) ||
                (user.role === 'user' && currentPath === '/admin.html')) {
                window.location.href = user.role === 'admin' ? '/admin.html' : '/home.html';
            }
        }
    }
    if (userData) return true;
    return false;
};

document.addEventListener('DOMContentLoaded', function() {
    // Check auth status on page load
    checkAuthStatus();
    
    const loginForm = document.getElementById('loginForm');
    const formMessage = document.getElementById('formMessage');

    // Add logout handler
    const logoutHandler = () => {
        localStorage.clear(); // Clear all data from localStorage
        window.location.href = '/index.html'; // Redirect to login page
    };

    // Add event listener for logout if button exists
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutHandler);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // Reset message
            formMessage.textContent = '';
            formMessage.className = 'form-message';

            try {
                const response = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/auth/login', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (response.ok) {
                    // Store token and user data
                    localStorage.setItem('userData', JSON.stringify(result.data));
                    
                    formMessage.textContent = 'Đăng nhập thành công!';
                    formMessage.className = 'form-message success';
                    
                    setTimeout(() => {
                        // Redirect based on role
                        const redirectPath = result.data.role === 'admin' ? '/admin.html' : '/home.html';
                        window.location.href = redirectPath;
                    }, 1000);
                } else {
                    formMessage.textContent = result.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
                    formMessage.className = 'form-message error';
                }
            } catch (error) {
                formMessage.textContent = 'Có lỗi xảy ra. Vui lòng thử lại sau.';
                formMessage.className = 'form-message error';
                console.error('Error:', error);
            }
        });
    }
});
