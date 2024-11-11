document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'login.html';
        return;
    }

    // Load current profile data
    loadProfileData();

    // Handle form submission
    document.getElementById('editProfileForm').addEventListener('submit', handleSubmit);

    // Add event listener for date input to format display
    const birthDateInput = document.getElementById('birthDate');
    birthDateInput.addEventListener('change', function(e) {
        if (this.value) {
            const date = new Date(this.value);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            this.setAttribute('data-formatted-date', `${day}/${month}/${year}`);
        }
    });
});

async function loadProfileData() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const userId = userData.user_id;

        const myHeaders = new Headers();
        myHeaders.append("accept", "application/json");

        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/users/profile/${userId}`, {
            method: "GET",
            headers: myHeaders,
            redirect: "follow"
        });

        const data = await response.json();

        // Format date before setting value
        const date = data.date_of_birth ? new Date(data.date_of_birth) : null;
        if (date) {
            // Ensure valid date before formatting
            if (!isNaN(date.getTime())) {
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                // Set the HTML5 date input value (must remain YYYY-MM-DD for the input to work)
                document.getElementById('birthDate').value = `${year}-${month}-${day}`;
                // Store the formatted date in DD/MM/YYYY format as a data attribute
                document.getElementById('birthDate').setAttribute('data-formatted-date', `${day}/${month}/${year}`);
            }
        }

        // Set other form fields
        document.getElementById('fullName').value = data.full_name || '';
        document.getElementById('gender').value = data.gender || '';
        document.getElementById('bio').value = data.bio || '';
        document.getElementById('address').value = data.address || '';
        document.getElementById('emergencyContact').value = data.emergency_contact || '';
        document.getElementById('emergencyRelation').value = data.emergency_contact_relationship || '';

    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.');
    }
}

function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide and remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

async function handleSubmit(event) {
    event.preventDefault();

    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        const userId = userData.user_id;

        // Get form data and format it according to API requirements
        const formData = {
            full_name: document.getElementById('fullName').value,
            date_of_birth: document.getElementById('birthDate').value, // This will automatically be YYYY-MM-DD
            gender: document.getElementById('gender').value,
            bio: document.getElementById('bio').value,
            address: document.getElementById('address').value,
            emergency_contact: document.getElementById('emergencyContact').value,
            emergency_contact_relationship: document.getElementById('emergencyRelation').value
        };
        localStorage.setItem('userProfile', JSON.stringify(formData));

        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/users/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const result = await response.json();
            showNotification('Cập nhật thông tin thành công!');
            setTimeout(() => window.location.href = 'profile.html', 1500);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Cập nhật thất bại');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification(error.message || 'Không thể cập nhật thông tin. Vui lòng thử lại sau.', 'error');
    }
}