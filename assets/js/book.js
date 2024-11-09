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

let selectedTimeSlot = null;

// Mock function to simulate checking availability (replace with actual API call)
async function checkTimeSlotAvailability(date, timeSlot) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Random availability (70% chance of being available)
    return Math.random() > 0.3;
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
        alert('Vui lòng chọn ngày trước');
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        alert('Đặt lịch thành công!');
        bookingForm.reset();
    } catch (error) {
        formError.textContent = 'Có lỗi xảy ra, vui lòng thử lại sau';
        formError.style.display = 'block';
    }
});

// Set min date to today
dateInput.min = new Date().toISOString().split('T')[0];
