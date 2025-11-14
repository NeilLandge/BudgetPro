// Charts Configuration using Chart.js

let spendingChart = null;
let categoryChart = null;
let currentTimePeriod = '7days'; // Default time period
let allTransactions = []; // Store transactions for filtering

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Charts initialized, waiting for data...');
    setupTimePeriodFilters();
    
    // 🔥 CHANGED: Don't load immediately - wait for dashboard data
    // Charts will be initialized by dashboard.js after data loads
});

function setupTimePeriodFilters() {
    const periodButtons = document.querySelectorAll('.time-period-btn');
    console.log('🎯 Setting up time period filters:', periodButtons.length);
    
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            console.log('🔄 Time period clicked:', this.dataset.period);
            
            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current time period
            currentTimePeriod = this.dataset.period;
            
            console.log('📅 Current time period updated to:', currentTimePeriod);
            
            // Refresh charts with new time period
            refreshChartsWithPeriod();
        });
    });
}

// 🔥 UPDATED: Better data loading
async function loadChartData() {
    try {
        console.log('📊 Loading chart data...');
        
        // 🔥 PRIORITY: Use global transactions array from dashboard.js
        if (window.transactions && Array.isArray(window.transactions) && window.transactions.length > 0) {
            console.log('✅ Using global transactions data:', window.transactions.length);
            allTransactions = window.transactions;
            return window.transactions;
        }
        
        // Fallback to API call
        console.log('🔄 Global data not available, fetching from API...');
        const transactionsResponse = await window.apiRequest('/transactions');
        if (transactionsResponse.success) {
            allTransactions = transactionsResponse.data || [];
            return allTransactions;
        }
        return [];
    } catch (error) {
        console.error('Error loading chart data:', error);
        return [];
    }
}

function initCharts(transactions = []) {
    console.log('🎨 Initializing charts with', transactions.length, 'transactions');
    
    // Store transactions globally
    allTransactions = transactions;
    
    // 🔥 ADDED: Handle empty data
    if (transactions.length === 0) {
        console.warn('⚠️ No transactions data available for charts');
        showChartEmptyState();
        return;
    }
    
    createSpendingChart(transactions);
    createCategoryChart(transactions);
}

// 🔥 ADDED: Show empty state when no data
function showChartEmptyState() {
    const spendingCtx = document.getElementById('spendingChart');
    const categoryCtx = document.getElementById('categoryChart');
    
    if (spendingCtx) {
        spendingCtx.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray-500); text-align: center;">
                <div>
                    <p>No spending data available</p>
                    <p style="font-size: 0.875rem;">Add some expenses to see charts</p>
                </div>
            </div>
        `;
    }
    
    if (categoryCtx) {
        categoryCtx.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray-500); text-align: center;">
                <div>
                    <p>No category data available</p>
                    <p style="font-size: 0.875rem;">Add some expenses to see breakdown</p>
                </div>
            </div>
        `;
    }
}

function createSpendingChart(transactions) {
    const ctx = document.getElementById('spendingChart');
    if (!ctx) {
        console.error('❌ spendingChart element not found');
        return;
    }
    
    // 🔥 CRITICAL: Destroy existing chart FIRST before any checks
    if (spendingChart) {
        spendingChart.destroy();
        spendingChart = null;
    }
    
    // Clear any existing content
    ctx.innerHTML = '';
    
    // Filter transactions based on current time period
    const filteredTransactions = filterTransactionsByPeriod(transactions, currentTimePeriod);
    console.log(`📈 Creating spending chart for ${currentTimePeriod}:`, {
        totalTransactions: transactions.length,
        filteredTransactions: filteredTransactions.length,
        period: currentTimePeriod
    });
    
    const { labels, data } = getSpendingData(filteredTransactions, currentTimePeriod);
    
    console.log('📊 Chart data:', { labels, data });
    
    // 🔥 FIX: Check if we have data BEFORE creating canvas
    if (data.every(value => value === 0)) {
        // Create a parent div if ctx is a canvas
        const parent = ctx.parentElement;
        
        // Remove canvas and replace with message
        ctx.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'spendingChart';
        messageDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; min-height: 300px; color: #9ca3af; text-align: center;';
        messageDiv.innerHTML = `
            <div>
                <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">No spending data for selected period</p>
                <p style="font-size: 0.875rem;">Try a different time range or add some transactions</p>
            </div>
        `;
        
        parent.appendChild(messageDiv);
        console.log('📊 Showing empty state for spending chart');
        return;
    }
    
    // 🔥 FIX: Ensure we have a canvas element
    if (ctx.tagName !== 'CANVAS') {
        const parent = ctx.parentElement;
        ctx.remove();
        
        const canvas = document.createElement('canvas');
        canvas.id = 'spendingChart';
        parent.appendChild(canvas);
        
        // Re-get the canvas element
        const newCtx = document.getElementById('spendingChart');
        createChartOnCanvas(newCtx, labels, data);
    } else {
        createChartOnCanvas(ctx, labels, data);
    }
}

