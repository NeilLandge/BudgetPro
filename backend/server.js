// Backend Server - server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path'); // ADD THIS LINE
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5000'],
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, 'Frontend')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});


// 👇 ADD THESE TEST ROUTES HERE 👇
app.get('/', (req, res) => {
    res.json({ 
        message: 'BudgetPro Backend is running!',
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

app.get('/api', (req, res) => {
    res.json({ 
        message: 'BudgetPro API is working!',
        endpoints: {
            auth: {
                signup: 'POST /api/auth/signup',
                verifyOtp: 'POST /api/auth/verify-otp',
                signin: 'POST /api/auth/signin',
                sendOtp: 'POST /api/auth/send-otp'
            },
            transactions: 'GET/POST/PUT/DELETE /api/transactions',
            budgets: 'GET/POST/PUT/DELETE /api/budgets',
            categories: 'GET/POST /api/categories',
            user: 'GET /api/user/profile'
        },
        documentation: 'Check README.md for API details'
    });
});
// 👆 ADD THESE TEST ROUTES HERE 👆

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/budgetpro';
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    isPro: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    otpCode: String,
    otpExpiry: Date,
    isVerified: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    description: String,
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// Budget Schema
const budgetSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    limit: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    color: String,
    createdAt: { type: Date, default: Date.now }
});

const Budget = mongoose.model('Budget', budgetSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    icon: String,
    color: String,
    type: { type: String, enum: ['income', 'expense'], required: true },
    createdAt: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Helper function to generate OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to send OTP (Mock implementation)
async function sendOTP(contact, otp, method) {
    console.log(`Sending OTP ${otp} to ${contact} via ${method}`);
    // In production, integrate with SMS/Email service like Twilio, SendGrid, etc.
    return true;
}

// ============================================
// AUTH ROUTES
// ============================================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, phone, password, method } = req.body;
        
        // Validate input
        if (!name || !password || !method) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        if (method === 'email' && !email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }
        
        if (method === 'phone' && !phone) {
            return res.status(400).json({ success: false, message: 'Phone is required' });
        }
        
        // Check if user already exists
        const existingUser = method === 'email' 
            ? await User.findOne({ email })
            : await User.findOne({ phone });
        
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: `User with this ${method} already exists` 
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        
        // Create user
        const userData = {
            name,
            password: hashedPassword,
            otpCode: otp,
            otpExpiry,
            isVerified: false
        };
        
        if (method === 'email') {
            userData.email = email;
        } else {
            userData.phone = phone;
        }
        
        const user = new User(userData);
        await user.save();
        
        // Send OTP
        const contact = method === 'email' ? email : phone;
        await sendOTP(contact, otp, method);
        
        res.json({ 
            success: true, 
            message: 'OTP sent successfully',
            userId: user._id
        });
    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify OTP
app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { email, phone, otp, method } = req.body;
        
        // Find user
        const user = method === 'email'
            ? await User.findOne({ email })
            : await User.findOne({ phone });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check OTP
        if (user.otpCode !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        
        // Check OTP expiry
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }
        
        // Verify user
        user.isVerified = true;
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        await user.save();
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, phone: user.phone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            success: true,
            message: 'Account verified successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isPro: user.isPro
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Resend OTP
app.post('/api/auth/resend-otp', async (req, res) => {
    try {
        const { email, phone, method } = req.body;
        
        // Find user
        const user = method === 'email'
            ? await User.findOne({ email })
            : await User.findOne({ phone });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Generate new OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        user.otpCode = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        
        // Send OTP
        const contact = method === 'email' ? email : phone;
        await sendOTP(contact, otp, method);
        
        res.json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, phone, password, method } = req.body;
        
        // Find user
        const user = method === 'email'
            ? await User.findOne({ email })
            : await User.findOne({ phone });
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check if user is verified
        if (!user.isVerified) {
            return res.status(403).json({ success: false, message: 'Please verify your account first' });
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid password' });
        }
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, phone: user.phone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            success: true,
            message: 'Sign in successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isPro: user.isPro
            }
        });
    } catch (error) {
        console.error('Sign in error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Send OTP for phone sign in
app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { phone } = req.body;
        
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        
        user.otpCode = otp;
        user.otpExpiry = otpExpiry;
        await user.save();
        
        // Send OTP
        await sendOTP(phone, otp, 'phone');
        
        res.json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify OTP for phone sign in
app.post('/api/auth/verify-signin-otp', async (req, res) => {
    try {
        const { phone, otp } = req.body;
        
        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Check OTP
        if (user.otpCode !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }
        
        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ success: false, message: 'OTP expired' });
        }
        
        // Clear OTP
        user.otpCode = undefined;
        user.otpExpiry = undefined;
        await user.save();
        
        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email, phone: user.phone },
            JWT_SECRET,
            { expiresIn: '30d' }
        );
        
        res.json({
            success: true,
            message: 'Sign in successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isPro: user.isPro
            }
        });
    } catch (error) {
        console.error('Verify signin OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// TRANSACTION ROUTES
// ============================================

// Get all transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.user.userId })
            .sort({ date: -1 });
        
        res.json({ success: true, data: transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
    try {
        const { type, category, amount, date, description } = req.body;
        
        if (!type || !category || !amount || !date) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const transaction = new Transaction({
            userId: req.user.userId,
            type,
            category,
            amount,
            date,
            description
        });
        
        await transaction.save();
        
        // Update budget if it's an expense
        if (type === 'expense') {
            const budget = await Budget.findOne({ 
                userId: req.user.userId, 
                category 
            });
            
            if (budget) {
                budget.spent += amount;
                await budget.save();
            }
        }
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update transaction
app.put('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const { type, category, amount, date, description } = req.body;
        
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        // Update budget if category or amount changed
        if (transaction.type === 'expense') {
            const oldBudget = await Budget.findOne({ 
                userId: req.user.userId, 
                category: transaction.category 
            });
            
            if (oldBudget) {
                oldBudget.spent -= transaction.amount;
                await oldBudget.save();
            }
            
            if (type === 'expense') {
                const newBudget = await Budget.findOne({ 
                    userId: req.user.userId, 
                    category 
                });
                
                if (newBudget) {
                    newBudget.spent += amount;
                    await newBudget.save();
                }
            }
        }
        
        transaction.type = type;
        transaction.category = category;
        transaction.amount = amount;
        transaction.date = date;
        transaction.description = description;
        
        await transaction.save();
        
        res.json({ success: true, data: transaction });
    } catch (error) {
        console.error('Update transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete transaction
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found' });
        }
        
        // Update budget if it's an expense
        if (transaction.type === 'expense') {
            const budget = await Budget.findOne({ 
                userId: req.user.userId, 
                category: transaction.category 
            });
            
            if (budget) {
                budget.spent -= transaction.amount;
                await budget.save();
            }
        }
        
        await transaction.deleteOne();
        
        res.json({ success: true, message: 'Transaction deleted' });
    } catch (error) {
        console.error('Delete transaction error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// BUDGET ROUTES
// ============================================

// Get all budgets
app.get('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const budgets = await Budget.find({ userId: req.user.userId });
        res.json({ success: true, data: budgets });
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create budget
app.post('/api/budgets', authenticateToken, async (req, res) => {
    try {
        const { category, limit, color } = req.body;
        
        if (!category || !limit) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Check if budget already exists for this category
        const existingBudget = await Budget.findOne({ 
            userId: req.user.userId, 
            category 
        });
        
        if (existingBudget) {
            return res.status(400).json({ 
                success: false, 
                message: 'Budget already exists for this category' 
            });
        }
        
        // Calculate current spent
        const transactions = await Transaction.find({
            userId: req.user.userId,
            type: 'expense',
            category
        });
        
        const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        const budget = new Budget({
            userId: req.user.userId,
            category,
            limit,
            spent,
            color: color || '#3b82f6'
        });
        
        await budget.save();
        
        res.json({ success: true, data: budget });
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update budget
app.put('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
        const { limit, color } = req.body;
        
        const budget = await Budget.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        
        if (limit) budget.limit = limit;
        if (color) budget.color = color;
        
        await budget.save();
        
        res.json({ success: true, data: budget });
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete budget
app.delete('/api/budgets/:id', authenticateToken, async (req, res) => {
    try {
        const budget = await Budget.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!budget) {
            return res.status(404).json({ success: false, message: 'Budget not found' });
        }
        
        await budget.deleteOne();
        
        res.json({ success: true, message: 'Budget deleted' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// CATEGORY ROUTES
// ============================================

// Get all categories
app.get('/api/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Category.find({ userId: req.user.userId });
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create category
app.post('/api/categories', authenticateToken, async (req, res) => {
    try {
        const { name, icon, color, type } = req.body;
        
        if (!name || !type) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        const category = new Category({
            userId: req.user.userId,
            name,
            icon,
            color: color || '#3b82f6',
            type
        });
        
        await category.save();
        
        res.json({ success: true, data: category });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// USER ROUTES
// ============================================

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password -otpCode -otpExpiry');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone } = req.body;
        
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        
        await user.save();
        
        res.json({ 
            success: true, 
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isPro: user.isPro
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Upgrade to Pro
app.post('/api/user/upgrade-pro', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        user.isPro = true;
        await user.save();
        
        res.json({ success: true, message: 'Upgraded to Pro successfully' });
    } catch (error) {
        console.error('Upgrade to Pro error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});