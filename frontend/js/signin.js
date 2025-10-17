// Sign In Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    redirectIfAuthenticated();
    
    const signInForm = document.getElementById('signInForm');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const resendOtpBtn = document.getElementById('resendOtpBtn');
    
    let pendingSignInData = null;
    
    // Forgot Password Functionality
    const forgotPasswordLink = document.querySelector('.forgot-link');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function(e) {
            e.preventDefault();
            showForgotPasswordModal();
        });
    }
    
    // Handle Sign In Form Submission
    if (signInForm) {
        signInForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('signInBtn');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';
            
            try {
                const emailMethod = document.getElementById('emailMethod').classList.contains('active');
                
                const signInData = {
                    method: emailMethod ? 'email' : 'phone'
                };
                
                if (emailMethod) {
                    signInData.email = document.getElementById('email').value.trim();
                    signInData.password = document.getElementById('password').value;
                    
                    // Direct email sign in
                    const response = await apiRequest('/auth/signin', 'POST', signInData);
                    
                    if (response.success) {
                        saveUserSession(response.token, response.user);
                        showToast('Sign in successful!', 'success');
                        
                        setTimeout(() => {
                            window.location.href = 'dashboard.html';
                        }, 1000);
                    }
                } else {
                    signInData.phone = document.getElementById('phone').value.trim();
                    pendingSignInData = signInData;
                    
                    // Send OTP for phone sign in
                    const response = await apiRequest('/auth/send-otp', 'POST', signInData);
                    
                    if (response.success) {
                        const message = `Enter the verification code sent to ${signInData.phone}`;
                        showOTPModal(message);
                        showToast('Verification code sent!', 'success');
                    }
                }
            } catch (error) {
                showToast(error.message || 'Sign in failed', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
    
    // Handle OTP Verification for Phone Sign In
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
                const response = await apiRequest('/auth/verify-signin-otp', 'POST', {
                    ...pendingSignInData,
                    otp
                });
                
                if (response.success) {
                    saveUserSession(response.token, response.user);
                    showToast('Sign in successful!', 'success');
                    
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
                const response = await apiRequest('/auth/send-otp', 'POST', pendingSignInData);
                
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

// Forgot Password Modal Function
function showForgotPasswordModal() {
    // Create modal HTML
    const modalHTML = `
        <div class="modal active" id="forgotPasswordModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Reset Password</h3>
                    <button class="modal-close" onclick="closeForgotPasswordModal()">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>
                <form id="forgotPasswordForm">
                    <div class="form-group">
                        <label for="resetEmail">Email Address</label>
                        <div class="input-group">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="2" y="4" width="20" height="16" rx="2"/>
                                <path d="M22 7l-10 7L2 7"/>
                            </svg>
                            <input type="email" id="resetEmail" placeholder="your@email.com" required>
                        </div>
                        <p class="help-text">We'll send you a password reset link to your email</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="closeForgotPasswordModal()">Cancel</button>
                        <button type="submit" class="btn-primary">Send Reset Link</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add form submission handler
    const form = document.getElementById('forgotPasswordForm');
    if (form) {
        form.addEventListener('submit', handleForgotPassword);
    }
}

// Close Forgot Password Modal
function closeForgotPasswordModal() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.remove();
    }
}

// Handle Forgot Password Submission
async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value.trim();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    
    if (!email) {
        showToast('Please enter your email address', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    
    try {
        // Since you don't have a backend route for forgot password yet,
        // we'll show a success message but note that it's not implemented
        showToast('Password reset feature coming soon!', 'info');
        
        // In production, you would call an API like:
        // const response = await apiRequest('/auth/forgot-password', 'POST', { email });
        
        // For now, just close the modal after a delay
        setTimeout(() => {
            closeForgotPasswordModal();
        }, 2000);
        
    } catch (error) {
        showToast(error.message || 'Failed to send reset link', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}