function createChartOnCanvas(ctx, labels, data) {
    spendingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Daily Spending',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#f3f4f6',
                    bodyColor: '#f3f4f6',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return '₹' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    grid: {
                        color: '#374151',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9ca3af',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return '₹' + value;
                        }
                    },
                    beginAtZero: true
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function createCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) {
        console.error('❌ categoryChart element not found');
        return;
    }
    
    // 🔥 CRITICAL: Destroy existing chart FIRST
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
    
    // Clear any existing content
    ctx.innerHTML = '';
    
    // Filter transactions based on current time period
    const filteredTransactions = filterTransactionsByPeriod(transactions, currentTimePeriod);
    const categoryData = getCategorySpending(filteredTransactions);
    
    console.log(`📊 Creating category chart for ${currentTimePeriod}:`, {
        categories: categoryData.labels.length,
        totalAmount: categoryData.data.reduce((a, b) => a + b, 0)
    });
    
    // 🔥 FIX: Check if we have data BEFORE creating canvas
    if (categoryData.data.length === 0 || categoryData.data.every(value => value === 0)) {
        const parent = ctx.parentElement;
        ctx.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.id = 'categoryChart';
        messageDiv.style.cssText = 'display: flex; align-items: center; justify-content: center; height: 100%; min-height: 300px; color: #9ca3af; text-align: center;';
        messageDiv.innerHTML = `
            <div>
                <p style="font-size: 1.125rem; margin-bottom: 0.5rem;">No category data for selected period</p>
                <p style="font-size: 0.875rem;">Try a different time range or add some transactions</p>
            </div>
        `;
        
        parent.appendChild(messageDiv);
        console.log('📊 Showing empty state for category chart');
        return;
    }
    
    // 🔥 FIX: Ensure we have a canvas element
    if (ctx.tagName !== 'CANVAS') {
        const parent = ctx.parentElement;
        ctx.remove();
        
        const canvas = document.createElement('canvas');
        canvas.id = 'categoryChart';
        parent.appendChild(canvas);
        
        const newCtx = document.getElementById('categoryChart');
        createCategoryChartOnCanvas(newCtx, categoryData);
    } else {
        createCategoryChartOnCanvas(ctx, categoryData);
    }
}

function createCategoryChartOnCanvas(ctx, categoryData) {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.data,
                backgroundColor: colors,
                borderColor: '#111827',
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        padding: 15,
                        font: {
                            size: 12
                        },
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#f3f4f6',
                    bodyColor: '#f3f4f6',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return label + ': ₹' + value.toFixed(2) + ' (' + percentage + '%)';
                        }
                    }
                }
            },
            cutout: '65%'
        }
    });
}

