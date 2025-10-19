// Dashboard JavaScript

let currentUser = null;
let transactions = [];
let budgets = [];
// Filter state
let currentFilters = {
    category: '',
    type: '',
    amountMin: null,
    amountMax: null,
    dateFrom: null,
    dateTo: null
};

// Make data globally accessible
window.transactions = transactions;
window.budgets = budgets;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard page loaded');
    
    // FIRST: Check if user is authenticated
    if (!protectPage()) {
        return; // Stop if not authenticated
    }
    
    // SECOND: Initialize user session
    initDashboard();
    
    // THIRD: Set up event listeners
    setupEventListeners();
    
    // FOURTH: Load data from backend
    loadDashboardData();
    
    console.log('✅ Dashboard initialization complete');
});

function protectPage() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('🛡️ Page protection check:', {
        hasToken: !!token,
        hasUser: !!user
    });
    
    if (!token || !user) {
        console.warn('⚠️ No authentication found - redirecting to login');
        window.location.href = 'index.html';
        return false;
    }
    
    try {
        // Verify user data is valid JSON
        JSON.parse(user);
        console.log('✅ User is authenticated');
        return true;
    } catch (error) {
        console.error('❌ Invalid user data in storage:', error);
        handleLogout();
        return false;
    }
}

function initDashboard() {
    const session = getUserSession();
    if (session) {
        currentUser = session.user;
        updateUserInfo();
    }
}

function updateUserInfo() {
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');
    const userInitials = document.getElementById('userInitials');
    
    if (currentUser) {
        if (userName) userName.textContent = currentUser.name;
        if (userEmail) userEmail.textContent = currentUser.email || currentUser.phone;
        if (userInitials) {
            const initials = currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            userInitials.textContent = initials;
        }
    }
}


function setupEventListeners() {
    // Sidebar Toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', () => openModal('filterModal'));
    }
    
    // Mobile Menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }
    
    // Navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const page = item.dataset.page;
            navigateTo(page);
        });
    });
    
    // User Menu
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn) {
        userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && !e.target.closest('.user-menu')) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutDropdown = document.getElementById('logoutDropdown');
    [logoutBtn, logoutDropdown].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', handleLogout);
        }
    });
    
    // Pro Upgrade
    const proUpgrade = document.getElementById('proUpgrade');
    const upgradeProBtn = document.getElementById('upgradeProBtn');
    [proUpgrade, upgradeProBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => openModal('proModal'));
        }
    });
    
    // Add Transaction Buttons
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    const addTransactionBtn = document.getElementById('addTransactionBtn');
    
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => openTransactionModal('expense'));
    }
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', () => openTransactionModal('income'));
    }
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => openTransactionModal('expense'));
    }
    
    // Transaction Form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        // Form tabs
        transactionForm.querySelectorAll('.form-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                transactionForm.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        transactionForm.addEventListener('submit', handleAddTransaction);
    }
    
    // Budget Buttons
    const addBudgetBtn = document.getElementById('addBudgetBtn');
    if (addBudgetBtn) {
        addBudgetBtn.addEventListener('click', showAddBudgetModal);
    }
    
    // Budget Form Submission
    const budgetForm = document.getElementById('budgetForm');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleAddBudget);
    }
    
    // Export Report Button
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', handleExportReport);
    }
    
    // Add Category Button
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', showAddCategoryModal);
    }
}

// Add this function to verify token persistence
function checkTokenPersistence() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Token check:', {
        hasToken: !!token,
        hasUser: !!user,
        tokenLength: token ? token.length : 0,
        timestamp: new Date().toISOString()
    });
    
    if (!token) {
        console.error('NO TOKEN FOUND - User will be logged out');
        // Force re-login if no token
        handleLogout();
        return false;
    }
    
    return true;
}

// Call this periodically
setInterval(checkTokenPersistence, 30000); // Check every 30 seconds

function navigateTo(page) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const targetNav = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (targetNav) targetNav.classList.add('active');
    
    // Update content
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    const targetPage = document.querySelector(`.page-content[data-page="${page}"]`);
    if (targetPage) targetPage.classList.add('active');
    
    // Update page title
    const pageTitle = document.querySelector('.page-title');
    const titles = {
        overview: 'Dashboard Overview',
        transactions: 'All Transactions',
        budgets: 'Budget Management',
        reports: 'Financial Reports',
        categories: 'Manage Categories'
    };
    if (pageTitle) pageTitle.textContent = titles[page] || 'Dashboard';
    
    // Load page-specific data
    switch(page) {
        case 'transactions':
            loadTransactionsPage();
            break;
        case 'budgets':
            loadBudgetsPage();
            break;
        case 'reports':
            loadReportsPage();
            break;
        case 'categories':
            loadCategoriesPage();
            break;
    }
    
    // Close mobile menu
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('active');
}

async function loadDashboardData() {
    try {
        console.log('🔄 Loading dashboard data after page reload...');
        
        // Check authentication first
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found - redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        // Load transactions from API
        console.log('📥 Fetching transactions from API...');
        const transactionsResponse = await apiRequest('/transactions');
        if (transactionsResponse.success) {
            transactions = transactionsResponse.data || [];
            window.transactions = transactions;
            console.log(`✅ Loaded ${transactions.length} transactions from backend`);
        } else {
            console.error('❌ Failed to load transactions:', transactionsResponse.message);
            transactions = [];
        }

        // Load budgets from API
        console.log('📥 Fetching budgets from API...');
        const budgetsResponse = await apiRequest('/budgets');
        if (budgetsResponse.success) {
            budgets = budgetsResponse.data || [];
            window.budgets = budgets;
            console.log(`✅ Loaded ${budgets.length} budgets from backend`);
            
            // Update budget spending calculations
            updateAllBudgetsSpending();
        } else {
            console.error('❌ Failed to load budgets:', budgetsResponse.message);
            budgets = [];
        }

        // Update UI with the loaded data
        updateDashboard();
        
        console.log('🎯 Dashboard update complete after reload', {
            transactions: transactions.length,
            budgets: budgets.length
        });

        // 🔥 FIXED: Initialize charts WITH THE TRANSACTIONS DATA
        setTimeout(() => {
            console.log('🚀 Initializing charts with', transactions.length, 'transactions');
            
            // Try the new method first (from updated charts.js)
            if (typeof window.initializeCharts === 'function') {
                window.initializeCharts();
                console.log('✅ Charts initialized via initializeCharts()');
            } 
            // Fallback to old method - PASS THE TRANSACTIONS!
            else if (typeof initCharts === 'function') {
                initCharts(transactions); // 🔥 PASS THE ARRAY HERE
                console.log('✅ Charts initialized via initCharts() with', transactions.length, 'transactions');
            }
            // Final fallback - direct chart creation
            else if (typeof window.refreshCharts === 'function') {
                window.refreshCharts();
                console.log('✅ Charts initialized via refreshCharts()');
            }
            else {
                console.warn('⚠️ No chart initialization function found');
                // 🔥 DIRECT INITIALIZATION AS LAST RESORT
                if (transactions.length > 0) {
                    console.log('🔄 Attempting direct chart creation...');
                    createSpendingChart(transactions);
                    createCategoryChart(transactions);
                }
            }
        }, 300);

    } catch (error) {
        console.error('💥 Critical error loading data after reload:', error);
        
        // Show user-friendly error message
        if (error.message.includes('Session expired') || error.message.includes('Authentication')) {
            showToast('Your session has expired. Please login again.', 'error');
            setTimeout(() => {
                handleLogout();
            }, 2000);
        } else {
            showToast('Failed to load your data. Please refresh the page.', 'error');
        }
    }
}

