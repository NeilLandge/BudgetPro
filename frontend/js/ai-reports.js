// // AI Reports using Perplexity API
// const PERPLEXITY_API_KEY = 'backend/dotenv/PERPLEXITY_API_KEY'; 
// const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

// Generate AI-powered financial analysis
// Generate AI-powered financial analysis - UPDATED
async function generateAIReport(transactions, budgets) {
    try {
        // Prepare financial data summary
        const financialSummary = prepareFinancialSummary(transactions, budgets);
        
        // Create prompt for AI
        const prompt = createReportPrompt(financialSummary);
        
        // Call BACKEND API instead of Perplexity directly
        const analysis = await callBackendAIAPI(prompt);
        
        return {
            success: true,
            data: {
                summary: financialSummary,
                aiAnalysis: analysis,
                recommendations: extractRecommendations(analysis),
                insights: extractInsights(analysis)
            }
        };
    } catch (error) {
        console.error('Error generating AI report:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// FIXED: Prepare financial data for AI analysis
function prepareFinancialSummary(transactions, budgets) {
    console.log('🔍 AI Data Preparation - Input:', {
        transactionsCount: transactions?.length || 0,
        budgetsCount: budgets?.length || 0,
        sampleTransaction: transactions?.[0],
        sampleBudget: budgets?.[0]
    });

    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11 (January = 0)
    const currentYear = now.getFullYear();
    
    console.log('📅 Current date info:', {
        now: now.toString(),
        currentMonth: currentMonth,
        currentYear: currentYear,
        monthName: now.toLocaleString('default', { month: 'long' })
    });

    // Filter current month transactions - FIXED DATE HANDLING
    const currentMonthTx = (transactions || []).filter(tx => {
        if (!tx || !tx.date) {
            console.warn('⚠️ Transaction missing date:', tx);
            return false;
        }
        
        try {
            const txDate = new Date(tx.date);
            const txMonth = txDate.getMonth();
            const txYear = txDate.getFullYear();
            
            const isCurrentMonth = txMonth === currentMonth && txYear === currentYear;
            
            if (isCurrentMonth) {
                console.log('✅ Current month transaction:', {
                    date: tx.date,
                    parsedDate: txDate.toString(),
                    category: tx.category,
                    amount: tx.amount,
                    type: tx.type
                });
            }
            
            return isCurrentMonth;
        } catch (error) {
            console.error('❌ Date parsing error:', error, tx);
            return false;
        }
    });

    console.log('📊 Current month transactions found:', currentMonthTx.length);
    console.log('📋 Current month transaction details:', currentMonthTx);

    // Calculate totals from ACTUAL transactions
    const totalIncome = currentMonthTx
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    const totalExpenses = currentMonthTx
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0);

    console.log('💰 Calculated totals:', {
        totalIncome,
        totalExpenses,
        transactionCount: currentMonthTx.length
    });

    // Category breakdown from ACTUAL transactions
    const categoryBreakdown = {};
    currentMonthTx
        .filter(tx => tx.type === 'expense')
        .forEach(tx => {
            const category = tx.category || 'Uncategorized';
            const amount = parseFloat(tx.amount) || 0;
            
            if (!categoryBreakdown[category]) {
                categoryBreakdown[category] = { amount: 0, count: 0 };
            }
            categoryBreakdown[category].amount += amount;
            categoryBreakdown[category].count += 1;
        });

    console.log('📈 Category breakdown:', categoryBreakdown);

    // Budget analysis from ACTUAL budgets
    const budgetAnalysis = (budgets || []).map(budget => {
        const spent = parseFloat(budget.spent) || 0;
        const limit = parseFloat(budget.limit) || 0;
        return {
            category: budget.category,
            limit: limit,
            spent: spent,
            remaining: limit - spent,
            percentageUsed: limit > 0 ? (spent / limit) * 100 : 0
        };
    });

    console.log('🎯 Budget analysis:', budgetAnalysis);

    // Spending trends from ACTUAL transactions
    const spendingTrends = calculateSpendingTrends(transactions || []);

    const summary = {
        period: {
            month: now.toLocaleString('default', { month: 'long' }),
            year: currentYear
        },
        overview: {
            totalIncome,
            totalExpenses,
            netSavings: totalIncome - totalExpenses,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100) : 0
        },
        categoryBreakdown,
        budgetAnalysis,
        spendingTrends,
        transactionCount: currentMonthTx.length
    };

    console.log('📋 Final AI Summary:', summary);
    return summary;
}


// Calculate spending trends over last 3 months
function calculateSpendingTrends(transactions) {
    const trends = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthTx = transactions.filter(tx => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === monthDate.getMonth() && 
                   txDate.getFullYear() === monthDate.getFullYear();
        });
        
        const expenses = monthTx
            .filter(tx => tx.type === 'expense')
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        const income = monthTx
            .filter(tx => tx.type === 'income')
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        trends.push({
            month: monthDate.toLocaleString('default', { month: 'short' }),
            expenses,
            income,
            savings: income - expenses
        });
    }
    
    return trends;
}

