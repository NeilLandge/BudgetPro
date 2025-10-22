// Sign Up Page JavaScript - Direct registration

document.addEventListener('DOMContentLoaded', function() {
    redirectIfAuthenticated();
    
    const signUpForm = document.getElementById('signUpForm');
    const passwordInput = document.getElementById('password');
    
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
                    // ✅ Direct login after signup
                    saveUserSession(response.token, response.user);
                    showToast('Account created successfully!', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1000);
                }
            } catch (error) {
                showToast(error.message || 'Sign up failed', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});