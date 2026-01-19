
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
                const response = await fetch('http://localhost:5000/api/analytics/patient-activity');
                const realData = await response.json();

                // Merge with mock patient structure (preserve title/percentage format for now, or calculate percs)
                data = {
                    ...analyticsData.patient,
                    graphData: realData.graphData || [0, 0, 0, 0],
                    history: realData.history || []
                };
            } catch (e) {
                console.error("Failed to fetch patient analytics", e);
                // Fallback to mock if error
                data = analyticsData['patient'];
            }
        }

        if (!data) return;

        // Update Text
        document.getElementById('analyticsTitle').textContent = data.title;
        document.getElementById('analyticsPercentage').textContent = data.percentage;
        document.getElementById('analyticsChange').textContent = data.change;

        // Update Graph
        renderLineChart(data.graphData);

        // Update History List
        const listContainer = document.getElementById('analyticsHistoryList');
        // Clear existing
        listContainer.innerHTML = '';

        if (data.history.length === 0) {
            listContainer.innerHTML = '<p style="padding:10px; color:#a1a1aa">No recent prescriptions found.</p>';
        } else {
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
                // Bezier Curve for smooth line
                // Simple smoothing: use previous point
                // For this strictly matching user's previous code, regular lineTo or simple curve
                // The image shows smooth curves. Let's try quadraticCurveTo
                const prevX = ((index - 1) / (dataPoints.length - 1)) * canvas.width;
                const prevValue = dataPoints[index - 1];
                const prevY = (canvas.height - padding) - (prevValue / max) * drawingHeight;

                const cpX = (prevX + x) / 2;
                ctx.quadraticCurveTo(cpX, prevY, cpX, (prevY + y) / 2);
                ctx.quadraticCurveTo(cpX, y, x, y);
                // Actually simple lineTo as per user request code is safer to ensure it works, 
                // but image shows smooth. I'll stick to user's provided logic "ctx.lineTo" but with the new dataPoints.
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
            const response = await fetch('http://localhost:5000/api/analytics');
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
        } catch (e) {
            console.error("Failed to load stats", e);
        }
    }

    // 3. Reports & Insights
    async function loadReports() {
        try {
            const response = await fetch('http://localhost:5000/api/analytics/pharmacy');
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
            window.location.href = 'http://localhost:5000/api/reports/export';
        });
    }

    // Initial Load
    loadDashboardStats();

});
