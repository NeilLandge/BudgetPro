// Authentication Common Functions
const API_URL = 'https://budgetpro-backend-1nyw.onrender.com/api';

// Show Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Toggle Password Visibility
document.addEventListener('DOMContentLoaded', function() {
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Toggle icon
            const svg = this.querySelector('svg');
            if (type === 'text') {
                svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="1" y1="1" x2="23" y2="23"/>';
            } else {
                svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            }
        });
    });
});

// Switch Between Email and Phone Methods
function setupAuthTabs() {
    const emailTab = document.getElementById('emailTab');
    const phoneTab = document.getElementById('phoneTab');
    const emailMethod = document.getElementById('emailMethod');
    const phoneMethod = document.getElementById('phoneMethod');
    
    if (emailTab && phoneTab) {
        emailTab.addEventListener('click', function() {
            emailTab.classList.add('active');
            phoneTab.classList.remove('active');
            emailMethod.classList.add('active');
            phoneMethod.classList.remove('active');
        });
        
        phoneTab.addEventListener('click', function() {
            phoneTab.classList.add('active');
            emailTab.classList.remove('active');
            phoneMethod.classList.add('active');
            emailMethod.classList.remove('active');
        });
    }
}

// OTP Input Handler
function setupOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');
    
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', function(e) {
            if (this.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
        
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, 6);
            pastedData.split('').forEach((char, i) => {
                if (otpInputs[i]) {
                    otpInputs[i].value = char;
                }
            });
            if (otpInputs[pastedData.length]) {
                otpInputs[pastedData.length].focus();
            }
        });
    });
}

// Show/Hide OTP Modal
function showOTPModal(message) {
    const modal = document.getElementById('otpModal');
    const otpMessage = document.getElementById('otpMessage');
    
    if (modal && otpMessage) {
        otpMessage.textContent = message;
        modal.classList.add('active');
        
        // Focus first input
        const firstInput = modal.querySelector('.otp-input');
        if (firstInput) firstInput.focus();
    }
}

function hideOTPModal() {
    const modal = document.getElementById('otpModal');
    if (modal) {
        modal.classList.remove('active');
        
        // Clear inputs
        document.querySelectorAll('.otp-input').forEach(input => {
            input.value = '';
        });
    }
}

// Get OTP Value
function getOTPValue() {
    const inputs = document.querySelectorAll('.otp-input');
    let otp = '';
    inputs.forEach(input => {
        otp += input.value;
    });
    return otp;
}

// Password Strength Checker
function checkPasswordStrength(password) {
    const strengthDiv = document.getElementById('passwordStrength');
    if (!strengthDiv) return;
    
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    strengthDiv.className = 'password-strength';
    
    if (strength === 0 || password.length === 0) {
        strengthDiv.className = 'password-strength';
    } else if (strength <= 2) {
        strengthDiv.classList.add('weak');
    } else if (strength === 3) {
        strengthDiv.classList.add('medium');
    } else {
        strengthDiv.classList.add('strong');
    }
}

// Google Sign In
async function handleGoogleSignIn() {
    showToast('Google Sign In integration required', 'error');
    // In production, integrate with Google OAuth
    // This would typically use Google's OAuth 2.0 flow
}

// API Request Helper
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        const token = localStorage.getItem('token');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || 'Request failed');
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Save User Session
function saveUserSession(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
}

// Get User Session
function getUserSession() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        return {
            token,
            user: JSON.parse(user)
        };
    }
    
    return null;
}

// Clear User Session
function clearUserSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}

// Check if User is Authenticated
function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Redirect if Authenticated
function redirectIfAuthenticated() {
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
    }
}

// Protect Page (Redirect to Sign In if not authenticated)
function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = 'signin.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupAuthTabs();
    setupOTPInputs();
    
    // Google Sign In Buttons
    const googleBtns = document.querySelectorAll('.google-btn');
    googleBtns.forEach(btn => {
        btn.addEventListener('click', handleGoogleSignIn);
    });
});