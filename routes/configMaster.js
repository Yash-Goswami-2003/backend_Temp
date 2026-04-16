// configMaster.routes.js

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = 'JSON_T2B_SECRECT';

// Middleware to extract userId from Authorization header
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ status: false, error: 'Authorization token required' });
  }

  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ status: false, error: 'Invalid or expired token' });
  }
};

router.post('/config_master', authenticate, async (req, res) => {
  try {
    const { config_type, data } = req.body;
    if (!config_type) {
      return res.status(400).json({ error: "config_type is required" });
    }

    const db = await req.mongoGateway.getDB();
    const counters = db.collection("counters");

    let id = 1;
    const counter = await counters.findOne({ _id: "config_master" });
    if (counter) {
      await counters.updateOne({ _id: "config_master" }, { $inc: { seq: 1 } });
      id = counter.seq + 1;
    } else {
      await counters.insertOne({ _id: "config_master", seq: 1 });
    }

    await db.collection("config_master").insertOne({
      id,
      config_type,
      data: data || {},
      accessUsers: [req.userId],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.json({ status: true, message: "Created", id });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

router.get('/config_master', authenticate, async (req, res) => {
  try {
    const { config_type } = req.query;
    if (!config_type) {
      return res.status(400).json({ error: "config_type is required" });
    }

    const db = await req.mongoGateway.getDB();
    const docs = await db.collection("config_master").find({
      config_type,
      accessUsers: req.userId
    }).toArray();

    // Remove sensitive fields from response
    const sanitizedDocs = docs.map(doc => {
      const { accessUsers, createdAt, updatedAt, ...rest } = doc;
      return rest;
    });

    res.json({ status: true, documents: sanitizedDocs });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

router.put('/config_master/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data, config_type } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const db = await req.mongoGateway.getDB();

    // Check if user has access to this document
    const doc = await db.collection("config_master").findOne({ id });
    if (!doc) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    if (!doc.accessUsers || !doc.accessUsers.includes(req.userId)) {
      return res.status(403).json({ status: false, error: "Not authorized to update this document" });
    }

    const result = await db.collection("config_master").updateOne(
      { id },
      { $set: { ...(data && { data }), ...(config_type && { config_type }), updatedAt: new Date() } }
    );

    res.json({ status: true, message: "Updated" });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

router.get('/config_master/:id', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (!id) {
      return res.status(400).json({ error: "Invalid ID" });
    }

    const db = await req.mongoGateway.getDB();

    const doc = await db.collection("config_master").findOne({ id });

    if (!doc) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    // Check if user has access to this document
    if (!doc.accessUsers || !doc.accessUsers.includes(req.userId)) {
      return res.status(403).json({ status: false, error: "Not authorized to view this document" });
    }

    // Remove sensitive fields from response
    const { accessUsers, createdAt, updatedAt, ...sanitizedDoc } = doc;

    res.json({ status: true, document: sanitizedDoc });

  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

// ==================== Dashboard Routes (No Auth Required) ====================

// POST /dashboard - Create new dashboard with auto-generated ID
router.post('/dashboard', async (req, res) => {
  try {
    const { data } = req.body;

    const db = await req.mongoGateway.getDB();
    const counters = db.collection("counters");

    let id = 1;
    const counter = await counters.findOne({ _id: "dashboard" });
    if (counter) {
      await counters.updateOne({ _id: "dashboard" }, { $inc: { seq: 1 } });
      id = counter.seq + 1;
    } else {
      await counters.insertOne({ _id: "dashboard", seq: 1 });
    }

    await db.collection("dashboard").insertOne({
      id,
      data: data || {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    res.status(201).json({ status: true, message: "Created", id });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

// GET /dashboard/:id - Get dashboard by ID
router.get('/dashboard/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (!id) {
      return res.status(400).json({ status: false, error: "Invalid ID" });
    }

    const db = await req.mongoGateway.getDB();
    const doc = await db.collection("dashboard").findOne({ id });

    if (!doc) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    const { createdAt, updatedAt, ...sanitizedDoc } = doc;
    res.json({ status: true, document: sanitizedDoc });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

// PUT /dashboard/:id - Update dashboard by ID
router.put('/dashboard/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { data } = req.body;

    if (!id) {
      return res.status(400).json({ status: false, error: "Invalid ID" });
    }

    const db = await req.mongoGateway.getDB();

    const result = await db.collection("dashboard").updateOne(
      { id },
      { $set: { data: data || {}, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    res.json({ status: true, message: "Updated" });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

// POST /config_master/:id/comments - Add comment to a configuration
router.post('/config_master/:id/comments', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text } = req.body;
    const userId = req.userId;

    if (!id) {
      return res.status(400).json({ status: false, error: "Invalid ID" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ status: false, error: "Comment text is required" });
    }

    const db = await req.mongoGateway.getDB();

    // Check if user has access
    const doc = await db.collection("config_master").findOne({ id });
    if (!doc) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    if (!doc.accessUsers || !doc.accessUsers.includes(userId)) {
      return res.status(403).json({ status: false, error: "Not authorized" });
    }

    // Create comment object
    const comment = {
      id: Date.now().toString(),
      text: text.trim(),
      userId: userId,
      createdAt: new Date().toISOString(),
    };

    // Add comment to data.comments array
    const currentComments = doc.data?.comments || [];
    const updatedComments = [...currentComments, comment];

    const result = await db.collection("config_master").updateOne(
      { id },
      { 
        $set: { 
          "data.comments": updatedComments,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    res.json({ status: true, message: "Comment added", comment });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

// DELETE /config_master/:id/comments/:commentId - Delete a comment
router.delete('/config_master/:id/comments/:commentId', authenticate, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const commentId = req.params.commentId;
    const userId = req.userId;

    if (!id) {
      return res.status(400).json({ status: false, error: "Invalid ID" });
    }

    const db = await req.mongoGateway.getDB();

    // Check if user has access
    const doc = await db.collection("config_master").findOne({ id });
    if (!doc) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    if (!doc.accessUsers || !doc.accessUsers.includes(userId)) {
      return res.status(403).json({ status: false, error: "Not authorized" });
    }

    // Remove comment from array
    const currentComments = doc.data?.comments || [];
    const updatedComments = currentComments.filter(c => c.id !== commentId);

    const result = await db.collection("config_master").updateOne(
      { id },
      { 
        $set: { 
          "data.comments": updatedComments,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ status: false, error: "Not found" });
    }

    res.json({ status: true, message: "Comment deleted" });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
});

module.exports = router;