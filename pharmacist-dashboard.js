
document.addEventListener('DOMContentLoaded', () => {
    // Check Auth
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
        window.location.href = 'index.html';
        return;
    }
    const userData = JSON.parse(userDataStr);
    if (userData.role !== 'pharmacist') {
        window.location.href = 'index.html';
        return;
    }

    // Theme Management (Shared Logic)
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

    themeToggle.addEventListener('click', toggleTheme);
    initTheme();

    // UI Elements
    const navUserName = document.getElementById('navUserName');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const logoutBtn = document.getElementById('logoutBtn');

    // Inventory Elements
    const inventoryList = document.getElementById('inventoryList');
    const inventorySearch = document.getElementById('inventorySearch');
    const addInventoryBtn = document.getElementById('addInventoryBtn');

    // Add Modal
    const addInventoryModal = document.getElementById('addInventoryModal');
    const closeAddModal = document.getElementById('closeAddModal');
    const cancelAdd = document.getElementById('cancelAdd');
    const addInventoryForm = document.getElementById('addInventoryForm');

    // Details Modal
    const drugDetailsModal = document.getElementById('drugDetailsModal');
    const closeDetailsModal = document.getElementById('closeDetailsModal');
    const detailsDrugName = document.getElementById('detailsDrugName');
    const drugDetailsContent = document.getElementById('drugDetailsContent');

    // Stats
    const totalInventoryCount = document.getElementById('totalInventoryCount');
    const expiringCount = document.getElementById('expiringCount');

    // Initialize User Info
    navUserName.textContent = userData.fullName;

    // Populate Profile
    const profileName = document.getElementById('profileName');
    const userDetailsGrid = document.querySelector('.user-details-grid');
    if (profileName) profileName.textContent = userData.fullName;

    if (userDetailsGrid) {
        userDetailsGrid.innerHTML = `
            <div class="info-item"><label>Email</label><p>${userData.email}</p></div>
            <div class="info-item"><label>Phone</label><p>${userData.phone}</p></div>
            <div class="info-item"><label>Shop Details</label><p>${userData.shopDetails || 'N/A'}</p></div>
        `;
    }

    // Load Initial Data
    loadInventory();

    // Navigation Logic
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPageId = link.dataset.page;

            // Update Nav
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            // Update View
            pages.forEach(page => {
                page.classList.remove('active');
                if (page.id === targetPageId) {
                    page.classList.add('active');
                }
            });
        });
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    });

    // Inventory Functions
    async function loadInventory() {
        try {
            const response = await fetch(`http://localhost:5000/api/inventory?pharmacist_id=${userData.id}`);
            if (!response.ok) throw new Error('Failed to fetch inventory');

            const inventory = await response.json();
            renderInventory(inventory);
            updateStats(inventory);
        } catch (error) {
            console.error(error);
            if (inventoryList) inventoryList.innerHTML = '<p style="color:red">Error loading inventory</p>';
        }
    }

    function renderInventory(items) {
        if (!inventoryList) return;
        inventoryList.innerHTML = '';
        if (items.length === 0) {
            inventoryList.innerHTML = '<p style="color:var(--text-muted); padding:20px;">No items in inventory.</p>';
            return;
        }

        const today = new Date();

        items.forEach(item => {
            const expiryDate = new Date(item.expiryDate);
            const isExpired = expiryDate < today;
            const isLowStock = item.quantity < 10;

            // Build Badges
            let badgeHtml = '';
            if (isExpired) {
                badgeHtml += `<span class="badge badge-danger">Expired</span>`;
            } else if (isLowStock) {
                badgeHtml += `<span class="badge badge-warning">Low Stock</span>`;
            } else {
                badgeHtml += `<span class="badge badge-success">In Stock</span>`;
            }

            const card = document.createElement('div');
            card.className = 'inventory-item-card';

            // Click to view details
            card.onclick = (e) => {
                // Ignore if clicked on delete button
                if (e.target.closest('.btn-icon-danger')) return;
                openDrugDetails(item.drugName);
            };

            card.innerHTML = `
                <div class="item-icon-wrapper">
                    <span>💊</span>
                </div>
                <div class="item-info">
                    <h4>${item.drugName}</h4>
                    <div class="item-meta">
                        <span>Batch: ${item.batchNumber}</span>
                        <span class="meta-separator"></span>
                        <span>Exp: ${expiryDate.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="item-actions">
                    ${badgeHtml}
                    <span style="color:var(--text-muted); font-size:14px;">Qty: ${item.quantity}</span>
                </div>
                <button class="btn-icon-danger" onclick="deleteItem(${item.id})" title="Delete Item">
                    <span style="font-size:16px;">🗑️</span>
                </button>
            `;
            inventoryList.appendChild(card);
        });
    }

    function updateStats(items) {
        if (totalInventoryCount) totalInventoryCount.textContent = items.length;

        // Calculate expiring soon (next 30 days) or expired
        if (expiringCount) {
            const today = new Date();
            const next30Days = new Date();
            next30Days.setDate(today.getDate() + 30);

            const count = items.filter(item => {
                const exp = new Date(item.expiryDate);
                return exp <= next30Days;
            }).length;

            expiringCount.textContent = count;
        }
    }

    // Modal Management
    const openAddModal = () => addInventoryModal.classList.add('active');
    const closeAddModalAction = () => {
        addInventoryModal.classList.remove('active');
        addInventoryForm.reset();
    };
    const closeDetailsModalAction = () => drugDetailsModal.classList.remove('active');

    if (addInventoryBtn) addInventoryBtn.addEventListener('click', openAddModal);
    if (closeAddModal) closeAddModal.addEventListener('click', closeAddModalAction);
    if (cancelAdd) cancelAdd.addEventListener('click', closeAddModalAction);
    if (closeDetailsModal) closeDetailsModal.addEventListener('click', closeDetailsModalAction);

    // Close on click outside
    window.onclick = (event) => {
        if (event.target === addInventoryModal) closeAddModalAction();
        if (event.target === drugDetailsModal) closeDetailsModalAction();
    };

    // Add Inventory Submit
    if (addInventoryForm) {
        addInventoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(addInventoryForm);

            // Basic validation
            const qty = parseInt(formData.get('quantity'));
            if (qty < 0) {
                alert("Quantity cannot be negative");
                return;
            }

            const data = {
                pharmacistId: userData.id,
                drugName: formData.get('drugName'),
                batchNumber: formData.get('batchNumber'),
                expiryDate: formData.get('expiryDate'),
                quantity: qty
            };

            try {
                const response = await fetch('http://localhost:5000/api/inventory', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    closeAddModalAction();
                    loadInventory();
                } else {
                    const err = await response.json();
                    alert(err.error || 'Failed to add item');
                }
            } catch (error) {
                console.error(error);
                alert("Network error");
            }
        });
    }

    // OpenFDA API Integration
    async function openDrugDetails(drugName) {
        drugDetailsModal.classList.add('active');
        detailsDrugName.textContent = drugName;
        drugDetailsContent.innerHTML = '<div class="drug-details-loading">Loading drug information from openFDA...</div>';

        try {
            // Use openFDA API
            const response = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.brand_name:"${encodeURIComponent(drugName)}"&limit=1`);

            if (!response.ok) {
                // Try generic name search if brand name fails
                const responseGeneric = await fetch(`https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${encodeURIComponent(drugName)}"&limit=1`);
                if (!responseGeneric.ok) throw new Error('Drug not found in FDA database');
                const data = await responseGeneric.json();
                renderDrugDetails(data.results[0]);
                return;
            }

            const data = await response.json();
            renderDrugDetails(data.results[0]);
        } catch (error) {
            console.error(error);
            drugDetailsContent.innerHTML = `
                <div style="text-align:center; padding:20px; color:var(--text-muted)">
                    <p>Could not fetch detailed information for "${drugName}".</p>
                    <p style="font-size:12px; margin-top:10px;">(It might not be in the openFDA database or check spelling)</p>
                </div>
            `;
        }
    }

    function renderDrugDetails(details) {
        // Extract relevant fields (fields vary by drug, handle gracefully)
        const brandName = details.openfda?.brand_name ? details.openfda.brand_name.join(', ') : 'N/A';
        const genericName = details.openfda?.generic_name ? details.openfda.generic_name.join(', ') : 'N/A';
        const description = details.description ? details.description[0] : 'No description available.';
        const indications = details.indications_and_usage ? details.indications_and_usage[0] : 'No indications available.';
        const warnings = details.warnings ? details.warnings[0] : 'No specific warnings.';
        const dosage = details.dosage_and_administration ? details.dosage_and_administration[0] : 'No dosage info.';

        drugDetailsContent.innerHTML = `
            <div class="drug-details-section">
                <h3>Composition / Generic Name</h3>
                <p><strong>Brand:</strong> ${brandName}</p>
                <p><strong>Generic:</strong> ${genericName}</p>
            </div>
             <div class="drug-details-section">
                <h3>Indications & Usage</h3>
                <p>${indications.substring(0, 500)}${indications.length > 500 ? '...' : ''}</p>
            </div>
            <div class="drug-details-section">
                <h3>Warnings</h3>
                <p>${warnings.substring(0, 500)}${warnings.length > 500 ? '...' : ''}</p>
            </div>
             <div class="drug-details-section">
                <h3>Dosage</h3>
                <p>${dosage.substring(0, 500)}${dosage.length > 500 ? '...' : ''}</p>
            </div>
            <div class="drug-details-section">
                <p style="font-size:11px; color:var(--text-muted); margin-top:20px;">Source: openFDA (Public Data)</p>
            </div>
        `;
    }

    // Search filter
    if (inventorySearch) {
        inventorySearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.inventory-item-card');

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(term)) {
                    card.style.display = 'grid'; // Maintain grid layout
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Global delete
    window.deleteItem = async (id) => {
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
            await fetch(`http://localhost:5000/api/inventory/${id}`, { method: 'DELETE' });
            loadInventory();
        } catch (e) {
            console.error(e);
            alert("Failed to delete item");
        }
    };

    // Orders Logic
    const ordersList = document.getElementById('ordersList');
    const pendingOrdersCount = document.getElementById('pendingOrdersCount');

    async function loadOrders() {
        if (!ordersList) return;

        try {
            // Fetch only 'Active' prescriptions
            const response = await fetch('http://localhost:5000/api/prescriptions?status=Active');
            if (!response.ok) throw new Error('Failed to fetch orders');

            const orders = await response.json();
            renderOrders(orders);
            updateOrderStats(orders);
        } catch (error) {
            console.error(error);
            ordersList.innerHTML = '<p style="color:red; text-align:center;">Error loading orders.</p>';
        }
    }

    function renderOrders(orders) {
        if (!ordersList) return;
        ordersList.innerHTML = '';

        if (orders.length === 0) {
            ordersList.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding: 20px;">No active orders linked yet.</p>';
            return;
        }

        orders.forEach(order => {
            const date = new Date(order.createdAt).toLocaleDateString();
            const card = document.createElement('div');
            card.className = 'order-card';
            // Simple inline style for the card structure for now, matching the card aesthetic
            card.style.cssText = `
                background: var(--bg-secondary);
                padding: 15px;
                border-radius: 12px;
                margin-bottom: 15px;
                display: grid;
                grid-template-columns: 1fr 1fr auto;
                gap: 10px;
                align-items: center;
                border: 1px solid var(--border-color);
            `;

            card.innerHTML = `
                <div class="order-info">
                    <h4 style="margin:0 0 5px 0;">${order.medicineName}</h4>
                    <p style="font-size:0.9rem; color:var(--text-muted); margin:0;">${order.doseFrequency}</p>
                    <p style="font-size:0.8rem; margin:5px 0 0 0;">Patient: <strong>${order.patientName}</strong></p>
                </div>
                <div class="doctor-info">
                    <p style="font-size:0.8rem; margin:0;">Prescribed by:</p>
                    <p style="font-weight:500; margin:0;">Dr. ${order.doctorName}</p>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin:5px 0 0 0;">${date}</p>
                </div>
                <div class="order-status">
                   <button class="btn-primary btn-small" onclick="dispenseOrder(${order.id})" style="background-color: #10b981; border: none;">Sell</button>
                </div>
            `;
            ordersList.appendChild(card);
        });
    }

    // Dispense Order
    window.dispenseOrder = async (orderId) => {
        if (!confirm('Are you sure you want to dispense this order? Stock will be reduced.')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/prescriptions/${orderId}/dispense`, {
                method: 'POST'
            });

            const result = await response.json();

            if (response.ok) {
                alert(`Sale successful! Remaining stock: ${result.remainingStock}`);
                loadOrders(); // Reload orders to remove the dispensed one or update status
                loadInventory(); // Refresh inventory view
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to process sale.');
        }
    };

    function updateOrderStats(orders) {
        if (pendingOrdersCount) pendingOrdersCount.textContent = orders.length;
    }

    // Hook into navigation to load orders when tab is shown
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.dataset.page === 'orders') {
                loadOrders();
            }
        });
    });

    // Initial load if starting on orders page (unlikely but good practice)
    if (document.getElementById('orders').classList.contains('active')) {
        loadOrders();
    }

    // Also load stats initially
    loadOrders();

});
