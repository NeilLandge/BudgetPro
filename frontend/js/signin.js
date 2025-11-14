// Sign In Page JavaScript - Email Only

document.addEventListener('DOMContentLoaded', function() {
    redirectIfAuthenticated();
    
    const signInForm = document.getElementById('signInForm');
    
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
                const email = document.getElementById('email').value.trim();
                const password = document.getElementById('password').value;
                
                // Validate inputs
                if (!email || !password) {
                    showToast('Please fill in all fields', 'error');
                    return;
                }
                
                // Direct email sign in
                const response = await apiRequest('/auth/signin', 'POST', {
                    email: email,
                    password: password,
                    method: 'email'
                });
                
                if (response.success) {
                    saveUserSession(response.token, response.user);
                    showToast('Sign in successful!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                // Handle specific error messages from backend
                let errorMessage = error.message || 'Sign in failed';
                
                if (error.message.includes('User not found')) {
                    errorMessage = 'No account found with this email. Please sign up first.';
                } else if (error.message.includes('Invalid password')) {
                    errorMessage = 'Incorrect password. Please try again.';
                } else if (error.message.includes('verify your account')) {
                    errorMessage = 'Please verify your account before signing in.';
                }
                
                showToast(errorMessage, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
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