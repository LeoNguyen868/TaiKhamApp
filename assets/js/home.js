document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuthStatus()) {
        return;
    }

    // Load user profile data
    await loadUserProfile();

    // Lấy và lưu thông tin bệnh nhân
    try {
        const patientData = await getPatient();
        localStorage.setItem('patientData', JSON.stringify(patientData));
        
        // Sau khi có thông tin bệnh nhân, lấy danh sách cuộc hẹn
        await fetchAppointments(patientData.id);
    } catch (error) {
        console.error('Error loading data:', error);
    }
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
    }
}

function updateProfileUI(data) {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = data.full_name || data.username;
    }

    // Update other profile elements if they exist
    const profileInfoElement = document.getElementById('profileInfo');
    if (profileInfoElement) {
        profileInfoElement.innerHTML = `
            <p><strong>Email:</strong> ${userData.email || 'Chưa cập nhật'}</p>
            <p><strong>Số điện thoại:</strong> ${userData.phone_number || 'Chưa cập nhật'}</p>
        `;
    }
}

async function getPatient() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData?.user_id) throw new Error('User ID not found');
        
        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/patients/user/${userData.user_id}`, {
            headers: { 'accept': 'application/json' }
        });
        const patientData = await response.json();
        
        // Lưu thông tin bệnh nhân vào localStorage
        if (patientData) {
            localStorage.setItem('patientData', JSON.stringify(patientData));
        }
        
        return patientData;
    } catch (error) {
        console.error('Error getting patient ID:', error);
        throw error;
    }
}

async function fetchAppointments(patientId) {
    try {
        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/appointments/patient/${patientId}`, {
            headers: { 'accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        const appointments = await response.json();
        
        const upcomingAppointmentsDiv = document.getElementById('upcomingAppointments');
        if (!upcomingAppointmentsDiv) return;

        // Lấy ngày hiện tại và ngày sau 5 ngày, đặt giờ về 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const fiveDaysFromNow = new Date();
        fiveDaysFromNow.setDate(today.getDate() + 5);
        fiveDaysFromNow.setHours(23, 59, 59, 999);

        const upcomingAppointments = appointments
            .filter(appointment => {
                // Chuyển đổi ngày từ UTC sang local time
                const appointmentDate = new Date(appointment.date + 'T00:00:00');
                return appointmentDate >= today && 
                       appointmentDate <= fiveDaysFromNow && 
                       (appointment.status === 'pending' || appointment.status === 'confirmed');
            })
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingAppointments.length === 0) {
            upcomingAppointmentsDiv.innerHTML = '<p>Không có lịch hẹn nào trong 5 ngày tới</p>';
            return;
        }

        const appointmentsHTML = upcomingAppointments.map(appointment => {
            // Format date
            const date = new Date(appointment.date + 'T00:00:00');
            const formattedDate = date.toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const timeString = appointment.time.substring(0, 5);

            const statusMap = {
                'pending': 'Chờ xác nhận',
                'confirmed': 'Đã xác nhận',
                'cancelled': 'Đã hủy',
                'completed': 'Đã hoàn thành'
            };

            return `
                <div class="appointment-item" onclick="window.location.href='appointments.html'">
                    <p><strong>Ngày:</strong> ${formattedDate}</p>
                    <p><strong>Giờ:</strong> ${timeString}</p>
                    <p><strong>Trạng thái:</strong> <span class="status-${appointment.status}">${statusMap[appointment.status]}</span></p>
                </div>
            `;
        }).join('');

        upcomingAppointmentsDiv.innerHTML = appointmentsHTML;
    } catch (error) {
        console.error('Error fetching appointments:', error);
    }
}


