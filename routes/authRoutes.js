const express = require('express');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const router = express.Router();

const JWT_SECRET = 'JSON_T2B_SECRECT';
const JWT_EXPIRES_IN = '24h';

// POST /signup - Create new user and return JWT
router.post('/signup', async (req, res) => {
    try {
        const { username, password, email, ...profile } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                status: false,
                error: 'Username and password are required'
            });
        }

        const db = await req.mongoGateway.getDB();
        const usersCollection = db.collection('users');

        // Check if user already exists
        const existingUser = await usersCollection.findOne({ username });
        if (existingUser) {
            return res.status(409).json({
                status: false,
                error: 'Username already exists'
            });
        }

        // Create user document
        const userDoc = {
            username,
            password,
            email: email || null,
            profile: profile || {},
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await usersCollection.insertOne(userDoc);
        const userId = result.insertedId.toString();

        // Sign JWT with user ID
        const token = jwt.sign(
            { userId, username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            status: true,
            token,
            userId,
            username
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
});

// POST /login - Verify credentials and return JWT
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};

        if (!username || !password) {
            return res.status(400).json({
                status: false,
                error: 'Username and password are required'
            });
        }

        const db = await req.mongoGateway.getDB();
        const usersCollection = db.collection('users');

        // Find user by username
        const user = await usersCollection.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({
                status: false,
                error: 'Invalid credentials'
            });
        }

        const userId = user._id.toString();

        // Sign JWT with user ID
        const token = jwt.sign(
            { userId, username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            status: true,
            token,
            userId,
            username
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            error: error.message
        });
    }
});

module.exports = router;