// 🔥 COMPLETE FIX: Work entirely in UTC to avoid timezone issues
function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    
    console.log(`🕒 Filtering transactions for period: ${period}`);
    console.log(`📅 Current local time: ${now.toLocaleString()}`);
    
    // Calculate how many days back to go
    let daysBack;
    switch (period) {
        case '7days':
            daysBack = 6; // 6 days ago + today = 7 days
            break;
        case '30days':
            daysBack = 29; // 29 days ago + today = 30 days
            break;
        case '90days':
            daysBack = 89; // 89 days ago + today = 90 days
            break;
        case '1year':
            daysBack = 365; // 1 year
            break;
        default:
            daysBack = 6;
    }
    
    // Create start date by going back X days from today
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Get YYYY-MM-DD strings for comparison (timezone-independent)
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = now.toISOString().split('T')[0];
    
    console.log(`📅 Date range: ${startDateString} to ${endDateString} (inclusive)`);
    
    const filtered = transactions.filter(transaction => {
        const txDateString = new Date(transaction.date).toISOString().split('T')[0];
        const isInPeriod = txDateString >= startDateString && txDateString <= endDateString;
        const isExpense = transaction.type === 'expense';
        
        if (isInPeriod && isExpense) {
            console.log(`✅ Including: ${transaction.description || 'No description'} - ${txDateString} - ₹${transaction.amount}`);
        } else if (isExpense) {
            console.log(`❌ Excluding: ${transaction.description || 'No description'} - ${txDateString} (outside ${startDateString} to ${endDateString})`);
        }
        
        return isInPeriod && isExpense;
    });
    
    console.log(`📊 Filtered ${filtered.length} expense transactions out of ${transactions.length} total`);
    
    if (filtered.length > 0) {
        const uniqueDates = [...new Set(filtered.map(t => new Date(t.date).toISOString().split('T')[0]))];
        console.log(`📅 Unique dates in filtered data:`, uniqueDates.sort());
    } else {
        console.log('❌ No transactions found in the selected period');
        
        // Debug: Show all expense transaction dates
        const allExpenseDates = transactions
            .filter(t => t.type === 'expense')
            .map(t => new Date(t.date).toISOString().split('T')[0]);
        console.log('📅 All expense transaction dates:', allExpenseDates);
    }
    
    return filtered;
}

// Get spending data for chart based on time period
function getSpendingData(transactions, period) {
    console.log(`📈 Generating spending data for period: ${period}`);
    
    switch (period) {
        case '7days':
            // Show 7 individual days
            return getDailySpendingData(transactions, 7);
        case '30days':
            // Show 30 individual days (not weeks!)
            return getDailySpendingData(transactions, 30);
        case '90days':
            // Show weekly data for 90 days (about 13 weeks)
            return getWeeklySpendingData(transactions, 13);
        case '1year':
            // Show 12 months
            return getMonthlySpendingData(transactions, 12);
        default:
            return getDailySpendingData(transactions, 7);
    }
}

// FIXED: Get daily spending data
function getDailySpendingData(transactions, days = 7) {
    const labels = [];
    const data = [];
    
    console.log(`📈 Generating ${days} days of daily spending data from ${transactions.length} filtered transactions`);
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        // Get date string for comparison (YYYY-MM-DD)
        const dateString = date.toISOString().split('T')[0];
        
        // Create label based on number of days
        let label;
        if (days <= 7) {
            label = date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                day: 'numeric' 
            });
        } else {
            label = date.toLocaleDateString('en-US', { 
                day: 'numeric',
                month: 'short'
            });
        }
        
        labels.push(label);
        
        // 🔥 FIX: Compare date strings (YYYY-MM-DD) to avoid timezone issues
        const daySpending = transactions
            .filter(transaction => {
                const txDateString = new Date(transaction.date).toISOString().split('T')[0];
                return txDateString === dateString;
            })
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        data.push(daySpending);
        
        if (daySpending > 0) {
            console.log(`📅 ${dateString} (${label}): ₹${daySpending.toFixed(2)}`);
        }
    }
    
    console.log(`📊 Generated ${data.length} data points, ${data.filter(d => d > 0).length} with spending`);
    return { labels, data };
}

// Get weekly spending data
// Get weekly spending data - FIXED VERSION
function getWeeklySpendingData(transactions, weeks = 12) {
    const labels = [];
    const data = [];
    
    console.log(`📈 Generating ${weeks} weeks of spending data`);
    
    for (let i = weeks - 1; i >= 0; i--) {
        // Calculate week range
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        weekEnd.setHours(23, 59, 59, 999); // End of day
        
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0); // Start of day
        
        // Format label
        const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const endLabel = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const label = `${startLabel} - ${endLabel}`;
        
        labels.push(label);
        
        // Calculate total expenses for this week
        const weekSpending = transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= weekStart && transactionDate <= weekEnd;
            })
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        data.push(weekSpending);
        
        console.log(`📅 Week ${label}: ₹${weekSpending.toFixed(2)}`);
    }
    
    console.log(`📊 Final weekly data:`, { labels, data });
    return { labels, data };
}

