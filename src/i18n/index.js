import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

const resources = {
  en: {
    translation: {
      tabs: {
        home: 'Home',
        deliveries: 'Deliveries',
        products: 'Products',
        customers: 'Customers',
      },
      home: {
        overviewTitle: "Today's Overview",
        totalDelivery: 'Total Delivery',
        totalLiter: 'Total Liter',
        todayEarnings: "Today's Earnings",
        outstandingAmount: 'Outstanding Amount',
        quickActionsTitle: 'Quick Actions',
        actionAddStaff: 'Add Staff',
      },
      staff: {
        title: 'Staff Management',
        addNew: 'Add New Staff',
        editStaff: 'Edit Staff Details',
        name: 'Staff Name',
        namePlaceholder: 'Enter staff member name',
        phone: 'Mobile Number',
        phonePlaceholder: 'Enter 10-digit mobile number',
        email: 'Email (Optional)',
        emailPlaceholder: 'Enter email address',
        active: 'Active',
        inactive: 'Inactive',
        remove: 'Remove Staff',
        removeConfirm: 'Are you sure you want to remove this staff member?',
        removeSuccess: 'Staff member removed successfully',
        addSuccess: 'Staff member added successfully',
        updateSuccess: 'Staff member updated successfully',
        phoneExists: 'A user with this phone number already exists',
        validationError: 'Please enter name and 10-digit mobile number',
        cancel: 'Cancel',
        save: 'Save Staff',
        deleteBtn: 'Delete',
        searchPlaceholder: 'Search staff by name or phone...',
        noStaffTitle: 'No Staff Found',
        noStaffSub: 'Add your first staff member to get started!',
      },
      onboarding: {
        skip: 'Skip',
        next: 'Next',
        back: 'Back',
        start: 'Start',
        title1: 'Accurate Records, Full Control',
        subtitle1: 'Delivery, Payment and Billing all in one app',
        title2: 'Safe & Pure Water',
        subtitle2: '100% pure drinking water delivery to your home and shop',
      },
      login: {
        tagline: 'Safe, Pure and On-time Delivery',
        title: 'Login',
        mobileLabel: 'Mobile Number',
        mobilePlaceholder: 'Enter your 10 digit number',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Enter your password',
        forgotPassword: 'Forgot Password?',
        loginButton: 'Login',
        noAccount: "Don't have an account?",
        register: 'Create New Account',
        loginSuccess: 'Login Successful!',
        validationError: 'Please enter mobile number and password',
      },
      register: {
        title: 'Sign Up',
        tagline: 'Join Camper for pure and on-time deliveries',
        mobileLabel: 'Mobile Number',
        mobilePlaceholder: 'Enter your 10 digit number',
        button: 'Send OTP',
        alreadyHaveAccount: 'Already have an account?',
        loginLink: 'Login',
        success: 'OTP sent successfully',
        rateLimitError: 'Too many OTP requests. Please try again later.',
      },
      otp: {
        title: 'OTP Verification',
        subtitle: 'Enter the 6-digit code sent to',
        verifyButton: 'Verify & Proceed',
        resendText: 'Did not receive code?',
        resendBtn: 'Resend OTP',
        resendTimer: 'Resend OTP in {{seconds}}s',
        invalidOtp: 'Invalid OTP. Please try again.',
        resendLimitReached: 'Maximum resend limit reached.',
        resendSuccess: 'OTP resent successfully.',
      },
      completeReg: {
        title: 'Business Details',
        subtitle: 'Complete your registration to get started',
        ownerName: 'Owner Name',
        ownerPlaceholder: 'Enter owner\'s name',
        businessName: 'Business Name',
        businessPlaceholder: 'Enter business name',
        category: 'Business Category',
        selectCategory: 'Select Category',
        email: 'Email (Optional)',
        emailPlaceholder: 'Enter email address',
        button: 'Complete Registration',
        success: 'Registration Completed!',
        validationError: 'Please fill in all required fields.',
      },
      settings: {
        title: 'Settings',
        language: 'Language',
        english: 'English',
        hindi: 'Hindi',
        logout: 'Logout',
      },
    },
  },
  hi: {
    translation: {
      tabs: {
        home: 'होम',
        deliveries: 'डिलीवरी',
        products: 'प्रोडक्ट्स',
        customers: 'कस्टमर',
      },
      home: {
        overviewTitle: 'आज का हिसाब-किताब',
        totalDelivery: 'कुल डिलीवरी',
        totalLiter: 'कुल लीटर',
        todayEarnings: 'आज की कमाई',
        outstandingAmount: 'बकाया (उधारी)',
        quickActionsTitle: 'मुख्य काम',
        actionAddStaff: 'स्टाफ जोड़ें',
      },
      staff: {
        title: 'स्टाफ मैनेजमेंट',
        addNew: 'नया स्टाफ जोड़ें',
        editStaff: 'स्टाफ विवरण बदलें',
        name: 'स्टाफ का नाम',
        namePlaceholder: 'स्टाफ सदस्य का नाम डालें',
        phone: 'मोबाइल नंबर',
        phonePlaceholder: '10 अंकों का मोबाइल नंबर डालें',
        email: 'ईमेल (वैकल्पिक)',
        emailPlaceholder: 'ईमेल एड्रेस डालें',
        active: 'सक्रिय',
        inactive: 'निष्क्रिय',
        remove: 'स्टाफ हटाएं',
        removeConfirm: 'क्या आप वाकई इस स्टाफ सदस्य को हटाना चाहते हैं?',
        removeSuccess: 'स्टाफ सदस्य सफलतापूर्वक हटा दिया गया',
        addSuccess: 'स्टाफ सदस्य सफलतापूर्वक जोड़ा गया',
        updateSuccess: 'स्टाफ सदस्य सफलतापूर्वक अपडेट किया गया',
        phoneExists: 'इस फोन नंबर वाला उपयोगकर्ता पहले से मौजूद है',
        validationError: 'कृपया नाम और 10 अंकों का मोबाइल नंबर दर्ज करें',
        cancel: 'रद्द करें',
        save: 'स्टाफ सुरक्षित करें',
        deleteBtn: 'हटाएं',
        searchPlaceholder: 'नाम या फोन से स्टाफ खोजें...',
        noStaffTitle: 'कोई स्टाफ नहीं मिला',
        noStaffSub: 'शुरू करने के लिए अपना पहला स्टाफ सदस्य जोड़ें!',
      },
      onboarding: {
        skip: 'छोड़ें',
        next: 'आगे बढ़ें',
        back: 'पीछे',
        start: 'शुरू करें',
        title1: 'पूरा हिसाब, आपके हाथ में',
        subtitle1: 'पानी की डिलीवरी, पेमेंट और बिल का हिसाब अब एक ही जगह',
        title2: 'साफ़ और शुद्ध पानी',
        subtitle2: 'घर और दुकान पर साफ़ और शुद्ध पीने के पानी की तुरंत डिलीवरी',
      },
      login: {
        tagline: 'साफ़, शुद्ध और सही समय पर डिलीवरी',
        title: 'लॉगिन करें',
        mobileLabel: 'मोबाइल नंबर',
        mobilePlaceholder: 'अपना 10 अंकों का नंबर डालें',
        passwordLabel: 'पासवर्ड',
        passwordPlaceholder: 'अपना पासवर्ड डालें',
        forgotPassword: 'पासवर्ड भूल गए?',
        loginButton: 'लॉगिन करें',
        noAccount: 'नया अकाउंट बनाना है?',
        register: 'नया अकाउंट बनाएं',
        loginSuccess: 'लॉगिन हो गया!',
        validationError: 'कृपया मोबाइल नंबर और पासवर्ड डालें',
      },
      register: {
        title: 'रजिस्टर करें',
        tagline: 'साफ़, शुद्ध और सही समय पर पानी की डिलीवरी के लिए जुड़ें',
        mobileLabel: 'मोबाइल नंबर',
        mobilePlaceholder: 'अपना 10 अंकों का नंबर डालें',
        button: 'ओटीपी भेजें',
        alreadyHaveAccount: 'पहले से अकाउंट है?',
        loginLink: 'लॉगिन करें',
        success: 'ओटीपी भेज दिया गया है',
        rateLimitError: 'बहुत ज़्यादा ओटीपी अनुरोध। कृपया थोड़ी देर बाद कोशिश करें।',
      },
      otp: {
        title: 'ओटीपी सत्यापन',
        subtitle: 'दिए गए नंबर पर भेजा गया 6-अंकों का कोड डालें',
        verifyButton: 'सत्यापित करें',
        resendText: 'कोड नहीं मिला?',
        resendBtn: 'ओटीपी दोबारा भेजें',
        resendTimer: '{{seconds}} सेकंड में दोबारा भेजें',
        invalidOtp: 'गलत ओटीपी। कृपया दोबारा कोशिश करें।',
        resendLimitReached: 'ओटीपी दोबारा भेजने की सीमा समाप्त हो गई है।',
        resendSuccess: 'ओटीपी दोबारा भेज दिया गया है।',
      },
      completeReg: {
        title: 'व्यापार की जानकारी',
        subtitle: 'काम शुरू करने के लिए अपने व्यापार की जानकारी भरें',
        ownerName: 'मालिक का नाम',
        ownerPlaceholder: 'मालिक का नाम डालें',
        businessName: 'व्यापार का नाम',
        businessPlaceholder: 'दुकान या व्यापार का नाम डालें',
        category: 'व्यापार की श्रेणी',
        selectCategory: 'श्रेणी चुनें',
        email: 'ईमेल (वैकल्पिक)',
        emailPlaceholder: 'ईमेल एड्रेस डालें',
        button: 'रजिस्ट्रेशन पूरा करें',
        success: 'रजिस्ट्रेशन पूरा हो गया!',
        validationError: 'कृपया सभी ज़रूरी जानकारी भरें।',
      },
      settings: {
        title: 'सेटिंग्स',
        language: 'भाषा बदलें',
        english: 'English',
        hindi: 'हिन्दी',
        logout: 'लॉगआउट करें',
      },
    },
  },
};

const LANGUAGE_KEY = 'app_language';

const initI18n = async () => {
  let savedLanguage = 'hi';
  try {
    const value = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (value !== null) {
      savedLanguage = value;
    }
  } catch (error) {
    console.error('Failed to load language', error);
  }

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;
