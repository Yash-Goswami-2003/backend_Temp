const express = require('express');
const router = express.Router();

// GET /db/list - List databases
router.get('/list', async (req, res) => {
  try {
    const dbs = await mongoGateway.listDatabases();
    res.json({ databases: dbs.databases.map(db => db.name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /db/VelocityFlow/collections - List collections in VelocityFlow
router.get('/VelocityFlow/collections', async (req, res) => {
  try {
    const collections = await mongoGateway.listCollections('VelocityFlow');
    res.json({ collections: collections.map(c => c.name) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /db/VelocityFlow/Flow/docs - List documents in Flow (limit 10)
router.get('/VelocityFlow/Flow/docs', async (req, res) => {
  try {
    const docs = await mongoGateway.listDocuments('VelocityFlow', 'Flow', 10);
    res.json({ documents: docs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

