// Sign Up Page JavaScript - Email Only, No OTP

document.addEventListener('DOMContentLoaded', function() {
    redirectIfAuthenticated();
    
    const signUpForm = document.getElementById('signUpForm');
    const passwordInput = document.getElementById('password');
    
    // Toggle Password Visibility
    const togglePassword = document.getElementById('togglePassword');
    if (togglePassword) {
        togglePassword.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            
            // Update icon
            const icon = this.querySelector('svg');
            if (type === 'text') {
                icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            } else {
                icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            }
        });
    }
    
    // Password Strength Checker
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Handle Sign Up Form Submission
    if (signUpForm) {
        signUpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('signUpBtn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Creating Account...';
            
            try {
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                const terms = document.getElementById('terms').checked;
                
                // Validate inputs
                if (!name || !email || !password) {
                    showToast('Please fill in all fields', 'error');
                    return;
                }
                
                // Email validation
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    showToast('Please enter a valid email address', 'error');
                    return;
                }
                
                if (!terms) {
                    showToast('Please accept the Terms of Service', 'error');
                    return;
                }
                
                // Password strength validation
                if (password.length < 6) {
                    showToast('Password must be at least 6 characters long', 'error');
                    return;
                }
                
                // Direct sign up - create account immediately without OTP
                const response = await apiRequest('/auth/signup-direct', 'POST', {
                    name,
                    email,
                    password
                });
                
                if (response.success) {
                    saveUserSession(response.token, response.user);
                    showToast('Account created successfully!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                // Handle specific error messages from backend
                let errorMessage = error.message || 'Sign up failed';
                
                if (error.message.includes('User with this email already exists')) {
                    errorMessage = 'An account with this email already exists. Please sign in instead.';
                } else if (error.message.includes('Missing required fields')) {
                    errorMessage = 'Please fill in all required fields.';
                } else if (error.message.includes('Email is required')) {
                    errorMessage = 'Email address is required.';
                }
                
                showToast(errorMessage, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Password Strength Checker Function
function checkPasswordStrength(password) {
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let feedback = '';
    
    // Length check
    if (password.length >= 8) strength += 25;
    
    // Lowercase check
    if (/[a-z]/.test(password)) strength += 25;
    
    // Uppercase check
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Number/Special char check
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
    
    // Update UI
    strengthBar.style.width = strength + '%';
    
    if (strength === 0) {
        strengthBar.style.background = 'var(--gray-500)';
        strengthText.textContent = 'Password strength';
    } else if (strength <= 25) {
        strengthBar.style.background = 'var(--red)';
        strengthText.textContent = 'Weak';
    } else if (strength <= 50) {
        strengthBar.style.background = 'var(--yellow)';
        strengthText.textContent = 'Fair';
    } else if (strength <= 75) {
        strengthBar.style.background = 'var(--blue)';
        strengthText.textContent = 'Good';
    } else {
        strengthBar.style.background = 'var(--green)';
        strengthText.textContent = 'Strong';
    }
}