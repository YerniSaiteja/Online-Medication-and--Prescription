// Theme Management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');
const body = document.body;

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

// Navigation Menu Functionality
const navLinks = document.querySelectorAll('.nav-link');
const pageContents = document.querySelectorAll('.page-content');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // Remove active class from all links and pages
        navLinks.forEach(l => l.classList.remove('active'));
        pageContents.forEach(page => page.classList.remove('active'));

        // Add active class to clicked link
        link.classList.add('active');

        // Show corresponding page
        const targetPage = link.getAttribute('data-page');
        const targetPageElement = document.getElementById(targetPage);
        if (targetPageElement) {
            targetPageElement.classList.add('active');
        }
    });
});


// --------------------------------------------------------
// REMINDER SYSTEM
// --------------------------------------------------------

// Sound Effect (Simple Beep)
const alarmSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); // Short placeholder, will replace with longer beep
// Better alarm sound (generated simple sine wave beep for 1 sec repeated)
// For brevity using a simple online hosted MP3 or a standard beep if possible, but data URI is safest.
// Using a slightly longer beep data URI:
const beepUrl = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU"; // Placeholder

// Helper to play sound
let alarmInterval = null;
function playAlarm() {
    // Create a simple oscillator beep if browser supports AudioContext for better control
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880; // A5
            gain.gain.value = 0.1;
            osc.start();

            // Pulse effect
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.stop(ctx.currentTime + 0.5);

            // Loop it
            alarmInterval = setInterval(() => {
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(ctx.destination);
                osc2.frequency.value = 880;
                gain2.gain.value = 0.1;
                osc2.start();
                gain2.gain.setValueAtTime(0.1, ctx.currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
                osc2.stop(ctx.currentTime + 0.5);
            }, 1000);
        }
    } catch (e) {
        console.error("Audio error", e);
    }
}

function stopAlarm() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
}

// Modal Functionality
const addReminderBtn = document.getElementById('addReminderBtn');
const addReminderModal = document.getElementById('addReminderModal');
const closeModal = document.getElementById('closeModal');
const cancelReminder = document.getElementById('cancelReminder');
const reminderForm = document.getElementById('reminderForm');

// Alarm Modal
const alarmModal = document.getElementById('alarmModal');
const stopAlarmBtn = document.getElementById('stopAlarmBtn');

// Open modal
addReminderBtn.addEventListener('click', () => {
    // Set default date to today
    const tomorrow = new Date();
    const dateInput = document.getElementById('reminderDateInput');
    if (dateInput) {
        dateInput.valueAsDate = tomorrow;
    }
    addReminderModal.classList.add('active');
});

// Close modal
function closeReminderModal() {
    addReminderModal.classList.remove('active');
    reminderForm.reset();
}

closeModal.addEventListener('click', closeReminderModal);
cancelReminder.addEventListener('click', closeReminderModal);

// Close modal when clicking outside
addReminderModal.addEventListener('click', (e) => {
    if (e.target === addReminderModal) {
        closeReminderModal();
    }
});

// Handle form submission (Create Reminder)
reminderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;
    const userData = JSON.parse(userDataStr);

    const medication = reminderForm.querySelector('input[type="text"]').value;
    const date = reminderForm.querySelector('#reminderDateInput').value;
    const time = reminderForm.querySelector('input[type="time"]').value;
    const frequencySelect = reminderForm.querySelector('select');
    const frequency = frequencySelect.value;
    const notes = reminderForm.querySelector('textarea').value;

    try {
        const response = await fetch('http://localhost:5000/api/reminders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userData.id,
                medicationName: medication,
                date: date,
                time: time,
                frequency: frequency,
                notes: notes
            })
        });

        if (response.ok) {
            closeReminderModal();
            showNotification('Reminder set successfully!');
            loadReminders(); // Refresh list
        } else {
            const err = await response.json();
            showNotification('Error: ' + err.error);
        }
    } catch (error) {
        console.error('Error creating reminder:', error);
        showNotification('Failed to create reminder');
    }
});

// Load Reminders
async function loadReminders() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;
    const userData = JSON.parse(userDataStr);

    try {
        const response = await fetch(`http://localhost:5000/api/reminders?user_id=${userData.id}`);
        if (!response.ok) return;
        const reminders = await response.json();

        renderReminders(reminders);

        // Update dashboard count
        const countEl = document.querySelector('.stat-card-success .stat-number');
        if (countEl) countEl.textContent = reminders.length;

    } catch (error) {
        console.error('Error loading reminders:', error);
    }
}