// FIXED FUNCTION: Update spending for all budgets based on transactions
function updateAllBudgetsSpending() {
    console.log('Updating all budgets spending...');
    
    // Create a mapping for similar category names
    const categoryMapping = {
        'Food & Dining': 'Food & Dining',
        'Transportation': 'Transportation',
        'Bills & Utilities': 'Bills & Utilities'
        // Add other mappings as needed
    };
    
    budgets.forEach(budget => {
        // Reset spent amount to 0
        budget.spent = 0;
        
        // Calculate total expenses for this budget's category (with mapping)
        const categoryExpenses = transactions
            .filter(tx => {
                if (tx.type !== 'expense') return false;
                
                // Direct match
                if (tx.category === budget.category) return true;
                
                // Mapped match
                const mappedCategory = categoryMapping[tx.category];
                return mappedCategory === budget.category;
            })
            .reduce((total, tx) => total + tx.amount, 0);
        
        budget.spent = categoryExpenses;
        
        console.log(`Budget "${budget.category}": ₹${budget.spent} spent out of ₹${budget.limit}`);
    });
    
    // Update the global reference
    window.budgets = budgets;
}
function updateDashboard() {
    // CRITICAL: Always update budget spending before displaying
    updateAllBudgetsSpending();
    
    if (transactions.length === 0 && budgets.length === 0) {
        showEmptyState();
    } else {
        updateStats();
        updateRecentTransactions();
        updateBudgetsList();
         updateUIForNegativeBalance();
        
        // Update budgets page if active
        const budgetsPage = document.querySelector('.page-content[data-page="budgets"]');
        if (budgetsPage && budgetsPage.classList.contains('active')) {
            loadBudgetsPage();
        }
    }
}

function showEmptyState() {
    // Update stats to show zeros
    document.getElementById('totalBalance').textContent = '₹0.00';
    document.getElementById('totalIncome').textContent = '₹0.00';
    document.getElementById('totalExpenses').textContent = '₹0.00';
    document.getElementById('budgetRemaining').textContent = '₹0.00';
    
    // Hide percentage changes for new users
    document.querySelectorAll('.stat-change').forEach(change => {
        change.style.display = 'none';
    });
    
    // Show empty messages
    const transactionsContainer = document.getElementById('recentTransactions');
    const budgetsContainer = document.getElementById('budgetsList');
    
    if (transactionsContainer) {
        transactionsContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <p style="margin-bottom: 1rem;">No transactions yet</p>
                <button class="btn-primary" onclick="openTransactionModal('expense')">Add Your First Transaction</button>
            </div>
        `;
    }
    
    if (budgetsContainer) {
        budgetsContainer.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <p style="margin-bottom: 1rem;">No budgets created yet</p>
                <button class="btn-primary" onclick="showAddBudgetModal()">Create Your First Budget</button>
            </div>
        `;
    }
}

function updateStats() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const budgetRemaining = balance;
    
    const balanceElement = document.getElementById('totalBalance');
    const budgetRemainingElement = document.getElementById('budgetRemaining');
    
    // Update text
    balanceElement.textContent = `₹${balance.toFixed(2)}`;
    budgetRemainingElement.textContent = `₹${budgetRemaining.toFixed(2)}`;
    
    // Add visual warnings for negative amounts
    if (balance < 0) {
        balanceElement.style.color = 'var(--red)';
        showToast('Warning: Your balance is negative! Consider adding income or reducing expenses.', 'warning');
    } else {
        balanceElement.style.color = 'var(--gray-100)';
    }
    
    if (budgetRemaining < 0) {
        budgetRemainingElement.style.color = 'var(--red)';
    } else {
        budgetRemainingElement.style.color = 'var(--gray-100)';
    }
    
    // Update other stats...
    document.getElementById('totalIncome').textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `₹${totalExpenses.toFixed(2)}`;
}

function updateUIForNegativeBalance() {
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    const quickExpenseBtn = document.querySelector('.quick-actions .action-btn.primary');
    
    if (!canAddExpense()) {
        // Balance is negative or would go negative
        if (addExpenseBtn) {
            addExpenseBtn.disabled = true;
            addExpenseBtn.style.opacity = '0.5';
            addExpenseBtn.style.cursor = 'not-allowed';
            addExpenseBtn.title = 'Cannot add expenses: Insufficient funds';
        }
        if (quickExpenseBtn) {
            quickExpenseBtn.disabled = true;
            quickExpenseBtn.style.opacity = '0.5';
            quickExpenseBtn.style.cursor = 'not-allowed';
        }
    } else {
        // Balance is positive
        if (addExpenseBtn) {
            addExpenseBtn.disabled = false;
            addExpenseBtn.style.opacity = '1';
            addExpenseBtn.style.cursor = 'pointer';
            addExpenseBtn.title = 'Add Expense';
        }
        if (quickExpenseBtn) {
            quickExpenseBtn.disabled = false;
            quickExpenseBtn.style.opacity = '1';
            quickExpenseBtn.style.cursor = 'pointer';
        }
    }
}

function updateRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (!container) return;
    
    const recent = transactions.slice(0, 5);
    
    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recent.map(tx => {
        // Get the transaction ID properly
        const transactionId = tx.id || tx._id;
        return `
        <div class="transaction-item">
            <div class="transaction-icon" style="background: ${tx.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};">
                ${getCategoryIcon(tx.category)}
            </div>
            <div class="transaction-info">
                <div class="transaction-category">${tx.category}</div>
                <div class="transaction-date">${formatDate(tx.date)}</div>
                ${tx.description ? `<div class="transaction-description" style="font-size: 0.75rem; color: var(--gray-500); margin-top: 0.25rem;">${tx.description}</div>` : ''}
            </div>
            <div class="transaction-amount ${tx.type}">
                ${tx.type === 'income' ? '+' : '-'}₹${tx.amount.toFixed(2)}
            </div>
            <button onclick="handleDeleteTransaction('${transactionId}')" 
                    style="background: transparent; border: none; color: var(--gray-500); cursor: pointer; padding: 0.25rem; border-radius: 4px; transition: all 0.2s;"
                    onmouseover="this.style.color='var(--red)'; this.style.background='rgba(239, 68, 68, 0.1)';"
                    onmouseout="this.style.color='var(--gray-500)'; this.style.background='transparent';"
                    title="Delete transaction">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
            </button>
        </div>
    `}).join('');
}

function updateCharts() {
    if (typeof initCharts === 'function') {
        setTimeout(() => {
            initCharts(transactions);
        }, 100);
    }
}

// Add this function to validate if user can add more expenses
function canAddExpense(expenseAmount = 0) {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = totalIncome - totalExpenses;
    
    // Check if adding this expense would make balance negative
    if (currentBalance - expenseAmount < 0) {
        return false;
    }
    
    return currentBalance >= 0;
}

// FIXED: Use the budget.spent value that's already calculated
function checkBudgetLimit(category, expenseAmount) {
    // Category mapping for matching
    const categoryMapping = {
        'Food & Dining': 'Food & Dining',
        'Transportation': 'Transportation',
        'Bills & Utilities': 'Bills & Utilities'
    };
    
    // Map the transaction category to budget category
    const budgetCategory = categoryMapping[category] || category;
    
    const budget = budgets.find(b => b.category === budgetCategory);
    if (!budget) return { allowed: true, message: '', remaining: 0 }; // No budget set
    
    // Use the budget.spent value that's already calculated in updateAllBudgetsSpending()
    const currentSpent = budget.spent || 0;
    const totalAfterExpense = currentSpent + expenseAmount;
    const wouldExceed = totalAfterExpense > budget.limit;
    
    return {
        allowed: !wouldExceed,
        message: wouldExceed 
            ? `This expense would exceed your ${budgetCategory} budget limit of ₹${budget.limit.toFixed(2)}. Current spent: ₹${currentSpent.toFixed(2)}`
            : '',
        remaining: budget.limit - currentSpent
    };
}

