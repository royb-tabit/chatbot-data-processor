const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const logger = require('./config/logger');
const dataProcessor = require('./model/dataProcessor/main');


// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/status', (req, res) => {
  res.json({ message: 'Cinderella is working. so...' });
});

// post /processTDCatalog

app.post('/processTDCatalog', async (req, res) => {
    const { organisationId } = req.body;
    await dataProcessor.processTDCatalog(organisationId)
    res.status(200)
})

// Start server
const PORT = config.port || 4002;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

module.exports = app;
