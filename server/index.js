const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Database & Services
const sequelize = require('./config/database');
const User = require('./models/User');
const Report = require('./models/Report');
const EmailGroup = require('./models/EmailGroup');
const { sendReportEmail } = require('./services/emailService');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-me';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

// Trust Proxy (Crucial for Cloudflare/Nginx)
app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Rate Limiters: Increased to 100 for testing
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { error: 'Too many reports submitted, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts.' }
});

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const requireSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ error: 'Requires Super Admin privileges' });
  }
};

// --- ROUTES ---

// 1. Submit Report
app.post('/api/report', reportLimiter, upload.array('evidence'), async (req, res) => {
  try {
    const { type, location, time, date, description, latitude, longitude } = req.body;
    const files = req.files;

    // Generate Reference Number: CW-{Random4Digits} (Short & Simple)
    const randomId = Math.floor(1000 + Math.random() * 9000);
    const referenceNumber = `CW-${randomId}`;

    const report = await Report.create({
      referenceNumber,
      type,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      time,
      date,
      description,
      evidence: files.map(f => f.filename)
    });

    res.status(201).json({ message: 'Report submitted successfully', referenceNumber });
  } catch (error) {
    console.error('Error processing report:', error);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// 2. Login
app.post('/api/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// 3. Get Reports (Protected, Searchable)
app.get('/api/reports', authenticateToken, async (req, res) => {
  const { q, type } = req.query;
  
  const where = {};
  if (q) {
    where[Op.or] = [
      { description: { [Op.like]: `%${q}%` } },
      { location: { [Op.like]: `%${q}%` } },
      { referenceNumber: { [Op.like]: `%${q}%` } }
    ];
  }
  if (type) {
    where.type = type;
  }

  try {
    const reports = await Report.findAll({ 
      where,
      order: [['createdAt', 'DESC']] 
    });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

app.get('/api/report/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// 4. Email Groups (Admin+)
app.get('/api/email-groups', authenticateToken, async (req, res) => {
  try {
    const groups = await EmailGroup.findAll();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch email groups' });
  }
});

// Update Email Group (Super Admin Only)
app.put('/api/email-groups/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { emails } = req.body;
    const group = await EmailGroup.findByPk(req.params.id);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    
    group.emails = emails;
    await group.save();
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update group' });
  }
});

// 5. Forward Report (Admin+)
app.post('/api/report/:id/forward', authenticateToken, async (req, res) => {
  try {
    const { groupIds } = req.body; // Array of IDs
    const report = await Report.findByPk(req.params.id);
    if (!report) return res.status(404).json({ error: 'Report not found' });

    const groups = await EmailGroup.findAll({
      where: { id: groupIds }
    });

    if (groups.length === 0) return res.status(400).json({ error: 'No groups selected' });

    // Send emails to each group
    for (const group of groups) {
      // Create a temporary "files" object for the email service
      // In production, you'd fetch the actual file paths from the uploads dir
      const evidence = typeof report.evidence === 'string' ? JSON.parse(report.evidence) : report.evidence;
      const fileObjects = evidence.map(filename => ({
        filename,
        originalname: filename,
        path: path.join(__dirname, 'uploads', filename),
        size: fs.statSync(path.join(__dirname, 'uploads', filename)).size
      }));

      // Override the recipients for this specific forward
      const originalRecipients = process.env.EMAIL_RECIPIENTS;
      process.env.EMAIL_RECIPIENTS = group.emails;
      
      await sendReportEmail(report, fileObjects, BASE_URL);
      
      process.env.EMAIL_RECIPIENTS = originalRecipients;

      // Update history
      const history = typeof report.forwardHistory === 'string' ? JSON.parse(report.forwardHistory || '[]') : (report.forwardHistory || []);
      history.push({
        to: group.name,
        sentAt: new Date().toISOString(),
        sentBy: req.user.username
      });
      report.forwardHistory = history;
    }

    await report.save();
    res.json({ message: 'Report forwarded successfully', history: report.forwardHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to forward report' });
  }
});

// 6. Create User (Super Admin Only)
app.post('/api/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      password: hashedPassword,
      role: role || 'admin'
    });
    res.status(201).json({ message: 'User created', userId: user.id });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create user (username might be taken)' });
  }
});

// 5. Public Stats
app.get('/api/stats', async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Get all reports (optimize later if huge)
    const reports = await Report.findAll();
    
    // Filter for current year
    const thisYearReports = reports.filter(r => new Date(r.date).getFullYear() === currentYear);

    // Group by month
    const monthCounts = new Array(12).fill(0);
    thisYearReports.forEach(r => {
      const month = new Date(r.date).getMonth();
      monthCounts[month]++;
    });

    const byMonth = monthCounts.map((count, index) => ({
      month: new Date(0, index).toLocaleString('default', { month: 'short' }),
      count
    }));

    // Trend Calc
    const currentMonthIdx = now.getMonth();
    const thisMonthCount = monthCounts[currentMonthIdx];
    const lastMonthCount = currentMonthIdx > 0 ? monthCounts[currentMonthIdx - 1] : 0;
    
    let trend = 0;
    if (lastMonthCount > 0) {
      trend = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
    } else if (thisMonthCount > 0) {
      trend = 100;
    }

    res.json({
      total: thisYearReports.length,
      byMonth,
      trend: Math.round(trend),
      recent: reports.slice(-5).reverse().map(r => ({
        title: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} near ${r.location.split(',')[0]}`,
        date: r.date,
        id: r.id
      }))
    });
  } catch (error) {
    console.error(error);
    res.json({ total: 0, byMonth: [], recent: [] });
  }
});

// Start Server & Sync DB
sequelize.sync().then(async () => {
  // Create default Super Admin if none exists
  const adminCount = await User.count();
  if (adminCount === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: hashedPassword,
      role: 'superadmin'
    });
    console.log('--- DEFAULT ADMIN CREATED ---');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('-----------------------------');
  }

  // Create default Email Groups if none exist
  const groupCount = await EmailGroup.count();
  if (groupCount === 0) {
    await EmailGroup.create({ name: 'St Mungos Team', emails: 'placeholder@stmungos.org' });
    await EmailGroup.create({ name: 'Hither Green Safer Neighborhoods', emails: 'placeholder@met.police.uk' });
    console.log('--- DEFAULT EMAIL GROUPS CREATED ---');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});