function updateBudgetsList() {
    const container = document.getElementById('budgetsList');
    if (!container) return;
    
    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 2rem; color: var(--gray-500);">
                <p>No budgets created yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = budgets.map(budget => {
        const percentage = (budget.spent / budget.limit) * 100;
        const remaining = budget.limit - budget.spent;
        
        // Determine status with STRICT warnings
        let status = '';
        let statusText = '';
        let borderColor = 'transparent';
        
        if (percentage >= 100) {
            status = 'danger';
            statusText = '⚠️ EXCEEDED';
            borderColor = 'var(--red)';
        } else if (percentage >= 90) {
            status = 'danger';
            statusText = '⚠️ Critical';
            borderColor = 'var(--red)';
        } else if (percentage >= 75) {
            status = 'warning';
            statusText = '⚡ Warning';
            borderColor = 'var(--yellow)';
        }
        
        return `
            <div class="budget-item" style="border-left: 3px solid ${borderColor}; ${percentage >= 100 ? 'background: rgba(239, 68, 68, 0.05);' : ''}">
                <div class="budget-header">
                    <div class="budget-category">
                        ${budget.category}
                        ${statusText ? `<span style="margin-left: 0.5rem; font-size: 0.75rem; color: ${status === 'danger' ? 'var(--red)' : 'var(--yellow)'};">${statusText}</span>` : ''}
                    </div>
                    <div class="budget-amounts" style="color: ${remaining < 0 ? 'var(--red)' : 'var(--gray-100)'};">
                        ₹${budget.spent.toFixed(2)}/₹${budget.limit.toFixed(2)}
                    </div>
                </div>
                <div class="budget-bar">
                    <div class="budget-progress ${status}" style="width: ${Math.min(percentage, 100)}%; background: ${percentage >= 100 ? 'var(--red)' : budget.color || getBudgetColor(budget.category)};"></div>
                </div>
                <div class="budget-percentage" style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="color: ${percentage >= 100 ? 'var(--red)' : percentage >= 90 ? 'var(--yellow)' : 'var(--gray-400)'};">
                        ${percentage.toFixed(0)}% used
                    </span>
                    <span style="font-size: 0.875rem; color: ${remaining < 0 ? 'var(--red)' : 'var(--green)'}; font-weight: 600;">
                        ${remaining < 0 ? 'Over by ' : 'Remaining: '}₹${Math.abs(remaining).toFixed(2)}
                    </span>
                </div>
                ${remaining < 0 ? `
                    <div style="margin-top: 0.75rem; padding: 0.5rem; background: rgba(239, 68, 68, 0.1); border-radius: 0.375rem; border-left: 2px solid var(--red);">
                        <p style="font-size: 0.75rem; color: var(--red); font-weight: 600; margin: 0;">
                            ⚠️ Budget exceeded by ₹${Math.abs(remaining).toFixed(2)}!
                        </p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        const form = modal.querySelector('form');
        if (form) form.reset();
    }
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

function openTransactionModal(type) {
    const modal = document.getElementById('addTransactionModal');
    const tabs = modal.querySelectorAll('.form-tab');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.type === type) {
            tab.classList.add('active');
        }
    });
    
    // Set today's date
    const dateInput = document.getElementById('txDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    // Focus on amount field
    setTimeout(() => {
        const amountInput = document.getElementById('txAmount');
        if (amountInput) amountInput.focus();
    }, 300);
    
    openModal('addTransactionModal');
}

function showAddBudgetModal() {
    openModal('addBudgetModal');
}

function showAddCategoryModal() {
    showToast('Category management coming soon!', 'info');
}


async function handleAddBudget(e) {
    e.preventDefault();
    
    const category = document.getElementById('budgetCategory').value;
    const limit = parseFloat(document.getElementById('budgetLimit').value);
    const color = getSelectedBudgetColor();
    
    // VALIDATION 1: Check if limit is positive
    if (limit <= 0) {
        showToast('Budget limit must be greater than ₹0', 'error');
        return;
    }
    
    // VALIDATION 2: Calculate existing expenses for this category
    const existingExpenses = transactions
        .filter(tx => tx.type === 'expense' && tx.category === category)
        .reduce((total, tx) => total + tx.amount, 0);
    
    // STRICT VALIDATION 3: Don't allow budget creation if already exceeded
    if (existingExpenses > limit) {
        showToast(
            `Cannot create budget: You've already spent ₹${existingExpenses.toFixed(2)} in ${category}, which exceeds the limit of ₹${limit.toFixed(2)}. Please set a higher limit.`,
            'error'
        );
        return;
    }
    
    // WARNING: If very close to limit (90%+)
    if (existingExpenses > limit * 0.9) {
        const confirmed = confirm(
            `Warning: You've already spent ₹${existingExpenses.toFixed(2)} (${((existingExpenses/limit)*100).toFixed(0)}% of budget).\n\nAre you sure you want to create this budget?`
        );
        if (!confirmed) {
            return;
        }
    }
    
    const budget = {
        category,
        limit,
        color,
        spent: existingExpenses // Set current spending
    };
    
    try {
        const response = await apiRequest('/budgets', 'POST', budget);
        
        if (response.success) {
            budgets.push(response.data);
            window.budgets = budgets;
            updateAllBudgetsSpending();
            updateDashboard();
            closeModal('addBudgetModal');
            showToast('Budget created successfully!', 'success');
            loadBudgetsPage();
        } else {
            // Handle backend validation error
            if (response.budgetExceeded) {
                showToast(response.message || 'Budget limit validation failed', 'error');
            } else {
                showToast(response.message || 'Failed to create budget', 'error');
            }
        }
    } catch (error) {
        console.error('Error creating budget:', error);
        
        // For demo/offline mode only
        budget.id = Date.now();
        budgets.push(budget);
        window.budgets = budgets;
        updateAllBudgetsSpending();
        updateDashboard();
        closeModal('addBudgetModal');
        showToast('Budget created successfully!', 'success');
        loadBudgetsPage();
    }
}

async function handleAddTransaction(e) {
    e.preventDefault();
    
    const activeTab = document.querySelector('.form-tab.active');
    const type = activeTab.dataset.type;
    const amount = parseFloat(document.getElementById('txAmount').value);
    const category = document.getElementById('txCategory').value;
    
    // VALIDATION FOR EXPENSES
    if (type === 'expense') {
        // Check 1: Would this cause negative balance?
        if (!canAddExpense(amount)) {
            showToast('Cannot add expense: Would exceed available funds!', 'error');
            return;
        }
        
        // Check 2: Would this exceed budget limit?
        const budgetCheck = checkBudgetLimit(category, amount);
        if (!budgetCheck.allowed) {
            showToast(budgetCheck.message, 'error');
            return; // BLOCK the transaction
        }
        
        // Warning: Approaching budget limit (80%+)
        if (budgetCheck.remaining && budgetCheck.remaining - amount < budgetCheck.remaining * 0.2) {
            showToast(
                `Warning: Only ₹${(budgetCheck.remaining - amount).toFixed(2)} remaining in ${category} budget after this expense`,
                'warning'
            );
        }
    }
    
    const transaction = {
        type,
        amount,
        category,
        date: document.getElementById('txDate').value,
        description: document.getElementById('txDescription').value
    };
    
    try {
        const response = await apiRequest('/transactions', 'POST', transaction);
        
        if (response.success) {
            transactions.unshift(response.data);
            window.transactions = transactions;
            updateAllBudgetsSpending();
            updateDashboard();
            closeModal('addTransactionModal');
            showToast('Transaction added successfully!', 'success');
            
            // 🔥 ADD THIS: Refresh charts immediately
            setTimeout(() => {
                if (typeof refreshCharts === 'function') {
                    refreshCharts();
                }
            }, 100);
        } else {
            // Handle backend validation error
            if (response.budgetExceeded) {
                showToast(response.message || 'Budget limit exceeded', 'error');
            } else {
                showToast(response.message || 'Failed to add transaction', 'error');
            }
        }
    } catch (error) {
        console.error('Error adding transaction:', error);
        
        // For demo/offline mode only
        transaction.id = Date.now();
        transactions.unshift(transaction);
        window.transactions = transactions;
        updateAllBudgetsSpending();
        updateDashboard();
        closeModal('addTransactionModal');
        showToast('Transaction added successfully!', 'success');
        
        setTimeout(() => {
            if (typeof updateCharts === 'function') updateCharts();
        }, 100);
    }
}