function renderReminders(reminders) {
    const container = document.querySelector('.reminders-container');
    if (!container) return;

    // Sort by date/time
    reminders.sort((a, b) => {
        const dateA = a.date ? a.date : '9999-99-99';
        const dateB = b.date ? b.date : '9999-99-99';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.time.localeCompare(b.time);
    });

    container.innerHTML = reminders.map(reminder => `
        <div class="reminder-card" data-id="${reminder.id}">
            <div class="reminder-card-header">
                <h3>${reminder.medicationName}</h3>
                <span class="reminder-badge">${reminder.frequency}</span>
            </div>
            <div class="reminder-card-body">
                <div class="reminder-info">
                    <p><strong>Date:</strong> ${reminder.date || 'Daily'}</p>
                    <p><strong>Time:</strong> ${formatTime(reminder.time)}</p>
                </div>
                <div class="reminder-actions" style="margin-top: 10px;">
                    <button class="btn-delete" onclick="deleteReminder(${reminder.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function deleteReminder(id) {
    if (!confirm('Delete this reminder?')) return;

    try {
        const response = await fetch(`http://localhost:5000/api/reminders/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showNotification('Reminder deleted');
            loadReminders();
        }
    } catch (error) {
        showNotification('Failed to delete');
    }
}
// Make deleteReminder global so onclick works
window.deleteReminder = deleteReminder;


// Check Reminders (Polling Logic)
setInterval(() => {
    checkReminders();
}, 10000); // Check every 10 seconds

async function checkReminders() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;
    const userData = JSON.parse(userDataStr);

    try {
        const response = await fetch(`http://localhost:5000/api/reminders?user_id=${userData.id}`);
        if (!response.ok) return;
        const reminders = await response.json();

        // Force IST Time (UTC + 5:30)
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istOffset = 5.5 * 60 * 60 * 1000;
        const istDate = new Date(utcTime + istOffset);

        const currentHours = istDate.getHours().toString().padStart(2, '0');
        const currentMinutes = istDate.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        const currentDate = istDate.toISOString().split('T')[0]; // YYYY-MM-DD

        reminders.forEach(reminder => {
            // Check matches
            const timeMatch = reminder.time === currentTime;
            const dateMatch = !reminder.date || reminder.date === currentDate;

            if (timeMatch && dateMatch) {
                // Check if already shown this minute
                const key = `reminder_shown_${reminder.id}_${currentDate}_${currentTime}`;
                if (!sessionStorage.getItem(key)) {
                    triggerAlarm(reminder);
                    sessionStorage.setItem(key, 'true');
                }
            }
        });

    } catch (error) {
        console.error('Check error', error);
    }
}

function triggerAlarm(reminder) {
    // Show Modal
    const nameEl = document.getElementById('alarmMedicineName');
    const timeEl = document.getElementById('alarmTime');

    if (nameEl) nameEl.textContent = reminder.medicationName;
    if (timeEl) timeEl.textContent = formatTime(reminder.time);

    alarmModal.classList.add('active'); // This assumes your CSS handles .active for modals (display: flex/block)
    alarmModal.style.display = 'flex'; // Force display if css class isn't enough

    playAlarm();
}

if (stopAlarmBtn) {
    stopAlarmBtn.addEventListener('click', () => {
        alarmModal.classList.remove('active');
        alarmModal.style.display = 'none';
        stopAlarm();
    });
}


const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = document.getElementById('editProfileModal');
const closeEditProfile = document.getElementById('closeEditProfile');
const cancelEditProfile = document.getElementById('cancelEditProfile');
const editProfileForm = document.getElementById('editProfileForm');
const editFullName = document.getElementById('editFullName');
const editEmail = document.getElementById('editEmail');
const editPhone = document.getElementById('editPhone');
const editDob = document.getElementById('editDob');
const editGender = document.getElementById('editGender');
const editAddress = document.getElementById('editAddress');
const editMedicalHistory = document.getElementById('editMedicalHistory');

function openEditProfile() {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);
            editFullName.value = userData.fullName || '';
            editEmail.value = userData.email || '';
            editPhone.value = userData.phone || '';
            editDob.value = userData.dob || '';
            editGender.value = userData.gender || '';
            editAddress.value = userData.address || '';
            editMedicalHistory.value = userData.medicalHistory || '';
        } catch { }
    }
    editProfileModal.classList.add('active');
}

function closeEditProfileModal() {
    editProfileModal.classList.remove('active');
}

if (editProfileBtn) {
    editProfileBtn.addEventListener('click', openEditProfile);
}
if (closeEditProfile) {
    closeEditProfile.addEventListener('click', closeEditProfileModal);
}
if (cancelEditProfile) {
    cancelEditProfile.addEventListener('click', closeEditProfileModal);
}
if (editProfileModal) {
    editProfileModal.addEventListener('click', (e) => {
        if (e.target === editProfileModal) {
            closeEditProfileModal();
        }
    });
}

