// Get DOM elements
const roleSelect = document.getElementById('role');
const patientFields = document.getElementById('patientFields');
const doctorFields = document.getElementById('doctorFields');
const pharmacistFields = document.getElementById('pharmacistFields');
const loginForm = document.getElementById('loginForm');
const toggleBtn = document.getElementById('toggleBtn');
const formTitle = document.getElementById('formTitle');
const formSubtitle = document.getElementById('formSubtitle');
const submitBtn = document.getElementById('submitBtn');
const fullNameGroup = document.getElementById('fullNameGroup');
const phoneGroup = document.getElementById('phoneGroup');
const roleGroup = document.getElementById('roleGroup');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const phoneInput = document.getElementById('phone');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const body = document.body;

// Track current mode (signup or signin)
let isSignInMode = false;

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.className = savedTheme + '-mode';
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize theme on page load
initTheme();

// Theme toggle event listener
themeToggle.addEventListener('click', toggleTheme);

// Function to hide all conditional fields
function hideAllFields() {
    patientFields.style.display = 'none';
    doctorFields.style.display = 'none';
    pharmacistFields.style.display = 'none';
    
    // Clear the values when hiding
    document.getElementById('medicalHistory').value = '';
    document.getElementById('licenseNumber').value = '';
    document.getElementById('specialization').value = '';
    document.getElementById('shopDetails').value = '';
}

// Function to show fields based on selected role
function showFieldsForRole(role) {
    hideAllFields();
    
    switch(role) {
        case 'patient':
            patientFields.style.display = 'block';
            document.getElementById('medicalHistory').required = true;
            document.getElementById('licenseNumber').required = false;
            document.getElementById('specialization').required = false;
            document.getElementById('shopDetails').required = false;
            break;
        case 'doctor':
            doctorFields.style.display = 'block';
            document.getElementById('licenseNumber').required = true;
            document.getElementById('specialization').required = true;
            document.getElementById('medicalHistory').required = false;
            document.getElementById('shopDetails').required = false;
            break;
        case 'pharmacist':
            pharmacistFields.style.display = 'block';
            document.getElementById('shopDetails').required = true;
            document.getElementById('medicalHistory').required = false;
            document.getElementById('licenseNumber').required = false;
            document.getElementById('specialization').required = false;
            break;
        case 'admin':
            // Admin doesn't need additional fields
            document.getElementById('medicalHistory').required = false;
            document.getElementById('licenseNumber').required = false;
            document.getElementById('specialization').required = false;
            document.getElementById('shopDetails').required = false;
            break;
        default:
            // No role selected
            document.getElementById('medicalHistory').required = false;
            document.getElementById('licenseNumber').required = false;
            document.getElementById('specialization').required = false;
            document.getElementById('shopDetails').required = false;
    }
}

// Event listener for role selection change
roleSelect.addEventListener('change', function() {
    const selectedRole = this.value;
    showFieldsForRole(selectedRole);
});

// Toggle between sign-in and sign-up modes
toggleBtn.addEventListener('click', function(e) {
    e.preventDefault();
    isSignInMode = !isSignInMode;
    toggleMode();
});

function toggleMode() {
    if (isSignInMode) {
        // Switch to sign-in mode
        formTitle.textContent = 'Welcome Back';
        formSubtitle.textContent = 'Sign in to your account';
        submitBtn.textContent = 'Sign In';
        toggleBtn.textContent = 'Sign up';
        
        // Hide registration fields
        fullNameGroup.classList.add('hidden');
        phoneGroup.classList.add('hidden');
        roleGroup.classList.add('hidden');
        hideAllFields();
        
        // Make email and password required
        emailInput.required = true;
        passwordInput.required = true;
        
        // Remove required from registration fields
        document.getElementById('fullName').required = false;
        phoneInput.required = false;
        roleSelect.required = false;
    } else {
        // Switch to sign-up mode
        formTitle.textContent = 'Create Your Account';
        formSubtitle.textContent = 'Sign up to access your medication and prescription management';
        submitBtn.textContent = 'Create Account';
        toggleBtn.textContent = 'Sign in';
        
        // Show registration fields
        fullNameGroup.classList.remove('hidden');
        phoneGroup.classList.remove('hidden');
        roleGroup.classList.remove('hidden');
        
        // Make registration fields required
        document.getElementById('fullName').required = true;
        phoneInput.required = true;
        roleSelect.required = true;
        emailInput.required = true;
        passwordInput.required = true;
    }
}