// Create prompt for Perplexity AI
function createReportPrompt(financialSummary) {
    return `You are a professional financial advisor. Analyze the following personal finance data and provide detailed insights, recommendations, and actionable advice.

FINANCIAL DATA FOR ${financialSummary.period.month} ${financialSummary.period.year}:

Income: ₹${financialSummary.overview.totalIncome.toFixed(2)}
Expenses: ₹${financialSummary.overview.totalExpenses.toFixed(2)}
Net Savings: ₹${financialSummary.overview.netSavings.toFixed(2)}
Savings Rate: ${financialSummary.overview.savingsRate.toFixed(1)}%

SPENDING BY CATEGORY:
${Object.entries(financialSummary.categoryBreakdown)
    .map(([cat, data]) => `- ${cat}: $${data.amount.toFixed(2)} (${data.count} transactions)`)
    .join('\n')}

BUDGET STATUS:
${financialSummary.budgetAnalysis
    .map(b => `- ${b.category}: ${b.percentageUsed.toFixed(0)}% used (₹${b.spent.toFixed(2)}/₹${b.limit.toFixed(2)})`)
    .join('\n')}

3-MONTH SPENDING TREND:
${financialSummary.spendingTrends
    .map(t => `${t.month}: Income ₹${t.income.toFixed(2)}, Expenses ₹${t.expenses.toFixed(2)}, Savings ₹${t.savings.toFixed(2)}`)
    .join('\n')}

Please provide:
1. Overall Financial Health Assessment (2-3 sentences)
2. Top 3 Spending Insights (identify patterns, concerns, or positive trends)
3. Budget Performance Analysis (which budgets are doing well/poorly)
4. 5 Specific Actionable Recommendations to improve financial health
5. Spending Optimization Tips (where to cut costs without major lifestyle changes)
6. Savings Goals Suggestions based on current income

Be specific, practical, and encouraging in your advice.`;
}

