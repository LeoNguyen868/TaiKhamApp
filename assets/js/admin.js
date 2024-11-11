document.addEventListener('DOMContentLoaded', function() {
    // Import logout function from auth.js
    const logoutHandler = () => {
        localStorage.clear();
        window.location.href = '/index.html';
    };

    // Add event listener for logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutHandler);
    }

    // Replace sample data with empty array
    let appointments = [];
    let currentFilter = 'all';

    // Add cache helper functions
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    
    function getCache(key) {
        const cached = localStorage.getItem(key);
        if (!cached) return null;
        
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_DURATION) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    }

    function setCache(key, data) {
        const cache = {
            timestamp: Date.now(),
            data
        };
        localStorage.setItem(key, JSON.stringify(cache));
    }

    // Add API functions
    async function fetchAppointments() {
        try {
            const cached = getCache('appointments');
            if (cached) return cached;

            const response = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/appointments/');
            const data = await response.json();
            setCache('appointments', data);
            return data;
        } catch (error) {
            console.error('Error fetching appointments:', error);
            return getCache('appointments') || [];
        }
    }

    async function fetchPatientInfo(patientId) {
        try {
            const cacheKey = `patient_${patientId}`;
            const cached = getCache(cacheKey);
            if (cached) return cached;

            const userResponse = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/users/by-patient/${patientId}`);
            const userData = await userResponse.json();
            
            const profileResponse = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/users/profile/${userData.user_id}`);
            const profileData = await profileResponse.json();
            
            const data = { ...userData, ...profileData };
            setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching patient info:', error);
            return getCache(`patient_${patientId}`) || null;
        }
    }

    // Add complete appointment function
    async function completeAppointment(appointmentId) {
        try {
            const response = await fetch(
                `https://carecab-9773d1d0a8c1.herokuapp.com/appointments/${appointmentId}/staff-complete`,
                {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                localStorage.removeItem('appointments'); // Clear appointments cache
                showNotification('Đã hoàn thành lịch hẹn!');
                await renderAppointments();
            } else {
                throw new Error('Failed to complete appointment');
            }
        } catch (error) {
            console.error('Error completing appointment:', error);
            showNotification('Không thể cập nhật trạng thái. Vui lòng thử lại!', 'error');
        }
    }

    // Add filter function
    function filterAppointments(appointments, status) {
        if (status === 'all') return appointments;
        return appointments.filter(apt => apt.status === status);
    }

    // Update render function to handle API data
    async function renderAppointments() {
        const appointmentsData = await fetchAppointments();
        appointments = await Promise.all(appointmentsData.map(async (apt) => {
            const patientInfo = await fetchPatientInfo(apt.patient_id);
            
            // Format time from "HH:mm:00Z" to "HH:mm"
            const timeStr = apt.time.split(':00Z')[0];
            
            // Format date from "YYYY-MM-DD" to "DD/MM/YYYY"
            const dateStr = apt.date.split('-').reverse().join('/');
            
            return {
                id: apt.id,
                patientName: patientInfo?.full_name || 'Unknown',
                patientId: apt.patient_id,
                date: dateStr,
                time: timeStr,
                phone: patientInfo?.phone_number || 'N/A',
                reason: apt.symptoms || 'Không có',
                status: apt.status
            };
        }));

        const filteredAppointments = filterAppointments(appointments, currentFilter);

        // Update table view with separated time and date columns
        const tableHtml = `
            <table class="appointments-table">
                <thead>
                    <tr>
                        <th>Mã lịch hẹn</th>
                        <th>Mã BN</th>
                        <th>Tên bệnh nhân</th>
                        <th>Giờ</th>
                        <th>Ngày</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredAppointments.map(appointment => `
                        <tr data-id="${appointment.id}">
                            <td>${appointment.id}</td>
                            <td>${appointment.patientId}</td>
                            <td>${appointment.patientName}</td>
                            <td>${appointment.time}</td>
                            <td>${appointment.date}</td>
                            <td>${getStatusBadge(appointment.status)}</td>
                            <td>
                                ${appointment.status === 'pending' ? 
                                    `<button class="btn-confirm" data-appointment-id="${appointment.id}">
                                        <i class="fas fa-check"></i> Xác nhận
                                    </button>` : ''}
                                ${appointment.status === 'confirmed' ? 
                                    `<button class="btn-complete" data-appointment-id="${appointment.id}">
                                        <i class="fas fa-check"></i> Hoàn thành
                                    </button>` : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        appointmentsList.innerHTML = tableHtml;

        // Update card view with new date format
        const appointmentsCards = document.getElementById('appointmentsCards');
        const cardsHtml = filteredAppointments.map(appointment => `
            <div class="appointment-card" data-id="${appointment.id}">
                <div class="appointment-card-header">
                    <h3>${appointment.patientName}</h3>
                    ${getStatusBadge(appointment.status)}
                </div>
                <div class="appointment-card-body">
                    <p><i class="fas fa-calendar-check"></i> <strong>Mã lịch hẹn:</strong> ${appointment.id}</p>
                    <p><i class="fas fa-user-tag"></i> <strong>Mã BN:</strong> ${appointment.patientId}</p>
                    <p><i class="far fa-clock"></i> <strong>Giờ:</strong> ${appointment.time}</p>
                    <p><i class="far fa-calendar-alt"></i> <strong>Ngày:</strong> ${appointment.date}</p>
                    ${appointment.status === 'pending' ? 
                        `<button class="btn-confirm" data-appointment-id="${appointment.id}">
                            <i class="fas fa-check"></i> Xác nhận
                        </button>` : ''}
                    ${appointment.status === 'confirmed' ? 
                        `<button class="btn-complete" data-appointment-id="${appointment.id}">
                            <i class="fas fa-check"></i> Hoàn thành
                        </button>` : ''}
                </div>
            </div>
        `).join('');
        appointmentsCards.innerHTML = cardsHtml;
    }

    // Add loading state
    function showLoading() {
        appointmentsList.innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
        document.getElementById('appointmentsCards').innerHTML = '<div class="loading">Đang tải dữ liệu...</div>';
    }

    const appointmentsList = document.getElementById('appointmentsList');
    const popup = document.getElementById('appointmentPopup');
    const closePopupBtn = document.querySelector('.close-popup');
    const closeBtn = document.querySelector('.close-btn'); // Chỉ khai báo một lần
    const confirmBtn = document.querySelector('.confirm-btn');

    function getStatusBadge(status) {
        const statusMap = {
            pending: '<span class="status-badge status-pending">Chờ xác nhận</span>',
            confirmed: '<span class="status-badge status-confirmed">Đã xác nhận</span>',
            cancelled: '<span class="status-badge status-cancelled">Đã hủy</span>',
            completed: '<span class="status-badge status-completed">Đã hoàn thành</span>'
        };
        return statusMap[status] || status;
    }

    // Thay thế hàm showNotification cũ
    function showNotification(message, type = 'success') {
        const messageContainer = document.getElementById('messageContainer');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        // Xóa thông báo cũ nếu có
        messageContainer.innerHTML = '';
        
        // Thêm thông báo mới
        messageContainer.appendChild(messageElement);
        
        // Tự động xóa sau 5 giây
        setTimeout(() => {
            messageElement.remove();
        }, 500);
    }

    // Update confirmation function
    async function confirmAppointment(appointmentId) {
        try {
            const response = await fetch(
                `https://carecab-9773d1d0a8c1.herokuapp.com/appointments/${appointmentId}/nurse-confirm?nurse_id=1`,
                {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json'
                    }
                }
            );
            
            if (response.ok) {
                localStorage.removeItem('appointments'); // Clear appointments cache
                showNotification('Xác nhận lịch hẹn thành công!');
                await renderAppointments();
            } else {
                throw new Error('Failed to confirm appointment');
            }
        } catch (error) {
            console.error('Error confirming appointment:', error);
            showNotification('Không thể xác nhận lịch hẹn. Vui lòng thử lại!', 'error');
        }
    }

    function showAppointmentDetails(appointment) {
        const appointmentDetails = document.getElementById('appointmentDetails');
        appointmentDetails.innerHTML = `
            <div class="appointment-details" data-appointment-id="${appointment.id}">
                <p><strong>Mã lịch hẹn:</strong> ${appointment.id}</p>
                <p><strong>Mã bệnh nhân:</strong> ${appointment.patientId}</p>
                <p><strong>Tên bệnh nhân:</strong> ${appointment.patientName}</p>
                <p><strong>Giờ hẹn:</strong> ${appointment.time}</p>
                <p><strong>Ngày hẹn:</strong> ${appointment.date}</p>
                <p><strong>Số điện thoại:</strong> ${appointment.phone}</p>
                <p><strong>Lý do tái khám:</strong> ${appointment.reason}</p>
                <p><strong>Trạng thái:</strong> ${getStatusBadge(appointment.status)}</p>
            </div>
        `;
        popup.classList.add('active');
    }

    // Event listeners
    document.addEventListener('click', (e) => {
        // Nếu click vào nút hoặc icon trong nút, không xử lý sự kiện
        if (e.target.closest('.btn-confirm') || 
            e.target.closest('.btn-complete') || 
            e.target.closest('.fas')) {
            return;
        }

        const row = e.target.closest('tr');
        const card = e.target.closest('.appointment-card');
        const element = row || card;

        if (element && element.dataset.id) {
            const appointmentId = parseInt(element.dataset.id);
            const appointment = appointments.find(a => a.id === appointmentId);
            if (appointment) {
                showAppointmentDetails(appointment);
            }
        }
    }, true); // Thêm capture phase

    // Add event listener for complete and confirm buttons
    document.addEventListener('click', async (e) => {
        const completeBtn = e.target.closest('.btn-complete');
        const confirmBtn = e.target.closest('.btn-confirm');
        
        if (completeBtn || confirmBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            if (completeBtn) {
                const appointmentId = completeBtn.dataset.appointmentId;
                await completeAppointment(appointmentId);
            }
            
            if (confirmBtn) {
                const appointmentId = confirmBtn.dataset.appointmentId;
                await confirmAppointment(appointmentId);
            }
        }
    }, true); // Thêm capture phase

    // Close popup handlers
    const closePopup = () => {
        popup.classList.remove('active');
    };

    [closePopupBtn, closeBtn].forEach(btn => {
        if (btn) btn.addEventListener('click', closePopup);
    });

    // Click outside to close
    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            closePopup();
        }
    });

    confirmBtn.addEventListener('click', async () => {
        const currentAppointmentId = popup.querySelector('.appointment-details')?.dataset.appointmentId;
        if (currentAppointmentId) {
            await confirmAppointment(currentAppointmentId);
            closePopup();
        }
    });

    // Add filter click handlers
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.status;
            renderAppointments();
        });
    });

    // Update settings click handler
    document.querySelector('a[href="settings.html"]').addEventListener('click', function(e) {
        e.preventDefault();
        showNotification('Tính năng đang được phát triển!', 'info');
    });

    // Initialize with loading
    showLoading();
    renderAppointments();
});
