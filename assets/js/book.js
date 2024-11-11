// Add at the start of the file
function showNotification(message, type = 'success') {
    const wrapper = document.querySelector('.notification-wrapper') || (() => {
        const el = document.createElement('div');
        el.className = 'notification-wrapper';
        document.body.appendChild(el);
        return el;
    })();

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const messageEl = document.createElement('div');
    messageEl.className = 'notification-message';
    messageEl.textContent = message;
    
    notification.appendChild(messageEl);
    wrapper.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 100);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => wrapper.removeChild(notification), 300);
    }, 3000);
}

// Time slot constants
const WEEKDAY_SLOTS = [
    '17:00', '17:15', '17:30', '17:45',
    '18:00', '18:15', '18:30', '18:45',
    '19:00', '19:15', '19:30'
];

const WEEKEND_MORNING_SLOTS = [
    '08:00', '08:15', '08:30', '08:45',
    '09:00', '09:15', '09:30', '09:45',
    '10:00', '10:15', '10:30'
];

const WEEKEND_AFTERNOON_SLOTS = [
    '14:00', '14:15', '14:30', '14:45',
    '15:00', '15:15', '15:30', '15:45',
    '16:00', '16:15', '16:30'
];

// DOM Elements
const dateInput = document.getElementById('appointmentDate');
const timeInput = document.getElementById('appointmentTime');
const timePopup = document.getElementById('timePopup');
const timeGrid = document.getElementById('timeGrid');
const cancelBtn = document.getElementById('cancelTimeSelection');
const confirmBtn = document.getElementById('confirmTimeSelection');
const loadingIndicator = document.getElementById('loadingIndicator');
const bookingForm = document.getElementById('bookingForm');
const fullNameInput = document.getElementById('fullName');
const phoneInput = document.getElementById('phone');

// Auto-fill form with user data from localStorage
try {
    const userProfile = JSON.parse(localStorage.getItem('userProfile'));
    const userData =JSON.parse(localStorage.getItem('userData'));
    if (userProfile) {
        fullNameInput.value = userProfile.full_name || '';
        phoneInput.value = userData.phone_number || '';
        
        // Make fields readonly if they have values
        if (userProfile.full_name) {
            fullNameInput.setAttribute('readonly', true);
        }
        if (userProfile.emergency_contact) {
            phoneInput.setAttribute('readonly', true);
        }
    }
} catch (error) {
    console.error('Error parsing user profile:', error);
}

let selectedTimeSlot = null;

// Replace the mock function with real API call
async function checkTimeSlotAvailability(date, timeSlot) {
    try {
        const [hours, minutes] = timeSlot.split(':');
        const timeDate = new Date(date);
        timeDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        // Format time as HH:mm:ss
        const formattedTime = `${timeDate.getHours().toString().padStart(2, '0')}:${timeDate.getMinutes().toString().padStart(2, '0')}:00`;

        const response = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/appointments/check-timeslot', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                date: timeDate.toISOString().split('T')[0],
                time: formattedTime
            })
        });

        const data = await response.json();
        return data.available;
    } catch (error) {
        console.error('Error checking timeslot:', error);
        return false;
    }
}

// Get time slots based on day type
function getTimeSlots(date) {
    const day = new Date(date).getDay();
    if (day === 0 || day === 6) { // Weekend (Saturday = 6, Sunday = 0)
        return [...WEEKEND_MORNING_SLOTS, ...WEEKEND_AFTERNOON_SLOTS];
    }
    return WEEKDAY_SLOTS;
}

// Thêm biến DOM cho error message
const errorMessage = document.createElement('div');
errorMessage.className = 'error-message';
errorMessage.style.cssText = 'color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem; display: none;';
timePopup.querySelector('.time-popup-content').appendChild(errorMessage);

// Generate time slot elements
async function generateTimeSlots(date) {
    timeGrid.innerHTML = '';
    const slots = getTimeSlots(date);
    errorMessage.style.display = 'none';
    
    loadingIndicator.style.display = 'block';
    
    // Create all slots first
    slots.forEach(slot => {
        const timeOption = document.createElement('div');
        timeOption.className = 'time-option disabled';
        timeOption.textContent = slot;
        
        // Add click handler for all slots
        timeOption.addEventListener('click', () => {
            if (timeOption.classList.contains('disabled')) {
                errorMessage.textContent = 'Khung giờ này đã đầy, vui lòng chọn giờ khác';
                errorMessage.style.display = 'block';
                return;
            }
            errorMessage.style.display = 'none';
            document.querySelectorAll('.time-option').forEach(opt => 
                opt.classList.remove('selected'));
            timeOption.classList.add('selected');
            selectedTimeSlot = slot;
        });
        
        timeGrid.appendChild(timeOption);
    });

    // Check availability for all slots in parallel
    const availabilityChecks = slots.map(async (slot, index) => {
        const isAvailable = await checkTimeSlotAvailability(date, slot);
        const timeOption = timeGrid.children[index];
        if (isAvailable) {
            timeOption.classList.remove('disabled');
        }
        return isAvailable;
    });

    await Promise.all(availabilityChecks);
    loadingIndicator.style.display = 'none';
}