// Get monthly spending data
function getMonthlySpendingData(transactions, months = 12) {
    const labels = [];
    const data = [];
    
    console.log(`📈 Generating ${months} months of spending data`);
    
    for (let i = months - 1; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        
        const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        
        const label = month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        labels.push(label);
        
        // Calculate total expenses for this month
        const monthSpending = transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= monthStart && transactionDate <= monthEnd;
            })
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        data.push(monthSpending);
    }
    
    return { labels, data };
}

// Helper function to get category-wise spending
function getCategorySpending(transactions) {
    const categoryMap = {};
    
    // Filter only expense transactions and group by category
    transactions
        .filter(transaction => transaction.type === 'expense')
        .forEach(transaction => {
            if (!categoryMap[transaction.category]) {
                categoryMap[transaction.category] = 0;
            }
            categoryMap[transaction.category] += transaction.amount;
        });
    
    // Convert to arrays for chart
    const labels = Object.keys(categoryMap);
    const data = Object.values(categoryMap);
    
    console.log(`📊 Category data: ${labels.length} categories, total ₹${data.reduce((a, b) => a + b, 0).toFixed(2)}`);
    
    return { labels, data };
}

// Refresh charts with current time period
function refreshChartsWithPeriod() {
    console.log(`🔄 Refreshing charts for period: ${currentTimePeriod}`);
    
    if (allTransactions.length > 0) {
        console.log(`📊 Using ${allTransactions.length} transactions for refresh`);
        initCharts(allTransactions);
    } else {
        console.log('🔄 No transactions available for chart refresh, loading data...');
        updateCharts();
    }
}

// 🔥 UPDATED: Better chart update function
async function updateCharts() {
    console.log('🔄 Updating charts...');
    
    try {
        // Use global data first
        if (window.transactions && Array.isArray(window.transactions) && window.transactions.length > 0) {
            allTransactions = window.transactions;
            console.log('✅ Using global transactions:', allTransactions.length);
            initCharts(allTransactions);
        } else {
            // Fallback to API
            const transactions = await loadChartData();
            console.log('✅ Using API transactions:', transactions.length);
            initCharts(transactions);
        }
    } catch (error) {
        console.error('Error updating charts:', error);
        showChartEmptyState();
    }
}

// ============================================
// GLOBAL EXPORTS (MUST BE AT THE END)
// ============================================

// 🔥 THESE FUNCTIONS ARE CALLED BY dashboard.js - THEY MUST EXIST!
window.refreshCharts = function() {
    console.log('🔄 refreshCharts called from dashboard');
    updateCharts();
};

window.initializeCharts = function() {
    console.log('🚀 initializeCharts called from dashboard');
    
    // Use global transactions data
    if (window.transactions && Array.isArray(window.transactions) && window.transactions.length > 0) {
        console.log('✅ Initializing charts with global transactions:', window.transactions.length);
        allTransactions = window.transactions;
        initCharts(window.transactions);
    } else {
        console.log('🔄 Global transactions not available, loading via API...');
        updateCharts();
    }
};

window.changeTimePeriod = function(period) {
    console.log(`🔄 changeTimePeriod called with: ${period}`);
    currentTimePeriod = period;
    
    // Update active button
    const periodButtons = document.querySelectorAll('.time-period-btn');
    periodButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
    
    refreshChartsWithPeriod();
};

// 🔥 ALSO EXPORT initCharts FOR DIRECT CALLING
window.initCharts = initCharts;

// 🔥 ADDED: Function to explicitly initialize charts after data loads
function initializeChartsAfterDataLoad() {
    console.log('🚀 Initializing charts after data load...');
    setTimeout(() => {
        updateCharts();
    }, 300);
}

// Export for use in other files
window.initializeChartsAfterDataLoad = initializeChartsAfterDataLoad;