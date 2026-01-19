// Theme Management
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');
const body = document.body;

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.className = savedTheme + '-mode';
    if (themeIcon) {
        updateThemeIcon(savedTheme);
    }
}

function toggleTheme() {
    const currentTheme = body.classList.contains('dark-mode') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    body.className = newTheme + '-mode';
    localStorage.setItem('theme', newTheme);
    if (themeIcon) {
        updateThemeIcon(newTheme);
    }
}

function updateThemeIcon(theme) {
    if (!themeIcon) return;
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// Initialize theme on page load
initTheme();

// Theme toggle event listener
if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

// Navigation Menu Functionality
const navLinks = document.querySelectorAll('.nav-link');
const pageContents = document.querySelectorAll('.page-content');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        navLinks.forEach(l => l.classList.remove('active'));
        pageContents.forEach(page => page.classList.remove('active'));

        link.classList.add('active');

        const targetPage = link.getAttribute('data-page');
        const targetPageElement = document.getElementById(targetPage);
        if (targetPageElement) {
            targetPageElement.classList.add('active');
        }
    });
});

// Helper: notification
function showNotification(message) {
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

    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 300);
    }, 2500);
}

// Load doctor data and guard by role
function loadDoctorData() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
        window.location.href = 'index.html';
        return;
    }

    let userData;
    try {
        userData = JSON.parse(userDataStr);
    } catch {
        window.location.href = 'index.html';
        return;
    }

    // Only doctors can access this page
    if (!userData.role || userData.role.toLowerCase() !== 'doctor') {
        window.location.href = 'patient-dashboard.html';
        return;
    }

    const name = userData.fullName || 'Doctor';
    const firstName = name.split(' ')[0];

    // Welcome text
    const welcomeText = document.getElementById('welcomeText');
    if (welcomeText) {
        welcomeText.textContent = `Good to see you, Dr. ${firstName}. Here's today’s overview.`;
    }

    // Top-right user info
    const userNameEls = document.querySelectorAll('.user-name');
    userNameEls.forEach(el => {
        el.textContent = `Dr. ${name}`;
    });

    const roleEls = document.querySelectorAll('.user-role');
    roleEls.forEach(el => {
        el.textContent = 'Doctor';
    });

    // Avatar initials
    const avatarEls = document.querySelectorAll('.user-avatar-small, .profile-avatar');
    const initials = name
        .split(' ')
        .map(p => p[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    avatarEls.forEach(el => {
        el.textContent = initials || 'DR';
    });

    // Profile info
    const profileName = document.getElementById('profileName');
    const infoFullName = document.getElementById('infoFullName');
    const infoEmail = document.getElementById('infoEmail');
    const infoPhone = document.getElementById('infoPhone');
    const infoLicense = document.getElementById('infoLicense');
    const infoSpec = document.getElementById('infoSpec');
    const profileSpecialization = document.getElementById('profileSpecialization');

    if (profileName) profileName.textContent = name;
    if (infoFullName) infoFullName.textContent = name;
    if (infoEmail) infoEmail.textContent = userData.email || '';
    if (infoPhone) infoPhone.textContent = userData.phone || '';
    if (infoLicense) infoLicense.textContent = userData.licenseNumber || '—';
    if (infoSpec) infoSpec.textContent = userData.specialization || 'General Medicine';
    if (profileSpecialization) {
        profileSpecialization.textContent = `Specialization: ${userData.specialization || 'General Medicine'}`;
    }
}

// Date/time in header
function initDateTime() {
    const dateDisplay = document.getElementById('currentDate');
    if (!dateDisplay) return;
    const setDateTime = () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const timeStr = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        dateDisplay.textContent = `${dateStr} • ${timeStr}`;
    };
    setDateTime();
    setInterval(setDateTime, 60000);
}

// Simple search filters
function initSearchFilters() {
    const patientSearch = document.getElementById('patientSearch');
    const patientsTable = document.getElementById('patientsTable');
    if (patientSearch && patientsTable) {
        patientSearch.addEventListener('input', () => {
            const term = patientSearch.value.toLowerCase();
            const rows = patientsTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }

    const prescriptionSearch = document.getElementById('prescriptionSearch');
    const prescriptionsTable = document.getElementById('prescriptionsTable');
    if (prescriptionSearch && prescriptionsTable) {
        prescriptionSearch.addEventListener('input', () => {
            const term = prescriptionSearch.value.toLowerCase();
            const rows = prescriptionsTable.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(term) ? '' : 'none';
            });
        });
    }
}

