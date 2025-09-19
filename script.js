// Construction Material Request System - JavaScript

// Demo users data with updated workflow roles
const users = {
    'employee1': { displayName: 'John Smith', role: 'employee', position: 'Site Worker', password: '123', signature: '' },
    'warehouse1': { displayName: 'Mike Johnson', role: 'warehouse', position: 'Warehouse Manager', password: '123', signature: '' },
    'department1': { displayName: 'Sarah Wilson', role: 'department', position: 'Department Manager', password: '123', signature: '' },
    'construction1': { displayName: 'David Brown', role: 'construction', position: 'Construction Manager', password: '123', signature: '' },
    'administrative1': { displayName: 'Lisa Davis', role: 'administrative', position: 'Administrative Manager', password: '123', signature: '' },
    'project_manager1': { displayName: 'Robert Garcia', role: 'project_manager', position: 'Project Manager', password: '123', signature: '' },
    'project_director1': { displayName: 'Jennifer Martinez', role: 'project_director', position: 'Project Director', password: '123', signature: '' },
    'procurement1': { displayName: 'Michael Anderson', role: 'procurement', position: 'Procurement Manager', password: '123', signature: '' }
};

let currentUser = null;

// Initialize system
function initializeSystem() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(users));
    }
    if (!localStorage.getItem('requests')) {
        localStorage.setItem('requests', JSON.stringify([]));
    }
}

// Fill login form with demo user data
function fillLogin(username, password, role) {
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    document.getElementById('role').value = role;
}

// Login function
function login(username, password, role) {
    const users = JSON.parse(localStorage.getItem('users'));
    if (users[username] && users[username].password === password && users[username].role === role) {
        currentUser = {
            username: username,
            displayName: users[username].displayName,
            role: users[username].role,
            position: users[username].position,
            signature: users[username].signature || '',
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainInterface();
        return true;
    }
    return false;
}

// Logout function
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    showPage('loginPage');
    document.getElementById('navbar').classList.add('d-none');
}

// Show main interface after login
function showMainInterface() {
    document.getElementById('navbar').classList.remove('d-none');
    document.getElementById('userName').textContent = currentUser.displayName;
    document.getElementById('userAvatar').textContent = currentUser.displayName.charAt(0).toUpperCase();
    
    // Show/hide navigation items based on role
    if (currentUser.role === 'employee') {
        document.getElementById('navRequestForm').classList.remove('d-none');
    } else {
        document.getElementById('navRequestForm').classList.add('d-none');
    }
    
    loadProfile();
    showPage('dashboardPage');
    updateDashboard();
}

// Show specific page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
    
    // Update navigation active state
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
    });
    
    // Update content based on page
    switch(pageId) {
        case 'dashboardPage':
            document.getElementById('navDashboard').classList.add('active');
            updateDashboard();
            break;
        case 'myTasksPage':
            document.getElementById('navMyTasks').classList.add('active');
            loadMyTasks();
            break;
        case 'statusPage':
            document.getElementById('navStatus').classList.add('active');
            loadAllRequests();
            break;
        case 'aboutPage':
            document.getElementById('navAbout').classList.add('active');
            break;
        case 'profilePage':
            document.getElementById('navProfile').classList.add('active');
            loadProfile();
            break;
        case 'requestFormPage':
            document.getElementById('navRequestForm').classList.add('active');
            break;
    }
}

// Get requests from localStorage
function getRequests() {
    const requests = localStorage.getItem('requests');
    return requests ? JSON.parse(requests) : [];
}

// Save request to localStorage
function saveRequest(request) {
    const requests = getRequests();
    const existingIndex = requests.findIndex(r => r.id === request.id);
    
    if (existingIndex >= 0) {
        requests[existingIndex] = request;
    } else {
        requests.push(request);
    }
    
    localStorage.setItem('requests', JSON.stringify(requests));
}

