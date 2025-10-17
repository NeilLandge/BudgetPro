// Sign Up Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    redirectIfAuthenticated();
    
    const signUpForm = document.getElementById('signUpForm');
    const passwordInput = document.getElementById('password');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    let pendingSignUpData = null;
    
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
                const emailMethod = document.getElementById('emailMethod').classList.contains('active');
                const name = document.getElementById('name').value.trim();
                const password = document.getElementById('password').value;
                const terms = document.getElementById('terms').checked;
                
                if (!terms) {
                    showToast('Please accept the Terms of Service', 'error');
                    return;
                }
                
                const signUpData = {
                    name,
                    password,
                    method: emailMethod ? 'email' : 'phone'
                };
                
                if (emailMethod) {
                    signUpData.email = document.getElementById('email').value.trim();
                } else {
                    signUpData.phone = document.getElementById('phone').value.trim();
                }
                
                // Send sign up request
                const response = await apiRequest('/auth/signup', 'POST', signUpData);
                
                if (response.success) {
                    pendingSignUpData = signUpData;
                    
                    // Show OTP modal
                    const message = emailMethod 
                        ? `Enter the verification code sent to ${signUpData.email}`
                        : `Enter the verification code sent to ${signUpData.phone}`;
                    
                    showOTPModal(message);
                    showToast('Verification code sent!', 'success');
                }
            } catch (error) {
                showToast(error.message || 'Sign up failed', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
    
    // Handle OTP Verification
    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async function() {
            const otp = getOTPValue();
            
            if (otp.length !== 6) {
                showToast('Please enter complete OTP', 'error');
                return;
            }
            
            this.disabled = true;
            this.textContent = 'Verifying...';
            
            try {
                const response = await apiRequest('/auth/verify-otp', 'POST', {
                    ...pendingSignUpData,
                    otp
                });
                
                if (response.success) {
                    saveUserSession(response.token, response.user);
                    showToast('Account created successfully!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                showToast(error.message || 'Verification failed', 'error');
                this.disabled = false;
                this.textContent = 'Verify';
            }
        });
    }
    
    // Handle Resend OTP
    if (resendOtpBtn) {
        resendOtpBtn.addEventListener('click', async function() {
            this.disabled = true;
            this.textContent = 'Sending...';
            
            try {
                const response = await apiRequest('/auth/resend-otp', 'POST', pendingSignUpData);
                
                if (response.success) {
                    showToast('Verification code resent!', 'success');
                    
                    // Clear OTP inputs
                    document.querySelectorAll('.otp-input').forEach(input => {
                        input.value = '';
                    });
                    document.querySelector('.otp-input').focus();
                }
            } catch (error) {
                showToast(error.message || 'Failed to resend code', 'error');
            } finally {
                this.disabled = false;
                this.textContent = 'Resend Code';
            }
        });
    }
});