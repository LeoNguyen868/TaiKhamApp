let allAppointments = [];

// Add statusMap at the top level
const statusMap = {
    'pending': 'Chờ xác nhận',
    'confirmed': 'Đã xác nhận',
    'cancelled': 'Đã hủy',
    'completed': 'Đã hoàn thành'
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!checkAuthStatus()) {
        return;
    }

    // Update event listeners for tabs
    const statusTabs = document.querySelectorAll('.status-tab');
    statusTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            statusTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            tab.classList.add('active');
            // Filter appointments
            filterAppointments(tab.dataset.status);
        });
    });

    try {
        const patientData = await getPatient();
        await fetchAllAppointments(patientData.id);
    } catch (error) {
        console.error('Error loading data:', error);
    }

    // Add popup event listeners
    const popup = document.getElementById('appointmentDetailsPopup');
    const closeBtn = document.querySelector('.close-popup');

    closeBtn.addEventListener('click', () => {
        popup.classList.remove('active');
    });

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            popup.classList.remove('active');
        }
    });
});

async function getPatient() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData?.user_id) throw new Error('User ID not found');
        
        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/patients/user/${userData.user_id}`, {
            headers: { 'accept': 'application/json' }
        });
        return await response.json();
    } catch (error) {
        console.error('Error getting patient ID:', error);
        throw error;
    }
}

async function fetchAllAppointments(patientId) {
    try {
        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/appointments/patient/${patientId}`, {
            headers: { 'accept': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch appointments');
        }

        allAppointments = await response.json();
        displayAppointments(allAppointments);
    } catch (error) {
        console.error('Error fetching appointments:', error);
        document.getElementById('appointmentsList').innerHTML = 
            '<p class="error">Có lỗi xảy ra khi tải danh sách lịch hẹn</p>';
    }
}

function filterAppointments(selectedStatus) {
    const filteredAppointments = selectedStatus === 'all' 
        ? allAppointments
        : allAppointments.filter(app => app.status === selectedStatus);
    
    displayAppointments(filteredAppointments);
}

function displayAppointments(appointments) {
    const appointmentsListDiv = document.getElementById('appointmentsList');
    
    if (appointments.length === 0) {
        appointmentsListDiv.innerHTML = '<p>Không có lịch hẹn nào</p>';
        return;
    }

    const sortedAppointments = appointments.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
    );

    const appointmentsHTML = sortedAppointments.map(appointment => {
        const date = new Date(appointment.date + 'T00:00:00');
        const formattedDate = date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeString = appointment.time.substring(0, 5);

        return `
            <div class="appointment-item" onclick="showAppointmentDetails(${JSON.stringify(appointment).replace(/"/g, '&quot;')})">
                <p><strong>Ngày:</strong> ${formattedDate}</p>
                <p><strong>Giờ:</strong> ${timeString}</p>
                <p><strong>Trạng thái:</strong> <span class="status-${appointment.status}">${statusMap[appointment.status]}</span></p>
            </div>
        `;
    }).join('');

    appointmentsListDiv.innerHTML = appointmentsHTML;
}

function showAppointmentDetails(appointment) {
    const popup = document.getElementById('appointmentDetailsPopup');
    const detailsDiv = document.getElementById('appointmentDetails');
    const actionsDiv = document.getElementById('popupActions');

    const date = new Date(appointment.date + 'T00:00:00');
    const formattedDate = date.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    detailsDiv.innerHTML = `
        <div class="appointment-details">
            <p><strong>Phòng khám:</strong> Ngọc Hương</p>
            <p><strong>Mã lịch hẹn:</strong> ${appointment.id}</p>
            <p><strong>Ngày khám:</strong> ${formattedDate}</p>
            <p><strong>Giờ khám:</strong> ${appointment.time.substring(0, 5)}</p>
            <p><strong>Trạng thái:</strong> <span class="status-${appointment.status}">${statusMap[appointment.status]}</span></p>
            <p><strong>Ghi chú:</strong> ${appointment.symptoms || 'Không có'}</p>
            <p><strong>Địa điểm:</strong> 70 Quang Tiến, Đại Mỗ, Nam Từ Liêm, Hà Nội</p>
        </div>
    `;

    // Show actions based on appointment status
    let actionsHTML = '';
    if (appointment.status === 'pending') {
        actionsHTML = `
            <button onclick="editAppointment(${appointment.id})" class="btn btn-primary">Chỉnh sửa</button>
            <button onclick="cancelAppointment(${appointment.id})" class="btn btn-secondary">Hủy lịch hẹn</button>
        `;
    }
    actionsDiv.innerHTML = actionsHTML;

    popup.classList.add('active');
}

async function cancelAppointment(appointmentId) {
    if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) {
        return;
    }

    try {
        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/appointments/${appointmentId}/cancel`, {
            method: 'PUT',
            headers: { 'accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Failed to cancel appointment');
        }

        // Refresh appointments list
        const patientData = await getPatient();
        await fetchAllAppointments(patientData.id);
        
        // Close popup
        document.getElementById('appointmentDetailsPopup').classList.remove('active');
        
        // Show success message
        alert('Hủy lịch hẹn thành công');
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        alert('Có lỗi xảy ra khi hủy lịch hẹn');
    }
}

function editAppointment(appointmentId) {
    // Redirect to booking page with appointment ID
    window.location.href = `book.html?edit=${appointmentId}`;
}