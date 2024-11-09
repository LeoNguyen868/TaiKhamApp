document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const formMessage = document.getElementById('formMessage');
    const passwordToggles = document.querySelectorAll('.password-toggle');

    // Add password toggle functionality
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;

        formMessage.textContent = '';
        formMessage.className = 'form-message';

        // Check if passwords match
        if (password !== confirmPassword) {
            formMessage.textContent = 'Mật khẩu không khớp!';
            formMessage.className = 'form-message error';
            return;
        }

        try {
            // First validate the user data
            const validateResponse = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/users/validate', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password_hash: password,
                    email,
                    phone_number: phone,
                    role: 'user'
                })
            });

            if (!validateResponse.ok) {
                const validateData = await validateResponse.json();
                throw new Error(validateData.detail || 'Validation failed');
            }

            // If validation passes, create the user
            const createUserResponse = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/users/', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username,
                    password_hash: password,
                    email,
                    phone_number: phone,
                    role: 'user'
                })
            });

            const userData = await createUserResponse.json();

            if (!createUserResponse.ok) {
                throw new Error(userData.detail || 'Failed to create user');
            }

            // Create patient record
            const createPatientResponse = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/patients/', {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    user_id: userData.user_id,
                    monthly_subscription: false
                })
            });

            if (!createPatientResponse.ok) {
                throw new Error('Failed to create patient record');
            }

            formMessage.textContent = 'Đăng ký thành công! Đang chuyển hướng...';
            formMessage.className = 'form-message success';

            // Redirect to login page after successful registration
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);

        } catch (error) {
            formMessage.textContent = error.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
            formMessage.className = 'form-message error';
            console.error('Error:', error);
        }
    });
});