// Update dashboard statistics
function updateDashboard() {
    const requests = getRequests();
    let stats = { total: 0, pending: 0, completed: 0, rejected: 0 };
    
    if (currentUser.role === 'employee') {
        const myRequests = requests.filter(r => r.requester === currentUser.username);
        stats.total = myRequests.length;
        stats.pending = myRequests.filter(r => r.currentStep !== null && !r.status.includes('Completed') && !r.status.includes('Rejected')).length;
        stats.completed = myRequests.filter(r => r.status.includes('Completed')).length;
        stats.rejected = myRequests.filter(r => r.status.includes('Rejected')).length;
    } else {
        stats.total = requests.length;
        stats.pending = requests.filter(r => r.currentStep === currentUser.role || (currentUser.role === 'warehouse' && r.currentStep === 'warehouse_receive')).length;
        stats.completed = requests.filter(r => r.status.includes('Completed')).length;
        stats.rejected = requests.filter(r => r.status.includes('Rejected')).length;
    }
    
    document.getElementById('totalRequests').textContent = stats.total;
    document.getElementById('pendingRequests').textContent = stats.pending;
    document.getElementById('completedRequests').textContent = stats.completed;
    document.getElementById('rejectedRequests').textContent = stats.rejected;
    
    updateRecentRequestsTable();
}

