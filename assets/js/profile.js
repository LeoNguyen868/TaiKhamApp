document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Load user profile data
    loadUserProfile();

    // Edit profile button handler
    document.getElementById('editProfileBtn').addEventListener('click', function() {
        window.location.href = 'edit-profile.html';
    });
});

async function loadUserProfile() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const userId = userData.user_id;

        // First try to load from localStorage
        const cachedProfile = localStorage.getItem('userProfile');
        if (cachedProfile) {
            const profileData = JSON.parse(cachedProfile);
            updateProfileUI(profileData);
            return;
        }

        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");

        const requestOptions = {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        };

        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/users/profile/${userId}`, requestOptions);
        const data = await response.json();

        if (data) {
            // Store profile data in localStorage
            localStorage.setItem('userProfile', JSON.stringify(data));
            updateProfileUI(data);
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        showNotification('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.', 'error');
    }
}

function updateProfileUI(data) {
    userData=JSON.parse(localStorage.getItem('userData'));
    document.getElementById('fullName').textContent = data.full_name || 'Chưa cập nhật';
    document.getElementById('email').textContent = userData.email || 'Chưa cập nhật';
    document.getElementById('phone').textContent = userData.phone_number || 'Chưa cập nhật';
    document.getElementById('birthDate').textContent = formatDate(data.date_of_birth) || 'Chưa cập nhật';
    document.getElementById('gender').textContent = formatGender(data.gender) || 'Chưa cập nhật';
    document.getElementById('bio').textContent = data.bio || 'Chưa cập nhật';
    document.getElementById('address').textContent = data.address || 'Chưa cập nhật';
    document.getElementById('emergencyContact').textContent = data.emergency_contact || 'Chưa cập nhật';
    document.getElementById('emergencyRelation').textContent = data.emergency_contact_relationship || 'Chưa cập nhật';
}

// Helper function to format date
function formatDate(dateString) {
    if (!dateString) return null;
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Helper function to format gender
function formatGender(gender) {
    if (!gender) return null;
    return gender === 'M' ? 'Nam' : gender === 'F' ? 'Nữ' : 'Khác';
}

// Add notification function to profile.js as well
function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}