if (editProfileForm) {
    editProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userDataStr = localStorage.getItem('userData');
        const existing = userDataStr ? JSON.parse(userDataStr) : {};
        const updated = {
            ...existing,
            fullName: editFullName.value.trim(),
            email: editEmail.value.trim(),
            phone: editPhone.value.trim(),
            dob: editDob.value,
            gender: editGender.value,
            address: editAddress.value.trim(),
            medicalHistory: editMedicalHistory.value
        };
        localStorage.setItem('userData', JSON.stringify(updated));
        loadUserData();
        closeEditProfileModal();
        showNotification('Profile updated successfully!');
    });
}

// Helper function to format time
function formatTime(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// Notification function
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: linear-gradient(135deg, #0e7490 0%, #06b6d4 100%);
        color: white;
        padding: 16px 24px;
        border-radius: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        font-weight: 500;
    `;
    notification.textContent = message;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 3000);
}

// Load user data from localStorage
function loadUserData() {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
        try {
            const userData = JSON.parse(userDataStr);

            // Update user name in navigation
            const userNameElements = document.querySelectorAll('.user-name');
            if (userData.fullName) {
                userNameElements.forEach(el => {
                    el.textContent = userData.fullName;
                });
            }

            // Update user avatar initials
            const avatarElements = document.querySelectorAll('.user-avatar-small, .profile-avatar');
            if (userData.fullName) {
                const initials = userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
                avatarElements.forEach(el => {
                    el.textContent = initials;
                });
            }

            // Update dashboard welcome message
            const welcomeMessage = document.querySelector('.page-header p');
            if (welcomeMessage && userData.fullName) {
                const firstName = userData.fullName.split(' ')[0];
                welcomeMessage.textContent = `Welcome back, ${firstName}! Here's your health overview`;
            }

            // Update role labels
            const formattedRole = userData.role
                ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1)
                : 'Patient';
            const roleElements = document.querySelectorAll('.user-role');
            roleElements.forEach(roleEl => (roleEl.textContent = formattedRole));

            // Update profile page with user data
            if (userData.fullName) {
                const profileName = document.querySelector('.profile-info h2');
                const profileId = document.querySelector('.profile-info p');
                if (profileName) profileName.textContent = userData.fullName;
                if (profileId && userData.id) {
                    // Format ID to 5 digits (e.g., 00005)
                    const formattedId = userData.id.toString().padStart(5, '0');
                    profileId.textContent = `Patient ID: ${formattedId}`;
                }
            }

            // Update info grid values
            const infoItems = document.querySelectorAll('.info-item');
            infoItems.forEach(item => {
                const labelEl = item.querySelector('label');
                const valueEl = item.querySelector('p');
                if (!labelEl || !valueEl) return;
                const labelText = labelEl.textContent.toLowerCase();
                if (labelText.includes('full name') && userData.fullName) {
                    valueEl.textContent = userData.fullName;
                } else if (labelText.includes('email') && userData.email) {
                    valueEl.textContent = userData.email;
                } else if (labelText.includes('phone') && userData.phone) {
                    valueEl.textContent = userData.phone;
                } else if (labelText.includes('date of birth') && userData.dob) {
                    const d = userData.dob;
                    try {
                        const dt = new Date(d);
                        valueEl.textContent = isNaN(dt.getTime()) ? d : dt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                    } catch {
                        valueEl.textContent = d;
                    }
                } else if (labelText.includes('gender') && userData.gender) {
                    valueEl.textContent = userData.gender;
                } else if (labelText.includes('address') && userData.address) {
                    valueEl.textContent = userData.address;
                }
            });

            if (userData.medicalHistory) {
                const medicalHistoryDiv = document.querySelector('.medical-history');
                if (medicalHistoryDiv) {
                    const entries = userData.medicalHistory.split(/\r?\n/).filter(Boolean);
                    medicalHistoryDiv.innerHTML = entries.length
                        ? entries.map(entry => `<p>${entry}</p>`).join('')
                        : `<p>${userData.medicalHistory}</p>`;
                }
            }

            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return false;
        }
    }
    return false;
}

// Check if user is logged in, redirect to login if not
function checkAuth() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Fetch prescriptions from API
async function loadPrescriptions() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;
    const userData = JSON.parse(userDataStr);

    try {
        const response = await fetch(`http://localhost:5000/api/prescriptions?patient_id=${userData.id}`);
        if (!response.ok) throw new Error('Failed to load prescriptions');

        const prescriptions = await response.json();

        renderPrescriptionsPage(prescriptions);
        renderRecentPrescriptionsWidget(prescriptions);
        updateActivePrescriptionsCount(prescriptions);
    } catch (error) {
        console.error('Error loading prescriptions:', error);
        // Fallback to empty if API fails, or keep hardcoded placeholders? 
        // Better to show error or empty state
    }
}

