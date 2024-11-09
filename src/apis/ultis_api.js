export const empty_patient = (user_id) => {
    const empty_patient = {
        "user_id": user_id,
        "monthly_subscription": false
    }
    return empty_patient;
}

export const generateEmptyUserProfile = async (userId) => {
    const emptyProfile = {
        user_id: userId,
        full_name: "",
        date_of_birth: new Date().toISOString().split('T')[0],
        gender: "",
        bio: "",
        address: "",
        emergency_contact: "",
        emergency_contact_relationship: ""
    };
    return emptyProfile;
};

export const generateEmptyNurse = (userId) => {
    const emptyNurse = {
        user_id: userId,
        specialization: "",
        experience_years: 0,
        availability: true,
        description: ""
    };
    return emptyNurse;
};

export const generateEmptyAppointment = (patientId) => {
    const today = new Date();
    const emptyAppointment = {
        patient_id: patientId,
        nurse_id: null,
        date: today.toISOString().split('T')[0],
        time: "00:00",
        location: "",
        symptoms: "",
        transportation: "None",
        startAt: today.toISOString(),
        endAt: today.toISOString()
    };
    return emptyAppointment;
};

export const generateEmptyNotification = (userId) => {
    const emptyNotification = {
        user_id: userId,
        message: "",
        status: "unread"
    };
    return emptyNotification;
};

export const generateEmptyUser = () => {
    const emptyUser = {
        username: "",
        password_hash: "",
        email: "",
        phone_number: "",
        role: "patient"
    };
    return emptyUser;
};