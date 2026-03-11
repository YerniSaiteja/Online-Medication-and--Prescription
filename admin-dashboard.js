
document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
        window.location.href = 'index.html';
        return;
    }
    const userData = JSON.parse(userDataStr);
    if (userData.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    // --- Theme Management ---
    const themeToggle = document.getElementById('themeToggle');
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
        if (themeToggle) {
            const icon = themeToggle.querySelector('.theme-icon');
            if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    initTheme();

    // --- Navigation ---
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const logoutBtn = document.getElementById('logoutBtn');
    const navUserName = document.getElementById('navUserName');

    if (navUserName) navUserName.textContent = userData.fullName;

    // Profile Population
    const profileName = document.getElementById('profileName');
    const userDetailsGrid = document.querySelector('.user-details-grid');
    if (profileName) profileName.textContent = userData.fullName;
    if (userDetailsGrid) {
        userDetailsGrid.innerHTML = `
            <div class="info-item"><label>Email</label><p>${userData.email}</p></div>
            <div class="info-item"><label>Phone</label><p>${userData.phone}</p></div>
            <div class="info-item"><label>Role</label><p>System Administrator</p></div>
        `;
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.dataset.page;

            navLinks.forEach(n => n.classList.remove('active'));
            link.classList.add('active');

            pages.forEach(p => {
                p.classList.remove('active');
                if (p.id === target) p.classList.add('active');
            });

            if (target === 'dashboard') loadDashboardStats();
            if (target === 'analytics') loadAnalytics();
            if (target === 'reports') loadReports();
        });
    });

    // ... (Logout logic stays same)

    // --- Dynamic Analytics Logic ---

    // Mock Data for Roles
    const analyticsData = {
        patient: {
            title: 'Medication Adherence',
            percentage: '85%',
            change: 'Last 30 Days +5%',
            graphData: [60, 75, 65, 85],
            history: [
                { name: 'Medication A', date: '2023-01-15' },
                { name: 'Medication B', date: '2023-02-02' },
                { name: 'Medication C', date: '2023-03-05' }
            ]
        },
        doctor: {
            title: 'Prescription Rate',
            percentage: '92%',
            change: 'Last 30 Days +12%',
            graphData: [40, 55, 80, 92],
            history: [
                { name: 'Dr. Smith - Cardio', date: 'Today' },
                { name: 'Dr. Jones - Neuro', date: 'Yesterday' },
                { name: 'Dr. Emily - Peds', date: '2 days ago' }
            ]
        },
        pharmacy: {
            title: 'Inventory Turnover',
            percentage: '78%',
            change: 'Last 30 Days -2%',
            graphData: [85, 70, 75, 78],
            history: [
                { name: 'Paracetamol Stock', date: 'Refilled' },
                { name: 'Insulin Batch', date: 'Expiring Soon' },
                { name: 'Amoxicillin', date: 'Low Stock' }
            ]
        },
        admin: {
            title: 'System Activity',
            percentage: '99%',
            change: 'Stable',
            graphData: [90, 95, 92, 99],
            history: [
                { name: 'New User Signup', date: '10 mins ago' },
                { name: 'System Backup', date: '1 hour ago' },
                { name: 'Audit Log', date: 'Running' }
            ]
        }
    };

    let currentRole = 'patient';

    function loadAnalytics() {
        // Initial Render
        updateAnalyticsUI(currentRole);
        setupTabListeners();
    }

    function setupTabListeners() {
        const tabs = document.querySelectorAll('#analyticsTabs span');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all
                tabs.forEach(t => t.classList.remove('active'));
                // Add to click
                tab.classList.add('active');

                // Update UI
                const role = tab.getAttribute('data-role');
                currentRole = role;
                updateAnalyticsUI(role);
            });
        });
    }

    async function updateAnalyticsUI(role) {
        let data = analyticsData[role];

        // If Patient role, fetch real data from backend
        if (role === 'patient') {
            try {
                const response = await fetch(window.getApiUrl('analytics/patient-activity'));
                const realData = await response.json();

                // Merge with mock patient structure
                data = {
                    ...analyticsData.patient,
                    graphData: realData.graphData || [0, 0, 0, 0], // Keep for other uses if any, but we'll use percentage for gauge
                    // Calculate percentage based on some metric or use the mock percentage if not provided
                    // For now, let's keep the mock percentage or randomize it for "real-feel" if backend doesn't send it.
                    // The backend sends 'graphData' (weeks), 'missedRemainder', 'newPrescriptions'.
                    // It doesn't send an explicit 'percentage' for adherence in the new structure (it was in get_adherence_stats but that's different endpoint).
                    // We'll stick to the existing percentage logic or just use the mock one from analyticsData.patient for the gauge value.
                    // Let's parse the string "85%" -> 85.

                    missedRemainder: realData.missedRemainder || { count: 0, details: [] },
                    newPrescriptions: realData.newPrescriptions || []
                };
            } catch (e) {
                console.error("Failed to fetch patient analytics", e);
                data = analyticsData['patient'];
            }
        }

        if (!data) return;

        // Update Text
        document.getElementById('analyticsTitle').textContent = data.title;
        document.getElementById('analyticsPercentage').textContent = data.percentage;
        document.getElementById('analyticsChange').textContent = data.change;

        // Update Graph
        if (role === 'patient') {
            // Use line chart for patient as requested
            renderLineChart(data.graphData);
        } else {
            // Use line chart for others
            renderLineChart(data.graphData);
        }

        // Update History List
        const listContainer = document.getElementById('analyticsHistoryList');
        // Clear existing
        listContainer.innerHTML = '';

        // Show missed remainder and new prescriptions for patient analytics
        if (role === 'patient') {
            // 1. Missed Reminders (Priority)
            if (data.missedRemainder && data.missedRemainder.count > 0) {
                const missedHeader = document.createElement('div');
                missedHeader.style.cssText = 'padding: 10px; font-weight: 600; color: #ef4444; border-bottom: 1px solid #27272a;';
                missedHeader.textContent = `⚠️ Missed Reminders (${data.missedRemainder.count})`;
                listContainer.appendChild(missedHeader);

                data.missedRemainder.details.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'list-item';
                    div.style.cssText = 'padding: 10px; border-bottom: 1px solid #27272a;';
                    div.innerHTML = `
                        <span>⏰</span>
                        <div>
                            <p style="color: #ef4444;">${item.medication}</p>
                            <small class="sub">Missed on ${item.date} at ${item.time}</small>
                        </div>
                    `;
                    listContainer.appendChild(div);
                });
            } else {
                const niceHeader = document.createElement('div');
                niceHeader.style.cssText = 'padding: 10px; font-weight: 600; color: #4ade80; border-bottom: 1px solid #27272a;';
                niceHeader.textContent = `✅ No Missed Reminders`;
                listContainer.appendChild(niceHeader);
            }
        } else {
            // For other roles, show history as before
            if (data.history && data.history.length === 0) {
                listContainer.innerHTML = '<p style="padding:10px; color:#a1a1aa">No recent activity found.</p>';
            } else if (data.history) {
                data.history.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'list-item';
                    div.innerHTML = `
                        <span>💊</span>
                        <div>
                            <p>${item.name}</p>
                            <small class="sub">${item.date}</small>
                        </div>
                    `;
                    listContainer.appendChild(div);
                });
            }
        }
    }

    function renderSemicircleGauge(percentage) {
        const canvas = document.getElementById("lineChart");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        // Set dimensions
        canvas.width = canvas.offsetWidth;
        canvas.height = 180; // Slightly taller for gauge + text

        const centerX = canvas.width / 2;
        const centerY = canvas.height - 20; // Bottom centered
        const radius = Math.min(centerX, canvas.height) - 30;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw background arc (gray)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 0); // 180 to 0 degrees
        ctx.lineWidth = 25;
        ctx.strokeStyle = '#27272a';
        ctx.lineCap = 'round';
        ctx.stroke();

        // draw value arc (green/color depending on value)
        // Map 0-100 to Math.PI to 0
        // Angle = PI + (percentage/100) * PI
        const endAngle = Math.PI + (percentage / 100) * Math.PI;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, endAngle);
        ctx.lineWidth = 25;
        // Gradient for the arc
        const gradient = ctx.createLinearGradient(0, centerY, canvas.width, centerY);
        gradient.addColorStop(0, '#ef4444'); // Red (low)
        gradient.addColorStop(0.5, '#eab308'); // Yellow
        gradient.addColorStop(1, '#4ade80'); // Green (high)

        ctx.strokeStyle = gradient;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw Value Text in Center
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${percentage}%`, centerX, centerY - 10);

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Adherence Score', centerX, centerY - 50);
    }

    function renderLineChart(dataPoints) {
        const canvas = document.getElementById("lineChart");
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // Set canvas resolution match display size
        canvas.width = canvas.offsetWidth;
        canvas.height = 150; // Match CSS

        const max = 100;

        // Clear Canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Line
        ctx.strokeStyle = "#4ade80"; // Bright Green match image
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        dataPoints.forEach((value, index) => {
            const x = (index / (dataPoints.length - 1)) * canvas.width;
            // Pad top and bottom slightly
            const padding = 20;
            const drawingHeight = canvas.height - (padding * 2);
            const y = (canvas.height - padding) - (value / max) * drawingHeight;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // Add Gradient fill below
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "rgba(74, 222, 128, 0.2)");
        gradient.addColorStop(1, "rgba(74, 222, 128, 0.0)");

        ctx.fillStyle = gradient;
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.fill();
    }

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });

    // --- Data Loading Functions ---

    // 1. Dashboard Overview
    async function loadDashboardStats() {
        try {
            const response = await fetch(window.getApiUrl('analytics'));
            const data = await response.json();

            if (data.users) {
                document.getElementById('totalUsers').textContent = data.users.total;
            }
            if (data.prescriptions) {
                document.getElementById('activePrescriptions').textContent = data.prescriptions.active;
            }
            if (data.inventory) {
                document.getElementById('lowStockItems').textContent = data.inventory.lowStock;
            }

            // Add call to load pending doctors
            loadPendingDoctors();
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    }

    // Pending Doctors Handle
    async function loadPendingDoctors() {
        try {
            const response = await fetch(window.getApiUrl('admin/doctors/pending'));
            const doctors = await response.json();
            const tbody = document.getElementById('pendingDoctorsTableBody');

            if (!tbody) return;

            if (doctors.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px; color:#a1a1aa;">No pending approvals needed.</td></tr>';
                return;
            }

            tbody.innerHTML = doctors.map(doc => `
                <tr>
                    <td>${doc.fullName}</td>
                    <td>${doc.email}</td>
                    <td>${doc.licenseNumber || 'N/A'}</td>
                    <td>${doc.specialization || 'N/A'}</td>
                    <td>${doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'N/A'}</td>
                    <td>
                        <button onclick="approveDoctor(${doc.id})" style="background:#4ade80; color:#18181b; padding:4px 8px; border:none; border-radius:4px; cursor:pointer; font-size:0.85em; font-weight:600; margin-right:5px;">Approve</button>
                        <button onclick="rejectDoctor(${doc.id})" style="background:#ef4444; color:#fff; padding:4px 8px; border:none; border-radius:4px; cursor:pointer; font-size:0.85em; font-weight:600;">Reject</button>
                    </td>
                </tr>
            `).join('');

        } catch (e) {
            console.error("Failed to load pending doctors", e);
            const tbody = document.getElementById('pendingDoctorsTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#ef4444;">Error loading pending approvals.</td></tr>';
        }
    }

    window.approveDoctor = async function (id) {
        if (!confirm('Are you sure you want to approve this doctor?')) return;
        try {
            const res = await fetch(window.getApiUrl(`admin/doctors/${id}/verify`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                alert('Doctor approved successfully!');
                loadPendingDoctors(); // Refresh table
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to approve doctor');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred.');
        }
    };

    window.rejectDoctor = async function (id) {
        if (!confirm('Are you sure you want to reject and delete this doctor account?')) return;
        try {
            const res = await fetch(window.getApiUrl(`admin/doctors/${id}/reject`), {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                alert('Doctor application rejected.');
                loadPendingDoctors(); // Refresh table
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to reject doctor');
            }
        } catch (e) {
            console.error(e);
            alert('An error occurred.');
        }
    };

    // 3. Reports & Insights
    async function loadReports() {
        try {
            const response = await fetch(window.getApiUrl('analytics/pharmacy'));
            const data = await response.json();

            // Top Drugs
            const topList = document.getElementById('topDrugsList');
            if (data.topDrugs && data.topDrugs.length > 0) {
                topList.innerHTML = data.topDrugs.map(d => `
                    <li style="margin-bottom:8px; display:flex; justify-content:space-between; border-bottom:1px solid #27272a; padding-bottom:4px;">
                        <span>${d.name}</span>
                        <span style="font-weight:600; color:#f4f4f5">${d.count} sales</span>
                    </li>
                `).join('');
            } else {
                topList.innerHTML = '<li>No data available</li>';
            }

            // Expiring
            const expiringList = document.getElementById('expiringList');
            if (data.expiringItems && data.expiringItems.length > 0) {
                expiringList.innerHTML = data.expiringItems.map(d => `
                     <li style="margin-bottom:8px; display:flex; justify-content:space-between; border-bottom:1px solid #27272a; padding-bottom:4px;">
                        <span>${d.name}</span>
                        <span style="font-size:0.9em;">${d.date}</span>
                    </li>
                `).join('');
            } else {
                expiringList.innerHTML = '<li style="color:#a1a1aa">No items expiring soon.</li>';
            }

        } catch (e) { console.error(e); }
    }

    // Download Report Logic
    const downloadBtn = document.getElementById('downloadReportBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            window.location.href = window.getApiUrl('reports/export');
        });
    }

    // Initial Load
    loadDashboardStats();

});