// Replace your current apiRequest function with this:
async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('token');
    
    console.log(`🔄 API ${method} ${endpoint}`, data || '');
    
    if (!token) {
        console.error('❌ No JWT token found for API request');
        redirectToLogin();
        throw new Error('Authentication required');
    }
    
    const baseURL = 'http://localhost:5000';
    const url = `${baseURL}/api${endpoint}`;
    
    console.log(`🌐 Making request to: ${url}`);
    
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, config);
        
        console.log(`📨 API Response:`, response.status, response.statusText);
        
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            
            try {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                
                if (errorText.trim().startsWith('{') || errorText.trim().startsWith('[')) {
                    try {
                        const errorJson = JSON.parse(errorText);
                        errorMessage = errorJson.message || errorMessage;
                    } catch (e) {
                        errorMessage = errorText.substring(0, 100);
                    }
                } else {
                    errorMessage = errorText;
                }
            } catch (e) {
                // Ignore text parsing errors
            }
            
            console.error(`❌ HTTP Error ${response.status}:`, errorMessage);
            
            // 🔥 AUTO-HANDLE TOKEN ERRORS
            if (response.status === 401 || response.status === 403) {
                console.error('🔐 Token expired or invalid - clearing and redirecting');
                redirectToLogin();
                throw new Error('Session expired');
            }
            
            throw new Error(errorMessage);
        }
        
        const responseText = await response.text();
        
        if (!responseText) {
            return { success: true, data: [] };
        }
        
        try {
            const result = JSON.parse(responseText);
            console.log(`✅ API Success:`, result.success, `Data: ${result.data ? result.data.length : 'none'}`);
            return result;
        } catch (jsonError) {
            console.error('❌ JSON parse error:', jsonJsonError);
            throw new Error('Invalid JSON response from server');
        }
        
    } catch (error) {
        console.error(`💥 API Request Failed:`, error);
        
        if (error.message.includes('Session expired')) {
            // Already handled above
        } else if (error.message.includes('Failed to fetch')) {
            showToast('Cannot connect to backend server.', 'error');
        } else {
            showToast('Request failed: ' + error.message, 'error');
        }
        
        throw error;
    }
}

// 🔥 ADD THIS FUNCTION
function redirectToLogin() {
    console.log('🔄 Redirecting to login page...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Your session has expired. Please login again.', 'error');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// 🔥 UPDATE YOUR loadDashboardData FUNCTION
async function loadDashboardData() {
    try {
        console.log('🔄 Loading dashboard data after page reload...');
        
        // Check authentication first
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No token found - redirecting to login');
            redirectToLogin();
            return;
        }

        // Load transactions from API
        console.log('📥 Fetching transactions from API...');
        const transactionsResponse = await apiRequest('/transactions');
        if (transactionsResponse.success) {
            transactions = transactionsResponse.data || [];
            window.transactions = transactions;
            console.log(`✅ Loaded ${transactions.length} transactions from backend`);
        } else {
            console.error('❌ Failed to load transactions:', transactionsResponse.message);
            transactions = [];
        }

        // Load budgets from API
        console.log('📥 Fetching budgets from API...');
        const budgetsResponse = await apiRequest('/budgets');
        if (budgetsResponse.success) {
            budgets = budgetsResponse.data || [];
            window.budgets = budgets;
            console.log(`✅ Loaded ${budgets.length} budgets from backend`);
            
            // Update budget spending calculations
            updateAllBudgetsSpending();
        } else {
            console.error('❌ Failed to load budgets:', budgetsResponse.message);
            budgets = [];
        }

        // Update UI with the loaded data
        updateDashboard();
        
        console.log('🎯 Dashboard update complete after reload', {
            transactions: transactions.length,
            budgets: budgets.length
        });

        // In loadDashboardData() function, replace the chart initialization with:
        setTimeout(() => {
            console.log('🚀 Initializing charts with', transactions.length, 'transactions');
            
            if (typeof window.initializeCharts === 'function') {
                window.initializeCharts();
                console.log('✅ Charts initialized via initializeCharts()');
            } else if (typeof window.initCharts === 'function') {
                window.initCharts(transactions);
                console.log('✅ Charts initialized via initCharts()');
            }
        }, 300);

    } catch (error) {
        console.error('💥 Critical error loading data after reload:', error);
        
        // Don't show toast for auth errors (they're handled in apiRequest)
        if (!error.message.includes('Session expired')) {
            showToast('Failed to load your data. Please refresh the page.', 'error');
        }
    }
}

async function handleDeleteTransaction(transactionId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }

    try {
        const response = await apiRequest(`/transactions/${transactionId}`, 'DELETE');
        
        if (response.success) {
            // Remove from local array - handle both id and _id
            transactions = transactions.filter(tx => {
                const txId = tx.id || tx._id;
                return txId != transactionId;
            });
            window.transactions = transactions;
            
            // Update all budgets spending
            updateAllBudgetsSpending();
            
            // Update dashboard
            updateDashboard();
            
            showToast('Transaction deleted successfully!', 'success');
            
            // 🔥 ADD THIS: Refresh charts immediately
            setTimeout(() => {
                if (typeof refreshCharts === 'function') {
                    refreshCharts();
                }
            }, 100);
            
            // Refresh current page
            if (document.querySelector('.page-content[data-page="transactions"]').classList.contains('active')) {
                loadTransactionsPage();
            }
        }
    } catch (error) {
        console.error('Error deleting transaction:', error);
        
        // For demo/offline mode
        transactions = transactions.filter(tx => {
            const txId = tx.id || tx._id;
            return txId != transactionId;
        });
        window.transactions = transactions;
        updateAllBudgetsSpending();
        updateDashboard();
        showToast('Transaction deleted successfully!', 'success');
        
        // 🔥 ADD THIS: Refresh charts immediately
        setTimeout(() => {
            if (typeof refreshCharts === 'function') {
                refreshCharts();
            }
        }, 100);
        
        if (document.querySelector('.page-content[data-page="transactions"]').classList.contains('active')) {
            loadTransactionsPage();
        }
    }
}

// APPLY FILTERS FUNCTION
function applyFilters() {
    currentFilters = {
        category: document.getElementById('filterCategory').value,
        type: document.getElementById('filterType').value,
        amountMin: parseFloat(document.getElementById('filterAmountMin').value) || null,
        amountMax: parseFloat(document.getElementById('filterAmountMax').value) || null,
        dateFrom: document.getElementById('filterDateFrom').value || null,
        dateTo: document.getElementById('filterDateTo').value || null
    };
    
    console.log('Applying filters:', currentFilters);
    
    closeModal('filterModal');
    loadTransactionsPage();
    
    // Show filter indicator
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn && isFilterActive()) {
        filterBtn.style.background = 'var(--primary-blue)';
        filterBtn.style.color = 'white';
        showToast('Filters applied successfully!', 'success');
    }
}