// Call Perplexity API with correct model name
// CALL BACKEND API INSTEAD OF PERPLEXITY DIRECTLY
async function callBackendAIAPI(prompt) {
    try {
        console.log('📡 Calling backend AI API...');
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        // ✅ CHANGE THIS LINE - Use absolute URL with port 5000
        const response = await fetch('http://localhost:5000/api/generate-report', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ prompt })
        });

        console.log('📨 Backend response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error response:', errorText);
            throw new Error(`Backend API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Backend API success:', { 
            success: data.success,
            hasData: !!data.data 
        });

        if (!data.success) {
            throw new Error(data.message || 'Backend request failed');
        }

        // Handle the response from backend (which contains Perplexity API response)
        if (data.data && data.data.choices && data.data.choices[0] && data.data.choices[0].message) {
            return data.data.choices[0].message.content;
        } else {
            console.warn('⚠️ Unexpected response format:', data.data);
            throw new Error('Invalid response format from AI service');
        }

    } catch (error) {
        console.error('❌ Backend AI API error:', error);
        
        // More specific error messages
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Cannot connect to server. Please make sure the backend is running on port 5000.');
        } else if (error.message.includes('401')) {
            throw new Error('Authentication failed. Please sign in again.');
        } else if (error.message.includes('500')) {
            throw new Error('AI service temporarily unavailable. Please try again later.');
        }
        
        throw new Error(`AI service error: ${error.message}`);
    }
}

// Extract recommendations from AI response - FIXED to remove markdown
function extractRecommendations(analysisText) {
    const recommendations = [];
    const lines = analysisText.split('\n');
    
    let inRecommendations = false;
    lines.forEach(line => {
        if (line.toLowerCase().includes('recommendation')) {
            inRecommendations = true;
        }
        if (inRecommendations && line.trim().match(/^\d+\.|^[-•]/)) {
            // Remove markdown formatting (**) and clean up the text
            let cleanLine = line.trim()
                .replace(/^\d+\.|\s*[-•]\s*/, '') // Remove numbers and bullets
                .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold** markers
                .replace(/\*(.*?)\*/g, '$1')      // Remove *italic* markers
                .trim();
            
            if (cleanLine && !cleanLine.toLowerCase().includes('specific actionable')) {
                recommendations.push(cleanLine);
            }
        }
    });
    
    return recommendations.slice(0, 5);
}

// Extract key insights from AI response - FIXED to remove markdown
function extractInsights(analysisText) {
    const insights = [];
    const lines = analysisText.split('\n');
    
    let inInsights = false;
    lines.forEach(line => {
        if (line.toLowerCase().includes('insight')) {
            inInsights = true;
        }
        if (inInsights && line.trim().match(/^\d+\.|^[-•]/)) {
            // Remove markdown formatting (**) and clean up the text
            let cleanLine = line.trim()
                .replace(/^\d+\.|\s*[-•]\s*/, '') // Remove numbers and bullets
                .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold** markers
                .replace(/\*(.*?)\*/g, '$1')      // Remove *italic* markers
                .trim();
            
            if (cleanLine && !cleanLine.toLowerCase().includes('spending insights')) {
                insights.push(cleanLine);
            }
        }
    });
    
    return insights.slice(0, 3);
}

// Generate HTML report for display - FIXED markdown handling
function generateReportHTML(reportData) {
    const { summary, aiAnalysis, recommendations, insights } = reportData;
    
    // Clean AI analysis text from markdown
    const cleanAnalysis = aiAnalysis
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Convert **bold** to <strong>
        .replace(/\*(.*?)\*/g, '<em>$1</em>')            // Convert *italic* to <em>
        .split('\n')
        .map(para => para.trim())
        .filter(para => para.length > 0)
        .map(para => `<p>${para}</p>`)
        .join('');
    
    return `
        <div class="ai-report">
            <div class="report-section">
                <h3>📊 Financial Overview - ${summary.period.month} ${summary.period.year}</h3>
                <div class="overview-stats">
                    <div class="overview-stat">
                        <span class="stat-label">Total Income</span>
                        <span class="stat-value income">₹${summary.overview.totalIncome.toFixed(2)}</span>
                    </div>
                    <div class="overview-stat">
                        <span class="stat-label">Total Expenses</span>
                        <span class="stat-value expense">₹${summary.overview.totalExpenses.toFixed(2)}</span>
                    </div>
                    <div class="overview-stat">
                        <span class="stat-label">Net Savings</span>
                        <span class="stat-value ${summary.overview.netSavings >= 0 ? 'positive' : 'negative'}">
                            ₹${summary.overview.netSavings.toFixed(2)}
                        </span>
                    </div>
                    <div class="overview-stat">
                        <span class="stat-label">Savings Rate</span>
                        <span class="stat-value">${summary.overview.savingsRate.toFixed(1)}%</span>
                    </div>
                </div>
            </div>

            <div class="report-section">
                <h3>💡 Key Insights</h3>
                <div class="insights-list">
                    ${insights.map(insight => `
                        <div class="insight-item">
                            <span class="insight-icon">✓</span>
                            <span>${insight}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-section">
                <h3>🎯 Recommendations</h3>
                <div class="recommendations-list">
                    ${recommendations.map((rec, index) => `
                        <div class="recommendation-item">
                            <span class="rec-number">${index + 1}</span>
                            <span>${rec}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-section">
                <h3>📈 Spending Trends</h3>
                <div class="trends-chart">
                    ${summary.spendingTrends.map(trend => `
                        <div class="trend-item">
                            <div class="trend-month">${trend.month}</div>
                            <div class="trend-bars">
                                <div class="trend-bar income" style="width: ${(trend.income / Math.max(...summary.spendingTrends.map(t => t.income))) * 100}%">
                                    <span>₹${trend.income.toFixed(0)}</span>
                                </div>
                                <div class="trend-bar expense" style="width: ${(trend.expenses / Math.max(...summary.spendingTrends.map(t => t.expenses))) * 100}%">
                                    <span>₹${trend.expenses.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-section">
                <h3>📝 Full AI Analysis</h3>
                <div class="ai-analysis-text">
                    ${cleanAnalysis}
                </div>
            </div>
        </div>
    `;
}

// Export detailed PDF report
async function exportDetailedReport(reportData) {
    const { summary, aiAnalysis } = reportData;
    
    // Create detailed report content
    const reportContent = `
BUDGETPRO FINANCIAL REPORT
Generated on: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════

EXECUTIVE SUMMARY - ${summary.period.month} ${summary.period.year}
═══════════════════════════════════════════════════════════

Total Income:        ₹${summary.overview.totalIncome.toFixed(2)}
Total Expenses:      ₹${summary.overview.totalExpenses.toFixed(2)}
Net Savings:         ₹${summary.overview.netSavings.toFixed(2)}
Savings Rate:        ${summary.overview.savingsRate.toFixed(1)}%

═══════════════════════════════════════════════════════════
SPENDING BREAKDOWN BY CATEGORY
═══════════════════════════════════════════════════════════

${Object.entries(summary.categoryBreakdown)
    .sort(([,a], [,b]) => b.amount - a.amount)
    .map(([cat, data]) => 
        `${cat.padEnd(25)} ₹${data.amount.toFixed(2).padStart(10)}  (${data.count} transactions)`
    ).join('\n')}

═══════════════════════════════════════════════════════════
BUDGET PERFORMANCE
═══════════════════════════════════════════════════════════

${summary.budgetAnalysis.map(b => 
    `${b.category.padEnd(25)} ${b.percentageUsed.toFixed(0)}% used
    Spent: ₹${b.spent.toFixed(2)} / ₹${b.limit.toFixed(2)}
    Remaining: ₹${b.remaining.toFixed(2)}
    Status: ${b.percentageUsed >= 100 ? '⚠️ EXCEEDED' : b.percentageUsed >= 90 ? '⚠️ WARNING' : '✓ ON TRACK'}
`).join('\n')}

═══════════════════════════════════════════════════════════
3-MONTH SPENDING TRENDS
═══════════════════════════════════════════════════════════

${summary.spendingTrends.map(t => 
    `${t.month.padEnd(10)} Income: ₹${t.income.toFixed(2).padStart(10)}  Expenses: ₹${t.expenses.toFixed(2).padStart(10)}  Savings: ₹${t.savings.toFixed(2).padStart(10)}`
).join('\n')}

═══════════════════════════════════════════════════════════
AI-POWERED FINANCIAL ANALYSIS
═══════════════════════════════════════════════════════════

${aiAnalysis}

═══════════════════════════════════════════════════════════
END OF REPORT
═══════════════════════════════════════════════════════════

This report was generated using AI-powered analysis to provide
personalized financial insights and recommendations.

For questions or support, please contact: support@budgetpro.com
    `;
    
    // Create and download the report as a text file
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BudgetPro_Financial_Report_${summary.period.month}_${summary.period.year}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make functions globally accessible
window.generateAIReport = generateAIReport;
window.generateReportHTML = generateReportHTML;
window.exportDetailedReport = exportDetailedReport;