// Update recent requests table
function updateRecentRequestsTable() {
    const requests = getRequests();
    const recentRequests = requests.slice(-10).reverse();
    const tableBody = document.getElementById('recentRequestsTable');
    
    if (recentRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No requests found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = recentRequests.map(request => `
        <tr>
            <td><strong>${request.id}</strong></td>
            <td>${request.requesterName}</td>
            <td>${formatDate(request.requestDate)}</td>
            <td><span class="badge ${getStatusBadge(request.status)}">${request.status}</span></td>
            <td><button class="btn btn-sm btn-secondary" onclick="viewRequest('${request.id}')">View</button></td>
        </tr>
    `).join('');
}

// Add new item to request form
function addItem() {
    const tableBody = document.getElementById('itemsTableBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="text" class="form-input" name="brand" placeholder="Brand name" required></td>
        <td><input type="text" class="form-input" name="item" placeholder="Item name" required></td>
        <td><input type="text" class="form-input" name="unit" placeholder="Unit" required></td>
        <td><input type="number" class="form-input" name="qty" placeholder="Quantity" required></td>
        <td><input type="date" class="form-input" name="requirementDate" required></td>
        <td><input type="text" class="form-input" name="placeOfUse" placeholder="Place of use" required></td>
        <td><button type="button" class="remove-item-btn" onclick="removeItem(this)">Remove</button></td>
    `;
    tableBody.appendChild(newRow);
}

// Remove item from request form
function removeItem(button) {
    const row = button.closest('tr');
    const tableBody = document.getElementById('itemsTableBody');
    if (tableBody.children.length > 1) {
        row.remove();
    } else {
        alert('Request must contain at least one item');
    }
}

// Create new request - Updated workflow according to the new diagram
function createRequest(items) {
    const req = {
        id: 'MR-' + Date.now(),
        ref: '',
        requester: currentUser.username,
        requesterName: currentUser.displayName,
        requestDate: new Date().toISOString(),
        items: items,
        status: 'Pending at Warehouse Manager',
        currentStep: 'warehouse',
        flow: {
            warehouseChecked: null,
            approvals: [],
            purchasedBy: null,
            receivedBy: null,
            notifiedEmployee: false,
            employeeReceived: false,
            warehouseFinished: false
        }
    };
    
    saveRequest(req);
    return req.id;
}

// Load my tasks
function loadMyTasks() {
    const requests = getRequests();
    let myTasks = [];
    
    if (currentUser.role === 'employee') {
        myTasks = requests.filter(r => 
            (r.currentStep === 'employee' && r.requester === currentUser.username) ||
            (r.flow.notifiedEmployee && !r.flow.employeeReceived && r.requester === currentUser.username)
        );
    } else {
        myTasks = requests.filter(r => r.currentStep === currentUser.role || 
            (currentUser.role === 'warehouse' && r.currentStep === 'warehouse_receive'));
    }
    
    const container = document.getElementById('tasksContainer');
    
    if (myTasks.length === 0) {
        container.innerHTML = '<p class="text-center">No tasks available</p>';
        return;
    }
    
    container.innerHTML = myTasks.map(task => `
        <div class="card mb-2">
            <h4>Request ID: ${task.id}</h4>
            <p><strong>Requester:</strong> ${task.requesterName}</p>
            <p><strong>Date:</strong> ${formatDate(task.requestDate)}</p>
            <p><strong>Status:</strong> <span class="badge ${getStatusBadge(task.status)}">${task.status}</span></p>
            <p><strong>Items Count:</strong> ${task.items.length}</p>
            ${task.ref ? `<p><strong>Reference Number:</strong> ${task.ref}</p>` : ''}
            <button class="btn btn-primary btn-sm" onclick="viewRequest('${task.id}')">View Details & Take Action</button>
        </div>
    `).join('');
}

// Load all requests for status page
function loadAllRequests() {
    const requests = getRequests();
    const tableBody = document.getElementById('statusTable');
    
    if (requests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No requests found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = requests.map(request => `
        <tr>
            <td><strong>${request.id}</strong></td>
            <td>${request.requesterName}</td>
            <td>${formatDate(request.requestDate)}</td>
            <td><span class="badge ${getStatusBadge(request.status)}">${request.status}</span></td>
            <td>${getCurrentStepName(request.currentStep)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewRequest('${request.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

// Load profile information
function loadProfile() {
    document.getElementById('profileName').value = currentUser.displayName;
    document.getElementById('profilePosition').value = currentUser.position;
    document.getElementById('profileRole').value = getRoleDisplayName(currentUser.role);
    
    if (currentUser.signature) {
        document.getElementById('currentSignature').classList.remove('d-none');
        document.getElementById('signaturePreview').src = currentUser.signature;
    }
}

// Upload signature
function uploadSignature(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentUser.signature = e.target.result;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            // Update user data in database
            const users = JSON.parse(localStorage.getItem('users'));
            users[currentUser.username].signature = e.target.result;
            localStorage.setItem('users', JSON.stringify(users));
            
            document.getElementById('currentSignature').classList.remove('d-none');
            document.getElementById('signaturePreview').src = e.target.result;
            
            alert('Signature uploaded successfully');
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// View request details
function viewRequest(requestId) {
    const request = getRequests().find(r => r.id === requestId);
    if (!request) return;
    
    const modal = document.getElementById('requestModal');
    const details = document.getElementById('requestDetails');
    
    let html = `
        <div class="mb-2">
            <h4>Request Information</h4>
            <p><strong>Request ID:</strong> ${request.id}</p>
            <p><strong>Requester:</strong> ${request.requesterName}</p>
            <p><strong>Date:</strong> ${formatDate(request.requestDate)}</p>
            <p><strong>Status:</strong> <span class="badge ${getStatusBadge(request.status)}">${request.status}</span></p>
            ${request.ref ? `<p><strong>Reference Number:</strong> ${request.ref}</p>` : ''}
        </div>
        
        <div class="mb-2">
            <h4>Required Items</h4>
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Brand</th>
                            <th>Item</th>
                            <th>Unit</th>
                            <th>Quantity</th>
                            <th>Required Date</th>
                            <th>Place of Use</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${request.items.map(item => `
                            <tr>
                                <td>${item.brand}</td>
                                <td>${item.item}</td>
                                <td>${item.unit}</td>
                                <td>${item.qty}</td>
                                <td>${item.requirementDate}</td>
                                <td>${item.placeOfUse}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Add workflow history
    if (request.flow.warehouseChecked || request.flow.approvals.length > 0 || request.flow.purchasedBy || request.flow.receivedBy) {
        html += `<div class="mb-2">
            <h4>Workflow History</h4>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px;">
        `;
        
        if (request.flow.warehouseChecked) {
            html += `<p class="text-success">✓ Warehouse Check: ${request.flow.warehouseChecked.inStock ? 'In Stock' : 'Not Available'} - ${formatDate(request.flow.warehouseChecked.date)}</p>`;
        }
        
        request.flow.approvals.forEach(approval => {
            const icon = approval.decision === 'agree' ? '✓' : approval.decision === 'reject' ? '✗' : '⚠';
            const color = approval.decision === 'agree' ? 'text-success' : approval.decision === 'reject' ? 'text-danger' : 'text-warning';
            html += `<p class="${color}">${icon} ${getRoleDisplayName(approval.role)}: ${getDecisionText(approval.decision)} - ${formatDate(approval.date)}</p>`;
            if (approval.note) {
                html += `<p style="margin-left: 20px; font-style: italic; color: #666;">Note: ${approval.note}</p>`;
            }
        });
        
        if (request.flow.purchasedBy) {
            html += `<p class="text-success">✓ Purchased - ${formatDate(request.flow.purchasedBy.date)}</p>`;
        }
        
        if (request.flow.receivedBy) {
            html += `<p class="text-success">✓ Received at Warehouse - ${formatDate(request.flow.receivedBy.date)}</p>`;
        }
        
        if (request.flow.notifiedEmployee) {
            html += `<p class="text-info">📧 Employee Notified - Materials ready for pickup</p>`;
        }
        
        if (request.flow.employeeReceived) {
            html += `<p class="text-success">✓ Received by Employee</p>`;
        }
        
        if (request.flow.warehouseFinished) {
            html += `<p class="text-success">✅ Process Completed</p>`;
        }
        
        html += `</div></div>`;
    }
    
    // Add action buttons based on role and current step
    html += getActionButtons(request);
    
    details.innerHTML = html;
    modal.style.display = 'block';
}

// Get action buttons based on current user role and request status
function getActionButtons(request) {
    let buttons = '';
    
    if (currentUser.role === 'warehouse' && request.currentStep === 'warehouse') {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>Warehouse Actions</h4>
                <div class="form-group">
                    <label class="form-label">Reference Number (Optional)</label>
                    <input type="text" id="refNumber" class="form-input" placeholder="Enter reference number">
                </div>
                <button class="btn btn-success" onclick="warehouseAction('${request.id}', true)">In Stock - Complete Request</button>
                <button class="btn btn-warning" onclick="warehouseAction('${request.id}', false)">Not Available - Send for Approval</button>
            </div>
        `;
    } else if (['department', 'construction', 'administrative', 'project_manager', 'project_director'].includes(currentUser.role) && request.currentStep === currentUser.role) {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>${getRoleDisplayName(currentUser.role)} Decision</h4>
                <div class="form-group">
                    <label class="form-label">Notes (Optional)</label>
                    <textarea id="managerNote" class="form-textarea" placeholder="Add your comments here"></textarea>
                </div>
                ${currentUser.signature ? '' : '<p class="text-warning">⚠ Please upload your signature in Profile first</p>'}
                <button class="btn btn-success" onclick="managerDecision('${request.id}', 'agree')" ${!currentUser.signature ? 'disabled' : ''}>Approve & Sign</button>
                <button class="btn btn-warning" onclick="managerDecision('${request.id}', 'revise')">Request Revision</button>
                <button class="btn btn-danger" onclick="managerDecision('${request.id}', 'reject')">Reject Request</button>
            </div>
        `;
    } else if (currentUser.role === 'procurement' && request.currentStep === 'procurement') {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>Procurement Actions</h4>
                ${currentUser.signature ? '' : '<p class="text-warning">⚠ Please upload your signature in Profile first</p>'}
                <button class="btn btn-success" onclick="markPurchased('${request.id}')" ${!currentUser.signature ? 'disabled' : ''}>Mark as Purchased</button>
            </div>
        `;
    } else if (currentUser.role === 'warehouse' && request.currentStep === 'warehouse_receive') {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>Warehouse Receive</h4>
                <p>Confirm receipt of purchased materials</p>
                <button class="btn btn-success" onclick="warehouseReceive('${request.id}')">Confirm Receipt & Notify Employee</button>
            </div>
        `;
    } else if (currentUser.role === 'employee' && request.flow.notifiedEmployee && !request.flow.employeeReceived && request.requester === currentUser.username) {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>Employee Action Required</h4>
                <p class="text-info">Your materials are ready for pickup at the warehouse.</p>
                <button class="btn btn-success" onclick="employeeReceive('${request.id}')">Confirm Receipt of Materials</button>
            </div>
        `;
    } else if (currentUser.role === 'warehouse' && request.flow.employeeReceived && !request.flow.warehouseFinished) {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>Final Warehouse Action</h4>
                <p class="text-info">Employee has confirmed receipt. Mark process as finished.</p>
                <button class="btn btn-success" onclick="warehouseFinish('${request.id}')">Mark Process as Finished</button>
            </div>
        `;
    } else if (currentUser.role === 'employee' && request.currentStep === 'employee' && request.requester === currentUser.username) {
        buttons = `
            <div class="mt-2" style="border-top: 2px solid #f0f0f0; padding-top: 1rem;">
                <h4>Revision Required</h4>
                <p class="text-warning">This request needs revision. Please update the details and resubmit.</p>
                <p><strong>Manager's Note:</strong></p>
                <div style="background: #fff3cd; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                    ${request.flow.approvals.filter(a => a.decision === 'revise').map(a => a.note || 'No notes provided').join('<br>')}
                </div>
                <button class="btn btn-primary" onclick="alert('Revision feature will be available soon')">Revise Request</button>
            </div>
        `;
    }
    
    return buttons;
}

// Updated warehouse action according to new workflow
function warehouseAction(requestId, inStock) {
    const refNumber = document.getElementById('refNumber').value.trim();
    const request = getRequests().find(r => r.id === requestId);
    
    request.flow.warehouseChecked = {
        inStock: inStock,
        refNumber: refNumber,
        by: currentUser.username,
        date: new Date().toISOString()
    };
    
    if (refNumber) {
        request.ref = refNumber;
    }
    
    if (inStock) {
        request.status = 'Completed - In Stock';
        request.currentStep = null;
        request.flow.notifiedEmployee = true;
    } else {
        request.status = 'Pending at Department Manager';
        request.currentStep = 'department';
    }
    
    saveRequest(request);
    closeModal('requestModal');
    loadMyTasks();
    updateDashboard();
    alert(inStock ? 'Materials confirmed in stock and employee notified' : 'Request sent for management approval');
}

// Updated manager decision according to new workflow
function managerDecision(requestId, decision) {
    if (decision === 'agree' && !currentUser.signature) {
        alert('Please upload your signature in Profile first');
        return;
    }
    
    const note = document.getElementById('managerNote').value.trim();
    const request = getRequests().find(r => r.id === requestId);
    
    const approval = {
        role: currentUser.role,
        by: currentUser.username,
        decision: decision,
        note: note,
        date: new Date().toISOString(),
        signature: decision === 'agree' ? currentUser.signature : ''
    };
    
    request.flow.approvals.push(approval);
    
    if (decision === 'reject') {
        request.status = 'Rejected by ' + getRoleDisplayName(currentUser.role);
        request.currentStep = null;
    } else if (decision === 'revise') {
        request.status = 'Revision Requested by ' + getRoleDisplayName(currentUser.role);
        request.currentStep = 'employee';
    } else { // agree
        // Updated workflow sequence
        const nextSteps = {
            'department': { step: 'construction', status: 'Pending at Construction Manager' },
            'construction': { step: 'administrative', status: 'Pending at Administrative Manager' },
            'administrative': { step: 'project_manager', status: 'Pending at Project Manager' },
            'project_manager': { step: 'project_director', status: 'Pending at Project Director' },
            'project_director': { step: 'procurement', status: 'Pending at Procurement Manager' }
        };
        
        const next = nextSteps[currentUser.role];
        if (next) {
            request.currentStep = next.step;
            request.status = next.status;
        }
    }
    
    saveRequest(request);
    closeModal('requestModal');
    loadMyTasks();
    updateDashboard();
    
    const message = decision === 'agree' ? 'Request approved successfully' : 
                   decision === 'reject' ? 'Request rejected' : 
                   'Revision requested from employee';
    alert(message);
}

// Mark as purchased
function markPurchased(requestId) {
    if (!currentUser.signature) {
        alert('Please upload your signature in Profile first');
        return;
    }
    
    const request = getRequests().find(r => r.id === requestId);
    
    request.flow.purchasedBy = {
        by: currentUser.username,
        date: new Date().toISOString(),
        signature: currentUser.signature
    };
    
    request.status = 'Purchased - Waiting for Warehouse Receipt';
    request.currentStep = 'warehouse_receive';
    
    saveRequest(request);
    closeModal('requestModal');
    loadMyTasks();
    updateDashboard();
    alert('Purchase completed successfully');
}

// Warehouse receive materials
function warehouseReceive(requestId) {
    const request = getRequests().find(r => r.id === requestId);
    
    request.flow.receivedBy = {
        by: currentUser.username,
        date: new Date().toISOString()
    };
    
    request.status = 'Materials Ready for Employee Pickup';
    request.currentStep = null;
    request.flow.notifiedEmployee = true;
    
    saveRequest(request);
    closeModal('requestModal');
    loadMyTasks();
    updateDashboard();
    alert('Materials received and employee notified for pickup');
}

// Employee confirms receipt of materials
function employeeReceive(requestId) {
    const request = getRequests().find(r => r.id === requestId);
    
    request.flow.employeeReceived = true;
    request.status = 'Received by Employee - Waiting for Final Confirmation';
    
    saveRequest(request);
    closeModal('requestModal');
    loadMyTasks();
    updateDashboard();
    alert('Receipt confirmed. Warehouse will finalize the process.');
}

// Warehouse marks process as finished
function warehouseFinish(requestId) {
    const request = getRequests().find(r => r.id === requestId);
    
    request.flow.warehouseFinished = true;
    request.status = 'Completed - Process Finished';
    request.currentStep = null;
    
    saveRequest(request);
    closeModal('requestModal');
    loadMyTasks();
    updateDashboard();
    alert('Process completed successfully');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Filter requests in status page
function filterRequests() {
    const filter = document.getElementById('statusFilter').value;
    const requests = getRequests();
    let filteredRequests = requests;
    
    if (filter !== 'all') {
        switch(filter) {
            case 'pending':
                filteredRequests = requests.filter(r => r.currentStep !== null && !r.status.includes('Completed') && !r.status.includes('Rejected'));
                break;
            case 'approved':
                filteredRequests = requests.filter(r => r.flow.approvals.some(a => a.decision === 'agree'));
                break;
            case 'rejected':
                filteredRequests = requests.filter(r => r.status.includes('Rejected'));
                break;
            case 'completed':
                filteredRequests = requests.filter(r => r.status.includes('Completed'));
                break;
        }
    }
    
    const tableBody = document.getElementById('statusTable');
    
    if (filteredRequests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No requests found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = filteredRequests.map(request => `
        <tr>
            <td><strong>${request.id}</strong></td>
            <td>${request.requesterName}</td>
            <td>${formatDate(request.requestDate)}</td>
            <td><span class="badge ${getStatusBadge(request.status)}">${request.status}</span></td>
            <td>${getCurrentStepName(request.currentStep)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewRequest('${request.id}')">View</button>
            </td>
        </tr>
    `).join('');
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getRoleDisplayName(role) {
    const roleNames = {
        'employee': 'Employee',
        'warehouse': 'Warehouse Manager',
        'department': 'Department Manager',
        'construction': 'Construction Manager',
        'administrative': 'Administrative Manager',
        'project_manager': 'Project Manager',
        'project_director': 'Project Director',
        'procurement': 'Procurement Manager'
    };
    return roleNames[role] || role;
}

function getCurrentStepName(step) {
    if (!step) return 'Completed';
    const stepNames = {
        'warehouse': 'Warehouse Manager',
        'department': 'Department Manager',
        'construction': 'Construction Manager',
        'administrative': 'Administrative Manager',
        'project_manager': 'Project Manager',
        'project_director': 'Project Director',
        'procurement': 'Procurement Manager',
        'warehouse_receive': 'Warehouse Receipt',
        'employee': 'Employee (Revision)'
    };
    return stepNames[step] || step;
}

function getStatusBadge(status) {
    if (status.includes('Completed')) {
        return 'badge-completed';
    } else if (status.includes('Rejected')) {
        return 'badge-rejected';
    } else if (status.includes('Revision') || status.includes('Ready')) {
        return 'badge-pending';
    } else if (status.includes('Pending')) {
        return 'badge-pending';
    } else if (status.includes('In Stock')) {
        return 'badge-in-stock';
    } else {
        return 'badge-approved';
    }
}

function getDecisionText(decision) {
    const decisions = {
        'agree': 'Approved',
        'reject': 'Rejected',
        'revise': 'Revision Requested'
    };
    return decisions[decision] || decision;
}

// Event Listeners
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    if (login(username, password, role)) {
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        document.getElementById('role').value = '';
    } else {
        alert('Invalid login credentials!');
    }
});

document.getElementById('newRequestForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const rows = document.querySelectorAll('#itemsTableBody tr');
    const items = [];
    
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs.length >= 6) {
            const item = {
                brand: inputs[0].value.trim(),
                item: inputs[1].value.trim(),
                unit: inputs[2].value.trim(),
                qty: parseInt(inputs[3].value) || 0,
                requirementDate: inputs[4].value,
                placeOfUse: inputs[5].value.trim()
            };
            if (item.brand && item.item && item.unit && item.qty && item.requirementDate && item.placeOfUse) {
                items.push(item);
            }
        }
    });
    
    if (items.length === 0) {
        alert('Please add at least one item with all required fields filled');
        return;
    }
    
    const requestId = createRequest(items);
    alert('Request created successfully!\nRequest ID: ' + requestId);
    
    // Reset form
    document.getElementById('newRequestForm').reset();
    const tableBody = document.getElementById('itemsTableBody');
    tableBody.innerHTML = `
        <tr>
            <td><input type="text" class="form-input" name="brand" placeholder="Brand name" required></td>
            <td><input type="text" class="form-input" name="item" placeholder="Item name" required></td>
            <td><input type="text" class="form-input" name="unit" placeholder="Unit" required></td>
            <td><input type="number" class="form-input" name="qty" placeholder="Quantity" required></td>
            <td><input type="date" class="form-input" name="requirementDate" required></td>
            <td><input type="text" class="form-input" name="placeOfUse" placeholder="Place of use" required></td>
            <td><button type="button" class="remove-item-btn" onclick="removeItem(this)">Remove</button></td>
        </tr>
    `;
    
    showPage('dashboardPage');
});

// Close modals when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Initialize system on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeSystem();
    
    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainInterface();
    }
});