// CLEAR FILTERS FUNCTION
function clearFilters() {
    currentFilters = {
        category: '',
        type: '',
        amountMin: null,
        amountMax: null,
        dateFrom: null,
        dateTo: null
    };
    
    // Reset form
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterAmountMin').value = '';
    document.getElementById('filterAmountMax').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    
    // Reset button style
    const filterBtn = document.getElementById('filterBtn');
    if (filterBtn) {
        filterBtn.style.background = '';
        filterBtn.style.color = '';
    }
    
    closeModal('filterModal');
    loadTransactionsPage();
    showToast('Filters cleared', 'info');
}

// CHECK IF ANY FILTER IS ACTIVE
function isFilterActive() {
    return currentFilters.category || 
           currentFilters.type || 
           currentFilters.amountMin !== null || 
           currentFilters.amountMax !== null ||
           currentFilters.dateFrom || 
           currentFilters.dateTo;
}

// GET FILTERED TRANSACTIONS
function getFilteredTransactions() {
    return transactions.filter(tx => {
        // Category filter
        if (currentFilters.category && tx.category !== currentFilters.category) {
            return false;
        }
        
        // Type filter
        if (currentFilters.type && tx.type !== currentFilters.type) {
            return false;
        }
        
        // Amount filter
        if (currentFilters.amountMin !== null && tx.amount < currentFilters.amountMin) {
            return false;
        }
        if (currentFilters.amountMax !== null && tx.amount > currentFilters.amountMax) {
            return false;
        }
        
        // Date filter
        if (currentFilters.dateFrom || currentFilters.dateTo) {
            const txDate = new Date(tx.date);
            
            if (currentFilters.dateFrom) {
                const fromDate = new Date(currentFilters.dateFrom);
                if (txDate < fromDate) return false;
            }
            
            if (currentFilters.dateTo) {
                const toDate = new Date(currentFilters.dateTo);
                toDate.setHours(23, 59, 59); // Include the entire day
                if (txDate > toDate) return false;
            }
        }
        
        return true;
    });
}


// ADD THIS FUNCTION - Delete Budget
async function handleDeleteBudget(budgetId, budgetCategory) {
    if (!confirm(`Are you sure you want to delete the budget for ${budgetCategory}?`)) {
        return;
    }

    try {
        const response = await apiRequest(`/budgets/${budgetId}`, 'DELETE');
        
        if (response.success) {
            // Remove from local array
            budgets = budgets.filter(b => {
                const bId = b.id || b._id;
                return bId != budgetId;
            });
            window.budgets = budgets;
            
            updateDashboard();
            showToast('Budget deleted successfully!', 'success');
            
            // Refresh budgets page if active
            if (document.querySelector('.page-content[data-page="budgets"]').classList.contains('active')) {
                loadBudgetsPage();
            }
        }
    } catch (error) {
        console.error('Error deleting budget:', error);
        
        // For demo/offline mode
        budgets = budgets.filter(b => {
            const bId = b.id || b._id;
            return bId != budgetId;
        });
        window.budgets = budgets;
        updateDashboard();
        showToast('Budget deleted successfully!', 'success');
        
        if (document.querySelector('.page-content[data-page="budgets"]').classList.contains('active')) {
            loadBudgetsPage();
        }
    }
}

// Make it globally accessible
window.handleDeleteBudget = handleDeleteBudget;

// UPDATE loadTransactionsPage() to use filtered data
// REPLACE the function with this updated version:
function loadTransactionsPage() {
    const container = document.getElementById('transactionsTable');
    if (!container) return;
    
    // Use filtered transactions instead of all transactions
    const displayTransactions = getFilteredTransactions();
    
    if (displayTransactions.length === 0) {
        const message = isFilterActive() 
            ? 'No transactions match your filters'
            : 'No Transactions Yet';
        const subMessage = isFilterActive()
            ? 'Try adjusting your filter criteria'
            : 'Start by adding your first transaction';
            
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <h3 style="margin-bottom: 1rem; color: var(--gray-400);">${message}</h3>
                <p style="color: var(--gray-500); margin-bottom: 2rem;">${subMessage}</p>
                ${isFilterActive() 
                    ? '<button class="btn-secondary" onclick="clearFilters()">Clear Filters</button>'
                    : '<button class="btn-primary" onclick="openTransactionModal(\'expense\')">Add Transaction</button>'
                }
            </div>
        `;
        return;
    }
    
    // Show filter info if active
    const filterInfo = isFilterActive() ? `
        <div style="background: rgba(59, 130, 246, 0.1); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 3px solid var(--primary-blue);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: var(--gray-300);">
                    <strong>Filters Active:</strong> Showing ${displayTransactions.length} of ${transactions.length} transactions
                </span>
                <button class="btn-secondary" onclick="clearFilters()" style="padding: 0.5rem 1rem; font-size: 0.875rem;">
                    Clear Filters
                </button>
            </div>
        </div>
    ` : '';
    
    container.innerHTML = filterInfo + `
        <div class="card">
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 1px solid var(--gray-800);">
                            <th style="padding: 1rem; text-align: left; color: var(--gray-400); font-size: 0.875rem;">Date</th>
                            <th style="padding: 1rem; text-align: left; color: var(--gray-400); font-size: 0.875rem;">Category</th>
                            <th style="padding: 1rem; text-align: left; color: var(--gray-400); font-size: 0.875rem;">Description</th>
                            <th style="padding: 1rem; text-align: right; color: var(--gray-400); font-size: 0.875rem;">Amount</th>
                            <th style="padding: 1rem; text-align: center; color: var(--gray-400); font-size: 0.875rem;">Type</th>
                            <th style="padding: 1rem; text-align: center; color: var(--gray-400); font-size: 0.875rem;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${displayTransactions.map(tx => {
                            const transactionId = tx.id || tx._id;
                            return `
                            <tr style="border-bottom: 1px solid var(--gray-800);">
                                <td style="padding: 1rem; color: var(--gray-300); font-size: 0.875rem;">${formatDate(tx.date)}</td>
                                <td style="padding: 1rem; color: var(--gray-300); font-size: 0.875rem;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <span>${getCategoryIcon(tx.category)}</span>
                                        <span>${tx.category}</span>
                                    </div>
                                </td>
                                <td style="padding: 1rem; color: var(--gray-300); font-size: 0.875rem;">${tx.description || '-'}</td>
                                <td style="padding: 1rem; text-align: right; font-weight: 600; color: ${tx.type === 'income' ? 'var(--green)' : 'var(--red)'};">
                                    ${tx.type === 'income' ? '+' : '-'}₹${tx.amount.toFixed(2)}
                                </td>
                                <td style="padding: 1rem; text-align: center;">
                                    <span style="padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; background: ${tx.type === 'income' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; color: ${tx.type === 'income' ? 'var(--green)' : 'var(--red)'};">
                                        ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                                    </span>
                                </td>
                                <td style="padding: 1rem; text-align: center;">
                                    <button onclick="handleDeleteTransaction('${transactionId}')" 
                                            style="background: rgba(239, 68, 68, 0.1); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.5rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.75rem; font-weight: 500; transition: all 0.2s;"
                                            onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.borderColor='rgba(239, 68, 68, 0.5)';"
                                            onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.borderColor='rgba(239, 68, 68, 0.3)';">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        `}).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.getFilteredTransactions = getFilteredTransactions;