// Form submission handler
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (isSignInMode) {
        // Sign-in mode - only email and password
        const emailValue = document.getElementById('email').value;
        const passwordValue = document.getElementById('password').value;
        const formData = {
            email: emailValue,
            password: passwordValue
        };
        
        console.log('Sign In Data:', formData);
        
        // Call backend API to authenticate
        fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // Show error message
                showErrorMessage(data.error);
                return;
            }
            
            // Store user data from backend response
            const userData = {
                id: data.user.id,
                fullName: data.user.fullName,
                email: data.user.email,
                phone: data.user.phone,
                role: data.user.role,
                medicalHistory: data.user.medicalHistory || null,
                licenseNumber: data.user.licenseNumber || null,
                specialization: data.user.specialization || null,
                shopDetails: data.user.shopDetails || null
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Decide where to go based on role from database
            const role = (userData.role || 'patient').toLowerCase();
            let target = 'patient-dashboard.html';
            if (role === 'doctor') {
                target = 'doctor-dashboard.html';
            }
            // Other roles (admin, pharmacist) can be wired later

            showSuccessMessage('Sign in successful! Redirecting to dashboard...', function() {
                window.location.href = target;
            });
        })
        .catch(error => {
            console.error('Login error:', error);
            showErrorMessage('Failed to connect to server. Please try again.');
        });
    } else {
        // Sign-up mode - full registration
        const formData = {
            fullName: document.getElementById('fullName').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: document.getElementById('role').value
        };
        
        // Add role-specific data
        const selectedRole = formData.role;
        
        if (selectedRole === 'patient') {
            formData.medicalHistory = document.getElementById('medicalHistory').value;
        } else if (selectedRole === 'doctor') {
            formData.licenseNumber = document.getElementById('licenseNumber').value;
            formData.specialization = document.getElementById('specialization').value;
        } else if (selectedRole === 'pharmacist') {
            formData.shopDetails = document.getElementById('shopDetails').value;
        }
        
        console.log('Sign Up Data:', formData);
        
        // Call backend API to register
        fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                // Show error message
                showErrorMessage(data.error);
                return;
            }
            
            // Store user data from backend response
            const userData = {
                id: data.user.id,
                fullName: data.user.fullName,
                email: data.user.email,
                phone: data.user.phone,
                role: data.user.role,
                medicalHistory: data.user.medicalHistory || null,
                licenseNumber: data.user.licenseNumber || null,
                specialization: data.user.specialization || null,
                shopDetails: data.user.shopDetails || null
            };
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Redirect based on role from database
            const role = (userData.role || 'patient').toLowerCase();
            if (role === 'patient') {
                showSuccessMessage('Account created successfully! Redirecting to dashboard...', function() {
                    window.location.href = 'patient-dashboard.html';
                });
            } else if (role === 'doctor') {
                showSuccessMessage('Account created successfully! Redirecting to doctor dashboard...', function() {
                    window.location.href = 'doctor-dashboard.html';
                });
            } else {
                alert(
                    'Account created successfully!\n\n' +
                    '(Note: Dashboards for the ' + role + ' role are not yet implemented.)'
                );
            }
        })
        .catch(error => {
            console.error('Registration error:', error);
            showErrorMessage('Failed to connect to server. Please try again.');
        });
    }
});

// Function to show error message
function showErrorMessage(message) {
    // Create error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
        color: white;
        padding: 24px 32px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        font-weight: 500;
        text-align: center;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -60%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
        style.remove();
    }, 3000);
}

// Function to show success message and redirect
function showSuccessMessage(message, callback) {
    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #0e7490 0%, #06b6d4 100%);
        color: white;
        padding: 24px 32px;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        font-weight: 500;
        text-align: center;
        animation: slideIn 0.3s ease;
        max-width: 400px;
    `;
    notification.textContent = message;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translate(-50%, -60%);
            }
            to {
                opacity: 1;
                transform: translate(-50%, -50%);
            }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Execute callback after a short delay
    setTimeout(() => {
        if (callback) callback();
    }, 1500);
}

function deriveNameFromEmail(email) {
    if (!email) return 'Patient User';
    const localPart = email.split('@')[0].replace(/[._-]+/g, ' ');
    return localPart
        .split(' ')
        .filter(Boolean)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ') || 'Patient User';
}

// Initialize - hide all conditional fields on page load
hideAllFields();

