import axios from 'axios';

const API_BASE_URL = 'https://carecab-9773d1d0a8c1.herokuapp.com/';

// Create axios instance with config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000, // 5 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  console.log('Starting Request:', request)
  return request
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log('Response:', response)
    return response
  },
  error => {
    console.log('Response Error:', error)
    return Promise.reject(error)
  }
);

const handleApiError = (error) => {
  console.log('API Error:', error.response || error);
  if (error.response) {
    // Server responded with error
    if (error.response.status === 422) {
      throw new Error('Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
    }
    if (error.response.status === 401) {
      throw new Error('Tài khoản hoặc mật khẩu không đúng');
    }
    if (error.response.status === 403) {
      throw new Error('Không có quyền truy cập');
    }
    if (error.response.status === 404) {
      throw new Error('Không tìm thấy dữ liệu');
    }
    throw new Error(error.response.data.message || 'Có lỗi xảy ra');
  }
  throw new Error('Không thể kết nối đến server');
};

export const loginUser = async (username, password) => {
  try {
    console.log('Attempting login request...');
    const response = await api.post('/auth/login', { username, password });
    console.log('Login response:', response);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    return handleApiError(error);
  }
};

export const registerUser = async (userData) => {
  try {
    const userPayload = {
      username: userData.username,
      password_hash: userData.password, // Note: In production, hash password client-side
      email: userData.email,
      phone_number: userData.phone,
      role: 'user', // Default role for registration
      // created_at: new Date().toISOString(),
      // updated_at: new Date().toISOString()
    };
    
    const response = await api.post('/users', userPayload);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const otp = async (email1) => {
  try {
    const response = await api.post('/auth/otp', {
      email: email1 // Gửi trực tiếp email không cần wrap trong object
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const changePassword = async (email, newPassword) => {
  try {
    const response = await api.post('/auth/change_password', {
      email: email,
      new_password: newPassword
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUserProfile = async (userId) => {
  try {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createUserProfile = async (profileData) => {
  try {
    const response = await api.post('/users/profile/', profileData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const response = await api.put(`/users/profile/${userId}`, profileData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteUserProfile = async (userId) => {
  try {
    const response = await api.delete(`/users/profile/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const generateEmptyUserProfile = async (userId) => {
  try {
    const emptyProfile = {
      user_id: userId,
      full_name: "",
      date_of_birth: new Date().toISOString().split('T')[0], // Current date as default
      gender: "",
      bio: "",
      address: "",
      emergency_contact: "",
      emergency_contact_relationship: ""
    };
    
    const response = await api.post('/users/profile/', emptyProfile);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Appointment APIs
export const checkAvailableNurses = async (appointmentTime) => {
  try {
    const dateStr = appointmentTime.date instanceof Date 
      ? appointmentTime.date.toISOString().split('T')[0]
      : appointmentTime.date;
    
    const timeStr = appointmentTime.time instanceof Date
      ? appointmentTime.time.toTimeString().split(' ')[0]
      : appointmentTime.time;

    const response = await api.post('/appointments/available-nurses', {
      date: dateStr,
      time: timeStr
    });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post('/appointments/', appointmentData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const nurseConfirmAppointment = async (appointmentId, nurseId) => {
  try {
    const response = await api.post(`/appointments/${appointmentId}/nurse-confirm?nurse_id=${nurseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const startService = async (appointmentId, nurseId) => {
  try {
    const response = await api.post(`/appointments/${appointmentId}/start-service?nurse_id=${nurseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const stopService = async (appointmentId, nurseId) => {
  try {
    const response = await api.post(`/appointments/${appointmentId}/stop-service?nurse_id=${nurseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const completeAppointment = async (appointmentId, patientId) => {
  try {
    const response = await api.post(`/appointments/${appointmentId}/complete?patient_id=${patientId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPatientAppointments = async (patientId) => {
  try {
    const response = await api.get(`/appointments/patient/${patientId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUpcomingAppointments = async (patientId) => {
  try {
    const response = await api.get(`/appointments/upcoming/${patientId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateAppointment = async (appointmentId, patientId, appointmentData) => {
  try {
    const response = await api.put(`/appointments/${appointmentId}?patient_id=${patientId}`, appointmentData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const cancelAppointment = async (appointmentId, patientId) => {
  try {
    const response = await api.delete(`/appointments/${appointmentId}?patient_id=${patientId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const toggleNurseAvailability = async (nurseId) => {
  try {
    const response = await api.post(`/appointments/nurse/${nurseId}/toggle-availability`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Nurse APIs
export const getAllNurses = async () => {
  try {
    const response = await api.get('/nurses/');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getNurse = async (nurseId) => {
  try {
    const response = await api.get(`/nurses/${nurseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getNurseByUserId = async (userId) => {
  try {
    const response = await api.get(`/nurses/user/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createNurse = async (nurseData) => {
  try {
    const response = await api.post('/nurses/', nurseData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updateNurse = async (nurseId, nurseData) => {
  try {
    const response = await api.put(`/nurses/${nurseId}`, nurseData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deleteNurse = async (nurseId) => {
  try {
    const response = await api.delete(`/nurses/${nurseId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Patient APIs
export const getAllPatients = async () => {
  try {
    const response = await api.get('/patients/');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPatient = async (patientId) => {
  try {
    const response = await api.get(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPatientByUserId = async (userId) => {
  try {
    const response = await api.get(`/patients/user/${userId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const createPatient = async (patientData) => {
  try {
    const response = await api.post('/patients/', patientData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const updatePatient = async (patientId, patientData) => {
  try {
    const response = await api.put(`/patients/${patientId}`, patientData);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const deletePatient = async (patientId) => {
  try {
    const response = await api.delete(`/patients/${patientId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getPatientAppointmentHistory = async (patientId) => {
  try {
    const response = await api.get(`/patients/${patientId}/appointments`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const togglePatientSubscription = async (patientId) => {
  try {
    const response = await api.post(`/patients/${patientId}/subscribe`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