// Event Listeners
dateInput.addEventListener('change', () => {
    if (dateInput.value) {
        timePopup.classList.add('active');
        generateTimeSlots(dateInput.value);
    }
});

timeInput.addEventListener('click', () => {
    if (dateInput.value) {
        timePopup.classList.add('active');
        generateTimeSlots(dateInput.value);
    } else {
        showNotification('Vui lòng chọn ngày trước', 'error');
    }
});

cancelBtn.addEventListener('click', () => {
    timePopup.classList.remove('active');
    selectedTimeSlot = null;
});

confirmBtn.addEventListener('click', () => {
    if (selectedTimeSlot) {
        timeInput.value = selectedTimeSlot;
        timePopup.classList.remove('active');
        errorMessage.style.display = 'none';
    } else {
        errorMessage.textContent = 'Vui lòng chọn giờ khám';
        errorMessage.style.display = 'block';
    }
});

// Add these helper functions before the form submit handler
async function getPatientId() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData'));
        if (!userData?.user_id) throw new Error('User ID not found');
        
        const response = await fetch(`https://carecab-9773d1d0a8c1.herokuapp.com/patients/user/${userData.user_id}`, {
            headers: { 'accept': 'application/json' }
        });
        const patientData = await response.json();
        return patientData.id;
    } catch (error) {
        console.error('Error getting patient ID:', error);
        throw error;
    }
}

function formatDateTime(date, time) {
    const [hours, minutes] = time.split(':');
    const appointmentDate = new Date(date);
    appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    return {
        dateOnly: appointmentDate.toISOString().split('T')[0],
        timeWithZone: `${hours}:${minutes}:00`
    };
}

// Replace the bookingForm submit handler
bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formError = document.querySelector('.form-error-message') || (() => {
        const el = document.createElement('div');
        el.className = 'form-error-message';
        el.style.cssText = 'color: #dc2626; font-size: 0.875rem; margin-top: 0.5rem;';
        bookingForm.appendChild(el);
        return el;
    })();
    
    if (!dateInput.value || !timeInput.value) {
        formError.textContent = 'Vui lòng chọn ngày và giờ khám';
        formError.style.display = 'block';
        return;
    }
    
    try {
        formError.style.display = 'none';
        const patientId = await getPatientId();
        const { dateOnly, timeWithZone } = formatDateTime(dateInput.value, timeInput.value);
        console.log(JSON.stringify({
            patient_id: patientId,
            nurse_id: 1,
            date: dateOnly,
            time: timeWithZone,
            location: "",
            symptoms: document.getElementById('notes').value || "",
            transportation: "None"
        }));

        const response = await fetch('https://carecab-9773d1d0a8c1.herokuapp.com/appointments/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify({
                patient_id: patientId,
                nurse_id: 1,
                date: dateOnly,
                time: timeWithZone,
                location: "",
                symptoms: document.getElementById('notes').value || "",
                transportation: "None"
            })
        });
        
        
        if (!response.ok) throw new Error('Booking failed');
        
        showNotification('Đặt lịch thành công!');
        bookingForm.reset();
        
        // Add delay before redirect to show the success message
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    } catch (error) {
        console.error('Booking error:', error);
        showNotification('Có lỗi xảy ra, vui lòng thử lại sau', 'error');
    }
});

// Replace cancel booking functionality
document.getElementById('cancelBooking').addEventListener('click', () => {
    showNotification('Bạn có muốn hủy đặt lịch?', 'confirm');
    
    // Add this right after the notification wrapper in showNotification
    const notification = document.querySelector('.notification');
    
    // Add confirm buttons
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'notification-actions';
    buttonGroup.style.marginTop = '10px';
    buttonGroup.style.display = 'flex';
    buttonGroup.style.gap = '8px';
    
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.textContent = 'Xác nhận';
    confirmBtn.style.padding = '4px 8px';
    confirmBtn.style.fontSize = '14px';
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn btn-secondary';
    cancelBtn.textContent = 'Hủy';
    cancelBtn.style.padding = '4px 8px';
    cancelBtn.style.fontSize = '14px';
    
    buttonGroup.appendChild(cancelBtn);
    buttonGroup.appendChild(confirmBtn);
    notification.appendChild(buttonGroup);

    confirmBtn.addEventListener('click', () => {
        window.location.href = 'home.html';
    });

    cancelBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    });
});

// Set min date to today
dateInput.min = new Date().toISOString().split('T')[0];