function loadBudgetsPage() {
    const container = document.getElementById('budgetsGrid');
    if (!container) return;
    
    if (budgets.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <h3 style="margin-bottom: 1rem; color: var(--gray-400);">No Budgets Yet</h3>
                <p style="color: var(--gray-500); margin-bottom: 2rem;">Create your first budget to start tracking your spending</p>
                <button class="btn-primary" onclick="showAddBudgetModal()">Create Budget</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
            ${budgets.map(budget => {
                const percentage = (budget.spent / budget.limit) * 100;
                const remaining = budget.limit - budget.spent;
                const color = budget.color || getBudgetColor(budget.category);
                
                // Determine status
                let status = '';
                let statusBadge = '';
                let cardBorder = 'transparent';
                
                if (percentage >= 100) {
                    status = 'danger';
                    statusBadge = '<span style="background: var(--red); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">EXCEEDED</span>';
                    cardBorder = 'var(--red)';
                } else if (percentage >= 90) {
                    status = 'danger';
                    statusBadge = '<span style="background: var(--red); color: white; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">CRITICAL</span>';
                    cardBorder = 'var(--red)';
                } else if (percentage >= 75) {
                    status = 'warning';
                    statusBadge = '<span style="background: var(--yellow); color: var(--gray-900); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">WARNING</span>';
                    cardBorder = 'var(--yellow)';
                }
                
                return `
                    <div class="card" style="border: 2px solid ${cardBorder}; ${percentage >= 100 ? 'background: rgba(239, 68, 68, 0.03);' : ''}; position: relative;">
        <!-- Delete Button -->
        <button onclick="handleDeleteBudget('${budget.id || budget._id}', '${budget.category}')" 
                style="position: absolute; top: 1rem; right: 1rem; background: rgba(239, 68, 68, 0.1); color: var(--red); border: 1px solid rgba(239, 68, 68, 0.3); padding: 0.5rem; border-radius: 6px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center;"
                onmouseover="this.style.background='rgba(239, 68, 68, 0.2)'; this.style.borderColor='var(--red)';"
                onmouseout="this.style.background='rgba(239, 68, 68, 0.1)'; this.style.borderColor='rgba(239, 68, 68, 0.3)';"
                title="Delete Budget">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
        </button>
        
        <!-- Rest of your existing card content -->
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <div>
                                <h3 style="font-size: 1.25rem; font-weight: 600; color: var(--gray-100); margin-bottom: 0.5rem;">${budget.category}</h3>
                                <p style="font-size: 0.875rem; color: var(--gray-500);">Monthly Budget</p>
                            </div>
                            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                                <div style="width: 3rem; height: 3rem; border-radius: 0.5rem; background: ${color}20; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                                    ${getCategoryIcon(budget.category)}
                                </div>
                                ${statusBadge}
                            </div>
                        </div>
                        <div style="margin-bottom: 1rem;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="font-size: 0.875rem; color: var(--gray-400);">Spent</span>
                                <span style="font-size: 0.875rem; font-weight: 600; color: var(--gray-100);">₹${budget.spent.toFixed(2)} / ₹${budget.limit.toFixed(2)}</span>
                            </div>
                            <div class="budget-bar" style="height: 12px; background: var(--gray-800); border-radius: 6px; overflow: hidden;">
                                <div class="budget-progress ${status}" style="width: ${Math.min(percentage, 100)}%; background: ${percentage >= 100 ? 'var(--red)' : color}; height: 100%; transition: all 0.3s ease;"></div>
                            </div>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--gray-800);">
                            <div>
                                <p style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 0.25rem;">
                                    ${remaining < 0 ? 'Over Budget' : 'Remaining'}
                                </p>
                                <p style="font-size: 1.25rem; font-weight: 700; color: ${remaining >= 0 ? 'var(--green)' : 'var(--red)'};">
                                    ${remaining < 0 ? '-' : ''}₹${Math.abs(remaining).toFixed(2)}
                                </p>
                            </div>
                            <div>
                                <p style="font-size: 0.75rem; color: var(--gray-500); margin-bottom: 0.25rem;">Used</p>
                                <p style="font-size: 1.25rem; font-weight: 700; color: ${percentage >= 100 ? 'var(--red)' : percentage >= 90 ? 'var(--yellow)' : 'var(--gray-100)'};">
                                    ${percentage.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                        ${remaining < 0 ? `
                            <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(239, 68, 68, 0.1); border-left: 3px solid var(--red); border-radius: 0.5rem;">
                                <p style="font-size: 0.875rem; color: var(--red); font-weight: 600;">
                                    ⚠️ Budget exceeded by ₹${Math.abs(remaining).toFixed(2)}
                                </p>
                                <p style="font-size: 0.75rem; color: var(--red); margin-top: 0.25rem;">
                                    Cannot add more ${budget.category} expenses until within budget
                                </p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// 🔍 DEBUG FUNCTION - Add this to dashboard.js
function debugAIData() {
    console.log('🔍 DEBUG - Current transactions:', window.transactions);
    console.log('🔍 DEBUG - Current budgets:', window.budgets);
    console.log('🔍 DEBUG - Transactions count:', window.transactions?.length);
    console.log('🔍 DEBUG - Budgets count:', window.budgets?.length);
    
    if (window.transactions && window.transactions.length > 0) {
        console.log('🔍 DEBUG - First transaction:', window.transactions[0]);
        console.log('🔍 DEBUG - Transaction types:', [...new Set(window.transactions.map(t => t.type))]);
        console.log('🔍 DEBUG - Transaction categories:', [...new Set(window.transactions.map(t => t.category))]);
        console.log('🔍 DEBUG - Transaction dates:', [...new Set(window.transactions.map(t => t.date))]);
    }
    
    if (window.budgets && window.budgets.length > 0) {
        console.log('🔍 DEBUG - First budget:', window.budgets[0]);
    }
    
    // Test the AI data preparation
    const testSummary = prepareFinancialSummary(window.transactions || [], window.budgets || []);
    console.log('🔍 DEBUG - AI Data Summary:', testSummary);
}

async function loadReportsPage() {
    const container = document.getElementById('reportsContent');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <h3 style="margin-bottom: 1rem; color: var(--gray-400);">No Data for Reports</h3>
                <p style="color: var(--gray-500);">Add some transactions to see financial reports</p>
            </div>
        `;
        return;
    }
    
    // Show loading state
    container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
            <div class="loading-spinner" style="margin: 0 auto 1rem; width: 48px; height: 48px; border: 4px solid var(--gray-800); border-top-color: var(--primary-blue); border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <h3 style="color: var(--gray-300);">Generating AI-Powered Report...</h3>
            <p style="color: var(--gray-500); margin-top: 0.5rem;">This may take 20-30 seconds</p>
        </div>
    `;
    
    try {
        console.log('🚀 Starting AI report generation...');
        
        // ✅ INCREASE TIMEOUT to 30 seconds
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI report generation timeout')), 30000) // 30 seconds
        );
        
        // Generate AI report with timeout
        const reportPromise = generateAIReport(transactions, budgets);
        const reportResult = await Promise.race([reportPromise, timeoutPromise]);
        
        if (reportResult.success) {
            console.log('✅ AI report generated successfully');
            const reportHTML = generateReportHTML(reportResult.data);
            container.innerHTML = reportHTML;
            
            // Store report data for export
            window.currentReportData = reportResult.data;
        } else {
            console.error('❌ AI report failed:', reportResult.error);
            throw new Error(reportResult.error || 'Failed to generate AI report');
        }
        
    } catch (error) {
        console.error('💥 Error loading report:', error);
        
        // Show more specific error messages
        let errorMessage = error.message;
        if (errorMessage.includes('Invalid API key')) {
            errorMessage = 'AI service configuration issue. Using basic reports.';
        } else if (errorMessage.includes('rate limit')) {
            errorMessage = 'AI service temporarily limited. Using basic reports.';
        } else if (errorMessage.includes('timeout')) {
            errorMessage = 'AI analysis taking too long. Using basic reports.';
        }
        
        // Fallback to enhanced basic report
        showEnhancedBasicReport(errorMessage);
    }
}

// Enhanced basic report function
function showEnhancedBasicReport(errorMessage = '') {
    const container = document.getElementById('reportsContent');
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    
    const expenseBreakdown = getExpenseBreakdown();
    const topCategory = expenseBreakdown[0] || { category: 'None', amount: 0 };
    
    container.innerHTML = `
        ${errorMessage ? `
        <div class="card" style="border-left: 3px solid var(--yellow); background: rgba(245, 158, 11, 0.05);">
            <p style="color: var(--yellow); margin-bottom: 0.5rem;">⚠️ AI Insights Temporarily Unavailable</p>
            <p style="color: var(--gray-500); font-size: 0.875rem; margin: 0;">${errorMessage}</p>
        </div>
        ` : ''}
        
        <div style="display: grid; gap: 1.5rem; margin-top: 1.5rem;">
            <div class="card">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1.5rem;">📊 Financial Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                    <div>
                        <p style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.5rem;">Total Income</p>
                        <p style="font-size: 2rem; font-weight: 700; color: var(--green);">₹${totalIncome.toFixed(2)}</p>
                    </div>
                    <div>
                        <p style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.5rem;">Total Expenses</p>
                        <p style="font-size: 2rem; font-weight: 700; color: var(--red);">₹${totalExpenses.toFixed(2)}</p>
                    </div>
                    <div>
                        <p style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.5rem;">Net Savings</p>
                        <p style="font-size: 2rem; font-weight: 700; color: ${netSavings >= 0 ? 'var(--green)' : 'var(--red)'};">₹${netSavings.toFixed(2)}</p>
                    </div>
                    <div>
                        <p style="font-size: 0.875rem; color: var(--gray-500); margin-bottom: 0.5rem;">Savings Rate</p>
                        <p style="font-size: 2rem; font-weight: 700; color: ${savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--yellow)' : 'var(--red)'};">
                            ${savingsRate.toFixed(1)}%
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">💡 Quick Insights</h3>
                <div style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
                    <div style="padding: 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--gray-400); margin-bottom: 0.5rem;">Largest Expense</p>
                        <p style="font-size: 1.125rem; font-weight: 600; color: var(--gray-100);">${topCategory.category}</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: var(--red);">₹${topCategory.amount.toFixed(2)}</p>
                    </div>
                    <div style="padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
                        <p style="font-size: 0.875rem; color: var(--gray-400); margin-bottom: 0.5rem;">Monthly Savings</p>
                        <p style="font-size: 1.125rem; font-weight: 600; color: var(--gray-100);">${netSavings >= 0 ? 'Positive' : 'Negative'}</p>
                        <p style="font-size: 1.5rem; font-weight: 700; color: ${netSavings >= 0 ? 'var(--green)' : 'var(--red)'};">₹${Math.abs(netSavings).toFixed(2)}</p>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">📈 Expense Breakdown</h3>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${expenseBreakdown.map(item => `
                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: var(--gray-300);">${item.category}</span>
                                <span style="font-weight: 600; color: var(--gray-100);">₹${item.amount.toFixed(2)} (${item.percentage.toFixed(1)}%)</span>
                            </div>
                            <div style="height: 8px; background: var(--gray-800); border-radius: 4px; overflow: hidden;">
                                <div style="height: 100%; background: ${item.color}; width: ${item.percentage}%;"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function loadCategoriesPage() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;
    
    const categories = [
        { name: 'Food & Dining', icon: '🍔', color: '#f59e0b' },
        { name: 'Transportation', icon: '🚗', color: '#3b82f6' },
        { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
        { name: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
        { name: 'Bills & Utilities', icon: '🧾', color: '#10b981' },
        { name: 'Healthcare', icon: '🏥', color: '#ef4444' },
        { name: 'Other', icon: '📦', color: '#6b7280' }
    ];
    
    container.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem;">
            ${categories.map(category => `
                <div class="card" style="text-align: center; cursor: pointer; transition: var(--transition); border-left: 4px solid ${category.color};" 
                     onmouseover="this.style.transform='translateY(-2px)'; this.style.borderColor='${category.color}'" 
                     onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='var(--gray-800)'">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${category.icon}</div>
                    <h4 style="font-size: 1.125rem; font-weight: 600; color: var(--gray-100); margin-bottom: 0.5rem;">${category.name}</h4>
                    <p style="font-size: 0.875rem; color: var(--gray-500);">${getTransactionCountByCategory(category.name)} transactions</p>
                </div>
            `).join('')}
        </div>
    `;
}

function getExpenseBreakdown() {
    const expenses = transactions.filter(t => t.type === 'expense');
    const total = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    if (total === 0) {
        return [];
    }
    
    const breakdown = {};
    expenses.forEach(tx => {
        if (!breakdown[tx.category]) {
            breakdown[tx.category] = { amount: 0, color: getBudgetColor(tx.category) };
        }
        breakdown[tx.category].amount += tx.amount;
    });
    
    return Object.entries(breakdown).map(([category, data]) => ({
        category,
        amount: data.amount,
        percentage: (data.amount / total) * 100,
        color: data.color
    })).sort((a, b) => b.amount - a.amount);
}

function getTransactionCountByCategory(category) {
    return transactions.filter(t => t.category === category).length;
}

function getCategoryIcon(category) {
    const icons = {
        'Food & Dining': '🍔',
        'Transportation': '🚗',
        'Shopping': '🛍️',
        'Entertainment': '🎬',
        'Bills & Utilities': '🧾',
        'Healthcare': '🏥',
        'Other': '📦'
    };
    return icons[category] || '📦';
}

function getBudgetColor(category) {
    const colorMap = {
        'Food & Dining': '#f59e0b',
        'Transportation': '#3b82f6',
        'Shopping': '#ec4899',
        'Entertainment': '#8b5cf6',
        'Bills & Utilities': '#10b981',
        'Healthcare': '#ef4444',
        'Other': '#6b7280'
    };
    return colorMap[category] || getRandomColor();
}

function getRandomColor() {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function getSelectedBudgetColor() {
    const selected = document.querySelector('input[name="budgetColor"]:checked');
    return selected ? selected.value : getRandomColor();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

async function handleExportReport() {
    try {
        if (!window.currentReportData) {
            showToast('No report data available. Please generate a report first.', 'error');
            return;
        }

        showToast('Generating PDF report...', 'info');
        
        // Create PDF content
        const pdfContent = createPDFContent(window.currentReportData);
        
        // Generate and download PDF
        await generatePDF(pdfContent);
        
        showToast('PDF report downloaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting report:', error);
        showToast('Failed to export report. Please try again.', 'error');
    }
}

function createPDFContent(reportData) {
    const { summary, aiAnalysis, recommendations, insights } = reportData;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.name || 'User';
    const userEmail = user.email || user.phone || 'N/A';
    
    // Clean and format the AI analysis for PDF
    const cleanAnalysis = aiAnalysis
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **bold** to <strong>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')            // Convert *italic* to <em>
        .replace(/\$/g, '₹')                             // Replace $ with ₹
        .split('\n\n')                                   // Split by paragraphs
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => `<p>${para}</p>`)
        .join('');

    // Clean insights for PDF
    const cleanInsights = insights.map(insight => 
        insight.replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\$(.*?)\s/g, '₹$1 ')
    );

    // Clean recommendations for PDF  
    const cleanRecommendations = recommendations.map(rec => 
        rec.replace(/\*\*(.*?)\*\*/g, '$1')
          .replace(/\$(.*?)\s/g, '₹$1 ')
    );

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>BudgetPro Financial Report - ${userName} ${summary.period.month} ${summary.period.year}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    text-align: center;
                    border-bottom: 3px solid #3b82f6;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                }
                .header h1 {
                    color: #3b82f6;
                    margin: 0;
                    font-size: 28px;
                }
                .header .subtitle {
                    color: #6b7280;
                    font-size: 16px;
                    margin: 5px 0;
                }
                .section {
                    margin-bottom: 30px;
                    page-break-inside: avoid;
                }
                .section h2 {
                    color: #1f2937;
                    border-left: 4px solid #3b82f6;
                    padding-left: 10px;
                    margin: 20px 0 15px 0;
                    font-size: 20px;
                }
                .overview-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 15px 0;
                }
                .overview-item {
                    background: #f8fafc;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #3b82f6;
                }
                .overview-label {
                    font-size: 12px;
                    color: #6b7280;
                    text-transform: uppercase;
                    font-weight: 600;
                    margin-bottom: 5px;
                }
                .overview-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1f2937;
                }
                .income { color: #10b981; }
                .expense { color: #ef4444; }
                .positive { color: #10b981; }
                .negative { color: #ef4444; }
                .insights-list, .recommendations-list {
                    margin: 15px 0;
                }
                .insight-item, .recommendation-item {
                    background: #f0f9ff;
                    margin: 8px 0;
                    padding: 12px;
                    border-radius: 6px;
                    border-left: 3px solid #3b82f6;
                }
                .recommendation-item {
                    background: #f0fdf4;
                    border-left-color: #10b981;
                }
                .category-breakdown {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .category-breakdown th {
                    background: #3b82f6;
                    color: white;
                    padding: 10px;
                    text-align: left;
                }
                .category-breakdown td {
                    padding: 10px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .trends-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                }
                .trends-table th, .trends-table td {
                    padding: 10px;
                    text-align: center;
                    border: 1px solid #e5e7eb;
                }
                .trends-table th {
                    background: #f8fafc;
                    font-weight: 600;
                }
                .analysis-text {
                    background: #f8fafc;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                .analysis-text p {
                    margin-bottom: 15px;
                }
                .analysis-text strong {
                    color: #1f2937;
                    font-weight: 700;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #e5e7eb;
                    color: #6b7280;
                    font-size: 12px;
                }
                @media print {
                    body { margin: 0; padding: 10px; }
                    .section { page-break-inside: avoid; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>BudgetPro Financial Report</h1>
                <div class="subtitle">${summary.period.month} ${summary.period.year}</div>
                <div class="subtitle">Generated on: ${new Date().toLocaleDateString()}</div>
            </div>

            <!-- ADD USER INFORMATION SECTION -->
            <div class="section">
                <h2>👤 User Information</h2>
                <div class="user-info">
                    <div class="user-info-row">
                        <span class="user-label">Name:</span>
                        <span class="user-value">${userName}</span>
                    </div>
                    <div class="user-info-row">
                        <span class="user-label">Contact:</span>
                        <span class="user-value">${userEmail}</span>
                    </div>
                    <div class="user-info-row">
                        <span class="user-label">Report Period:</span>
                        <span class="user-value">${summary.period.month} ${summary.period.year}</span>
                    </div>
                    <div class="user-info-row">
                        <span class="user-label">Total Transactions Analyzed:</span>
                        <span class="user-value">${summary.transactionCount}</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📊 Financial Overview</h2>
                <div class="overview-grid">
                    <div class="overview-item">
                        <div class="overview-label">Total Income</div>
                        <div class="overview-value income">₹${summary.overview.totalIncome.toFixed(2)}</div>
                    </div>
                    <div class="overview-item">
                        <div class="overview-label">Total Expenses</div>
                        <div class="overview-value expense">₹${summary.overview.totalExpenses.toFixed(2)}</div>
                    </div>
                    <div class="overview-item">
                        <div class="overview-label">Net Savings</div>
                        <div class="overview-value ${summary.overview.netSavings >= 0 ? 'positive' : 'negative'}">
                            ₹${summary.overview.netSavings.toFixed(2)}
                        </div>
                    </div>
                    <div class="overview-item">
                        <div class="overview-label">Savings Rate</div>
                        <div class="overview-value">${summary.overview.savingsRate.toFixed(1)}%</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>📈 Expense Breakdown</h2>
                <table class="category-breakdown">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Percentage</th>
                            <th>Transactions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(summary.categoryBreakdown)
                            .sort(([,a], [,b]) => b.amount - a.amount)
                            .map(([category, data]) => `
                                <tr>
                                    <td>${category}</td>
                                    <td>₹${data.amount.toFixed(2)}</td>
                                    <td>${((data.amount / summary.overview.totalExpenses) * 100).toFixed(1)}%</td>
                                    <td>${data.count}</td>
                                </tr>
                            `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>💰 Budget Performance</h2>
                <table class="category-breakdown">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Spent</th>
                            <th>Limit</th>
                            <th>Used</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summary.budgetAnalysis.map(budget => `
                            <tr>
                                <td>${budget.category}</td>
                                <td>₹${budget.spent.toFixed(2)}</td>
                                <td>₹${budget.limit.toFixed(2)}</td>
                                <td>${budget.percentageUsed.toFixed(0)}%</td>
                                <td>${budget.percentageUsed >= 100 ? '⚠️ EXCEEDED' : budget.percentageUsed >= 90 ? '⚠️ WARNING' : '✓ ON TRACK'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>📅 Spending Trends (Last 3 Months)</h2>
                <table class="trends-table">
                    <thead>
                        <tr>
                            <th>Month</th>
                            <th>Income</th>
                            <th>Expenses</th>
                            <th>Savings</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${summary.spendingTrends.map(trend => `
                            <tr>
                                <td>${trend.month}</td>
                                <td class="income">₹${trend.income.toFixed(2)}</td>
                                <td class="expense">₹${trend.expenses.toFixed(2)}</td>
                                <td class="${trend.savings >= 0 ? 'positive' : 'negative'}">₹${trend.savings.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <div class="section">
                <h2>💡 Key Insights</h2>
                <div class="insights-list">
                    ${cleanInsights.map(insight => `
                        <div class="insight-item">
                            ${insight}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>🎯 Recommendations</h2>
                <div class="recommendations-list">
                    ${cleanRecommendations.map((rec, index) => `
                        <div class="recommendation-item">
                            <strong>${index + 1}.</strong> ${rec}
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="section">
                <h2>📝 AI Analysis</h2>
                <div class="analysis-text">
                    ${cleanAnalysis}
                </div>
            </div>

            <div class="footer">
                <p><strong>Confidential Report</strong> - Generated exclusively for ${userName}</p>
                <p>This report was generated using AI-powered analysis by BudgetPro</p>
                <p>For questions or support, please contact: support@budgetpro.com</p>
            </div>
        </body>
        </html>
    `;
}

async function generatePDF(htmlContent) {
    // Use html2pdf library for PDF generation
    if (typeof html2pdf === 'undefined') {
        // Load html2pdf library if not already loaded
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    }
    
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    
    const opt = {
        margin: 10,
        filename: `BudgetPro_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    await html2pdf().set(opt).from(element).save();
    
    document.body.removeChild(element);
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

function handleLogout() {
    clearUserSession();
    window.location.href = 'index.html';
}

// Toast notification function
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = 'toast';
        toast.classList.add(type, 'show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Make functions globally accessible
window.navigateTo = navigateTo;
window.openTransactionModal = openTransactionModal;
window.showAddBudgetModal = showAddBudgetModal;
// Add to the existing global functions at the bottom
window.handleDeleteTransaction = handleDeleteTransaction;
window.closeModal = closeModal;

window.generateAIReport = generateAIReport;
window.generateReportHTML = generateReportHTML;
window.exportDetailedReport = exportDetailedReport;
window.prepareFinancialSummary = prepareFinancialSummary;
window.getExpenseBreakdown = getExpenseBreakdown;