function renderPrescriptionsPage(prescriptions) {
    const container = document.querySelector('.prescription-cards');
    if (!container) return;

    if (prescriptions.length === 0) {
        container.innerHTML = '<p style="padding: 20px; color: var(--text-secondary);">No prescriptions found.</p>';
        return;
    }

    container.innerHTML = prescriptions.map(presc => `
        <div class="prescription-card">
            <div class="prescription-header">
                <h3>${presc.medicineName}</h3>
                <span class="prescription-status ${presc.status.toLowerCase()}">${presc.status}</span>
                <button class="btn-secondary btn-small download-prescription">Download</button>
            </div>
            <div class="prescription-body">
                <div class="prescription-detail">
                    <strong>Doctor:</strong> ${presc.doctorName || 'Dr. Unknown'}
                </div>
                <div class="prescription-detail">
                    <strong>Date:</strong> ${new Date(presc.createdAt).toLocaleDateString()}
                </div>
                <div class="prescription-detail">
                    <strong>Dosage:</strong> ${presc.doseFrequency}
                </div>
                <div class="prescription-detail">
                    <strong>Duration:</strong> ${presc.endDate ? 'Until ' + new Date(presc.endDate).toLocaleDateString() : 'Ongoing'}
                </div>
                <div class="prescription-detail">
                    <strong>Instructions:</strong> ${presc.notesInstructions || 'None'}
                </div>
            </div>
        </div>
    `).join('');

    // Attach download listeners to new buttons
    container.querySelectorAll('.download-prescription').forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.prescription-card');
            downloadPrescriptionCard(card);
        });
    });
}

function renderRecentPrescriptionsWidget(prescriptions) {
    const list = document.querySelector('.prescription-list');
    if (!list) return;

    if (prescriptions.length === 0) {
        list.innerHTML = '<p style="text-align:center; padding: 10px; color: var(--text-secondary);">No recent prescriptions</p>';
        return;
    }

    const recent = prescriptions.slice(0, 3);

    list.innerHTML = recent.map(presc => `
        <div class="prescription-item">
            <div class="prescription-item-icon">🩺</div>
            <div class="prescription-item-content">
                <div class="prescription-name">${presc.medicineName}</div>
                <div class="prescription-details">
                    <span class="doctor-name">${presc.doctorName || 'Doctor'}</span>
                    <span class="prescription-date">${new Date(presc.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="prescription-status-badge ${presc.status.toLowerCase()}">${presc.status}</div>
        </div>
    `).join('');
}

function updateActivePrescriptionsCount(prescriptions) {
    const activeCount = prescriptions.filter(p => p.status === 'Active').length;
    const el = document.querySelector('.stat-card-primary .stat-number');
    if (el) el.textContent = activeCount;
}

async function downloadPrescriptionCard(card) {
    if (!card) return;
    const name = card.querySelector('.prescription-header h3')?.textContent || 'Prescription';
    const status = card.querySelector('.prescription-status')?.textContent || 'Status';
    const details = Array.from(card.querySelectorAll('.prescription-detail'))
        .map(el => el.textContent.trim());

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text(`Prescription: ${name}`, 20, 20);

    doc.setFontSize(14);
    doc.text(`Status: ${status}`, 20, 30);

    doc.setFontSize(12);
    let y = 50;
    details.forEach(detail => {
        doc.text(detail, 20, y);
        y += 10;
    });

    doc.save(`${name.replace(/\s+/g, '_')}.pdf`);
    showNotification('Prescription downloaded as PDF');
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication first
    if (!checkAuth()) {
        return; // Will redirect to login page
    }

    // Load user data
    loadUserData();
    loadPrescriptions();
    loadReminders(); // NEW

    // Set dashboard as active by default
    const dashboardLink = document.querySelector('[data-page="dashboard"]');
    if (dashboardLink) {
        dashboardLink.click();
    }

    const dateDisplay = document.getElementById('currentDate');
    if (dateDisplay) {
        const setDateTime = () => {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            dateDisplay.textContent = `${dateStr} • ${timeStr}`;
        };
        setDateTime();
        setInterval(setDateTime, 1000);
    }

    // Update logout button to clear localStorage
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('userData');
            window.location.href = 'index.html';
        });
    }

    const downloadButtons = document.querySelectorAll('.download-prescription');
    downloadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.prescription-card');
            if (!card) return;
            const name = card.querySelector('.prescription-header h3')?.textContent || 'Prescription';
            const status = card.querySelector('.prescription-status')?.textContent || 'Status';
            const details = Array.from(card.querySelectorAll('.prescription-detail'))
                .map(el => el.textContent.trim());
            const content = `Prescription: ${name}\nStatus: ${status}\n\nDetails:\n${details.join('\n')}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `${name.replace(/\s+/g, '_')}.txt`;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                URL.revokeObjectURL(a.href);
                a.remove();
            }, 0);
            showNotification('Prescription downloaded');
        });
    });
});
