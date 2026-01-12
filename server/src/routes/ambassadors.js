const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all active ambassadors (public)
router.get('/', async (req, res) => {
    try {
        const [ambassadors] = await db.query(`
            SELECT 
                ca.id,
                ca.college,
                ca.bio,
                ca.social_instagram,
                ca.social_linkedin,
                ca.approved_at,
                p.full_name,
                p.avatar_url
            FROM campus_ambassadors ca
            JOIN profiles p ON ca.user_id = p.user_id
            WHERE ca.status = 'active'
            ORDER BY ca.college ASC
        `);

        res.json(ambassadors);
    } catch (error) {
        console.error('Error fetching ambassadors:', error);
        res.status(500).json({ error: 'Failed to fetch ambassadors' });
    }
});

// Get list of colleges that already have ambassadors (public)
router.get('/colleges', async (req, res) => {
    try {
        const [colleges] = await db.query(`
            SELECT DISTINCT college 
            FROM campus_ambassadors 
            WHERE status = 'active'
            ORDER BY college ASC
        `);

        res.json(colleges.map(c => c.college));
    } catch (error) {
        console.error('Error fetching ambassador colleges:', error);
        res.status(500).json({ error: 'Failed to fetch colleges' });
    }
});

// Check if user has already applied (authenticated)
router.get('/my-application', authenticateToken, async (req, res) => {
    try {
        const [applications] = await db.query(
            'SELECT * FROM ambassador_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
            [req.user.id]
        );

        if (applications.length === 0) {
            return res.json({ hasApplied: false });
        }

        res.json({ 
            hasApplied: true, 
            application: applications[0] 
        });
    } catch (error) {
        console.error('Error checking application:', error);
        res.status(500).json({ error: 'Failed to check application status' });
    }
});

// Check if user is already an ambassador (authenticated)
router.get('/my-status', authenticateToken, async (req, res) => {
    try {
        const [ambassadors] = await db.query(
            'SELECT * FROM campus_ambassadors WHERE user_id = ?',
            [req.user.id]
        );

        if (ambassadors.length === 0) {
            return res.json({ isAmbassador: false });
        }

        res.json({ 
            isAmbassador: true, 
            ambassador: ambassadors[0] 
        });
    } catch (error) {
        console.error('Error checking ambassador status:', error);
        res.status(500).json({ error: 'Failed to check ambassador status' });
    }
});

// Submit ambassador application (authenticated)
router.post('/apply', authenticateToken, async (req, res) => {
    try {
        const { 
            college, 
            full_name, 
            phone, 
            year_of_study, 
            why_ambassador,
            social_instagram,
            social_linkedin 
        } = req.body;

        // Validation
        if (!college || !full_name || !why_ambassador) {
            return res.status(400).json({ 
                error: 'College, full name, and reason are required' 
            });
        }

        // Check if college already has an ambassador
        const [existingAmbassador] = await db.query(
            'SELECT id FROM campus_ambassadors WHERE college = ? AND status = ?',
            [college, 'active']
        );

        if (existingAmbassador.length > 0) {
            return res.status(400).json({ 
                error: 'This college already has an active ambassador' 
            });
        }

        // Check if user already has a pending application
        const [existingApplication] = await db.query(
            'SELECT id FROM ambassador_applications WHERE user_id = ? AND status = ?',
            [req.user.id, 'pending']
        );

        if (existingApplication.length > 0) {
            return res.status(400).json({ 
                error: 'You already have a pending application' 
            });
        }

        // Check if user is already an ambassador
        const [isAmbassador] = await db.query(
            'SELECT id FROM campus_ambassadors WHERE user_id = ?',
            [req.user.id]
        );

        if (isAmbassador.length > 0) {
            return res.status(400).json({ 
                error: 'You are already an ambassador' 
            });
        }

        // Get user email
        const [users] = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
        const email = users[0]?.email;

        // Create application
        const applicationId = uuidv4();
        await db.query(
            `INSERT INTO ambassador_applications 
            (id, user_id, college, full_name, email, phone, year_of_study, why_ambassador, social_instagram, social_linkedin) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                applicationId, 
                req.user.id, 
                college, 
                full_name, 
                email,
                phone || null,
                year_of_study || null,
                why_ambassador,
                social_instagram || null,
                social_linkedin || null
            ]
        );

        res.status(201).json({ 
            message: 'Application submitted successfully',
            applicationId 
        });
    } catch (error) {
        console.error('Error submitting application:', error);
        res.status(500).json({ error: 'Failed to submit application' });
    }
});

module.exports = router;