// Inventory Datalist Population
async function loadMedicineOptions() {
    const dataList = document.getElementById('medicineList');
    if (!dataList) return;

    try {
        // Fetch all inventory
        const response = await fetch('http://localhost:5000/api/inventory');
        if (response.ok) {
            const inventory = await response.json();

            // Filter for unique drug names that are in stock (quantity > 0)
            const uniqueDrugs = [...new Set(inventory
                .filter(item => item.quantity > 0)
                .map(item => item.drugName)
            )];

            dataList.innerHTML = uniqueDrugs
                .map(name => `<option value="${name}">`)
                .join('');
        }
    } catch (error) {
        console.error('Failed to load medicine options:', error);
    }
}

// Create prescription handler
function initCreatePrescriptionForm() {
    const form = document.getElementById('createPrescriptionForm');
    const historyBody = document.getElementById('prescriptionsTableBody');
    const recentList = document.getElementById('recentPrescriptions');
    const clearFormBtn = document.getElementById('clearFormBtn');

    if (!form) return;

    // Clear button functionality
    if (clearFormBtn) {
        clearFormBtn.addEventListener('click', () => {
            form.reset();
            // Reset to default values
            if (document.getElementById('patientId')) document.getElementById('patientId').value = '';
            document.getElementById('patientName').value = '';
            document.getElementById('medicineName').value = '';
            document.getElementById('doseFrequency').value = '1 tablet; 3x/day';
            document.getElementById('notesInstructions').value = 'After food...';
            document.getElementById('startDate').valueAsDate = new Date();
            document.getElementById('endDate').value = '';
            document.getElementById('status').value = 'Active';
            showNotification('Form cleared.');
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (!userData.id || userData.role !== 'doctor') {
            showNotification('Authentication error. Please login again.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Creating...';
        submitBtn.disabled = true;

        const patientIdInput = document.getElementById('patientId');
        const patientNameInput = document.getElementById('patientName');

        const patientId = patientIdInput ? patientIdInput.value : '';
        const patientName = patientNameInput.value.trim();
        const medicineName = document.getElementById('medicineName').value.trim();
        const doseFrequency = document.getElementById('doseFrequency').value.trim();
        const quantityVal = document.getElementById('quantity').value;
        const notesInstructions = document.getElementById('notesInstructions').value.trim();
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const status = document.getElementById('status').value;

        // Check required fields
        if (!patientId || !patientName || !medicineName || !doseFrequency || !startDate || !quantityVal) {
            showNotification('Please fill in all required fields.');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        const quantity = parseInt(quantityVal, 10);
        if (isNaN(quantity) || quantity <= 0) {
            showNotification('Quantity must be a positive number.');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        // Validate Patient ID (5 digits)
        const patientIdPattern = /^\d{5}$/;
        if (!patientIdPattern.test(patientId)) {
            showNotification('Patient ID must be exactly 5 digits (e.g. 00005).');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        const payload = {
            doctorId: userData.id,
            patientId: patientId, // Backend should handle string conversion if needed, or we parse it
            patientName: patientName,
            medicineName: medicineName,
            doseFrequency: doseFrequency,
            quantity: quantity,
            notesInstructions: notesInstructions,
            startDate: startDate,
            endDate: endDate || null,
            status: status
        };

        try {
            const response = await fetch('http://localhost:5000/api/prescriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create prescription');
            }

            // Success - update UI
            const now = new Date();
            const dateShort = now.toLocaleDateString('en-US', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            // Add to prescription history table (if exists)
            if (historyBody) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dateShort}</td>
                    <td>${patientName}</td>
                    <td>${medicineName}</td>
                    <td>${doseFrequency}</td>
                    <td><span class="prescription-status ${status.toLowerCase()}">${status}</span></td>
                    <td><button class="btn-secondary btn-small download-prescription">Download</button></td>
                `;
                historyBody.insertBefore(tr, historyBody.firstChild);

                // Wire download button
                const downloadBtn = tr.querySelector('.download-prescription');
                if (downloadBtn) {
                    downloadBtn.addEventListener('click', () => downloadPrescriptionFromRow(tr));
                }
            }

            // Add to recent prescriptions list on dashboard
            if (recentList) {
                const item = document.createElement('div');
                item.className = 'prescription-item';
                const timeStr = now.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                item.innerHTML = `
                    <div class="prescription-item-icon">💊</div>
                    <div class="prescription-item-content">
                        <div class="prescription-name">${medicineName}</div>
                        <div class="prescription-details">
                            <span class="doctor-name">Patient: ${patientName}</span>
                            <span class="prescription-date">Today • ${timeStr}</span>
                        </div>
                    </div>
                    <div class="prescription-status-badge ${status.toLowerCase()}">${status}</div>
                `;
                recentList.insertBefore(item, recentList.firstChild);
            }

            form.reset();
            // Reset sensitive defaults
            document.getElementById('status').value = 'Active';
            document.getElementById('startDate').valueAsDate = new Date();

            showNotification('Medication added successfully and sent to patient.');

        } catch (error) {
            console.error('Error creating prescription:', error);
            showNotification(`Error: ${error.message}`);
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

async function downloadPrescriptionFromRow(row) {
    const cells = row.querySelectorAll('td');
    if (cells.length < 4) return;
    const date = cells[0].textContent.trim();
    const patient = cells[1].textContent.trim();
    const medication = cells[2].textContent.trim();
    const dosage = cells[3].textContent.trim();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.text("MediCare Prescription", 105, 20, null, null, "center");

    doc.setFontSize(16);
    doc.text(`Date: ${date}`, 20, 40);

    doc.setFontSize(14);
    doc.text(`Patient Name: ${patient}`, 20, 60);
    doc.text(`Medication: ${medication}`, 20, 70);
    doc.text(`Dosage: ${dosage}`, 20, 80);

    doc.setFontSize(10);
    doc.text("Generated via MediCare Doctor Portal", 105, 280, null, null, "center");

    doc.save(`${patient.replace(/\s+/g, '_')}_${medication.replace(/\s+/g, '_')}.pdf`);

    showNotification('Prescription downloaded as PDF.');
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadDoctorData();
    initDateTime();
    initSearchFilters();
    initCreatePrescriptionForm();
    loadMedicineOptions(); // Load inventory options

    // Auto-select dashboard tab
    const dashboardLink = document.querySelector('[data-page="dashboard"]');
    if (dashboardLink) {
        dashboardLink.click();
    }

    // Load prescription history
    loadPrescriptionHistory();
});

// Fetch doctor's prescription history
async function loadPrescriptionHistory() {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) return;
    const userData = JSON.parse(userDataStr);

    if (userData.role !== 'doctor') return;

    try {
        const response = await fetch(`http://localhost:5000/api/prescriptions?doctor_id=${userData.id}`);
        if (!response.ok) throw new Error('Failed to load prescriptions');

        const prescriptions = await response.json();
        const historyBody = document.getElementById('prescriptionsTableBody');

        if (historyBody) {
            if (prescriptions.length === 0) {
                historyBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No prescriptions found.</td></tr>';
            } else {
                historyBody.innerHTML = prescriptions.map(presc => {
                    const dateDesc = new Date(presc.createdAt).toLocaleDateString('en-US', {
                        day: '2-digit', month: 'short', year: 'numeric'
                    });

                    return `
                    <tr>
                        <td>${dateDesc}</td>
                        <td>${presc.patientName}</td>
                        <td>${presc.medicineName}</td>
                        <td>${presc.doseFrequency}</td>
                        <td><span class="prescription-status ${presc.status.toLowerCase()}">${presc.status}</span></td>
                        <td><button class="btn-secondary btn-small download-prescription">Download</button></td>
                    </tr>
                    `;
                }).join('');

                // Attach download handlers
                historyBody.querySelectorAll('.download-prescription').forEach(btn => {
                    const row = btn.closest('tr');
                    btn.addEventListener('click', () => downloadPrescriptionFromRow(row));
                });
            }
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}
