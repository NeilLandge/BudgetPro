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
    
    periodButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            periodButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Update current time period
            currentTimePeriod = this.dataset.period;
            
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
    
    // Clear any existing content
    ctx.innerHTML = '';
    
    // Filter transactions based on current time period
    const filteredTransactions = filterTransactionsByPeriod(transactions, currentTimePeriod);
    const { labels, data } = getSpendingData(filteredTransactions, currentTimePeriod);
    
    // 🔥 ADDED: Check if we have data to display
    if (data.every(value => value === 0)) {
        ctx.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray-500); text-align: center;">
                <div>
                    <p>No spending data for selected period</p>
                    <p style="font-size: 0.875rem;">Try a different time range</p>
                </div>
            </div>
        `;
        return;
    }
    
    if (spendingChart) {
        spendingChart.destroy();
    }
    
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
    
    // Clear any existing content
    ctx.innerHTML = '';
    
    // Filter transactions based on current time period
    const filteredTransactions = filterTransactionsByPeriod(transactions, currentTimePeriod);
    const categoryData = getCategorySpending(filteredTransactions);
    
    // 🔥 ADDED: Check if we have data to display
    if (categoryData.data.length === 0 || categoryData.data.every(value => value === 0)) {
        ctx.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--gray-500); text-align: center;">
                <div>
                    <p>No category data for selected period</p>
                    <p style="font-size: 0.875rem;">Try a different time range</p>
                </div>
            </div>
        `;
        return;
    }
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Define colors for categories
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

// Filter transactions by time period
function filterTransactionsByPeriod(transactions, period) {
    const now = new Date();
    const startDate = new Date();
    
    switch (period) {
        case '7days':
            startDate.setDate(now.getDate() - 7);
            break;
        case '30days':
            startDate.setDate(now.getDate() - 30);
            break;
        case '90days':
            startDate.setDate(now.getDate() - 90);
            break;
        case '1year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        default:
            startDate.setDate(now.getDate() - 7);
    }
    
    return transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= now && transaction.type === 'expense';
    });
}

// Get spending data for chart based on time period
function getSpendingData(transactions, period) {
    const labels = [];
    const data = [];
    
    let daysToShow = 7; // Default
    
    switch (period) {
        case '7days':
            daysToShow = 7;
            break;
        case '30days':
            daysToShow = 30;
            break;
        case '90days':
            // For 90 days, show data by week
            return getWeeklySpendingData(transactions, 12); // 12 weeks ≈ 90 days
        case '1year':
            // For 1 year, show data by month
            return getMonthlySpendingData(transactions, 12); // 12 months
        default:
            daysToShow = 7;
    }
    
    // Generate daily data
    for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        let label;
        if (daysToShow <= 30) {
            label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else {
            label = date.toLocaleDateString('en-US', { month: 'short' });
        }
        
        labels.push(label);
        
        // Calculate total expenses for this day
        const daySpending = transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
                return transactionDate === dateString;
            })
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        data.push(daySpending);
    }
    
    return { labels, data };
}

// Get weekly spending data
function getWeeklySpendingData(transactions, weeks = 12) {
    const labels = [];
    const data = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        
        const label = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' - ' + 
                     weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        labels.push(label);
        
        // Calculate total expenses for this week
        const weekSpending = transactions
            .filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= weekStart && transactionDate <= weekEnd;
            })
            .reduce((total, transaction) => total + transaction.amount, 0);
        
        data.push(weekSpending);
    }
    
    return { labels, data };
}

// Get monthly spending data
function getMonthlySpendingData(transactions, months = 12) {
    const labels = [];
    const data = [];
    
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
    
    return { labels, data };
}

// Refresh charts with current time period
function refreshChartsWithPeriod() {
    if (allTransactions.length > 0) {
        initCharts(allTransactions);
    } else {
        console.log('🔄 No transactions available for chart refresh');
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

// 🔥 ADD THIS MISSING FUNCTION - it's being called by dashboard.js
window.initializeCharts = function() {
    console.log('🚀 Initializing charts via window.initializeCharts...');
    
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

// ============================================
// GLOBAL EXPORTS (MUST BE AT THE END)
// ============================================

// 🔥 THESE FUNCTIONS ARE CALLED BY dashboard.js - THEY MUST EXIST!
window.refreshCharts = refreshCharts;
window.initializeCharts = function() {
    console.log('🚀 Initializing charts via window.initializeCharts...');
    
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
    currentTimePeriod = period;
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

// Function to refresh charts (call this when new transactions are added)
function refreshCharts() {
    updateCharts();
}

// Export for use in other files
window.refreshCharts = refreshCharts;
window.initializeCharts = initializeChartsAfterDataLoad;
window.changeTimePeriod = function(period) {
    currentTimePeriod = period;
    refreshChartsWithPeriod();
};