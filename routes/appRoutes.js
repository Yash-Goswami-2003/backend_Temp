const express = require('express');
const { dashboardConfig } = require('../configs.js');
const router = express.Router();

// /app route
router.get('/app', (req, res) => {
    const {
        config_type = 'OPTIONS'
    } = req.query ?? {};

    if (config_type == 'DASHBOARD') {
        res.send({ ...dashboardConfig, pk: 2 });
    } else {
        res.send({
            message: 'Error Not Authorised',
            ErrorStatus: 245
        });
    }
});

module.exports = router;

