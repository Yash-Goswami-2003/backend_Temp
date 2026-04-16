const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const appRoutes = require('./routes/appRoutes');
const dbRoutes = require('./routes/dbRoutes');
const configMaster = require('./routes/configMaster');
const MongoGateway = require('./gateways/MongoGateway');

const app = express();

app.use(cors({
  origin: 'https://frontend-temp-flax.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const mongoURI = 'mongodb+srv://yashgoswamiyg2003:yash2902@cluster0.mttpnyr.mongodb.net/?appName=Cluster0';
const mongoGateway = new MongoGateway(mongoURI);

app.use((req, res, next) => {
  req.mongoGateway = mongoGateway;
  next();
});

app.use('/', authRoutes);
app.use('/', configMaster);
app.use('/app', appRoutes);
app.use('/db', dbRoutes);

let isConnected = false;

const connectToDatabase = async () => {
  if (!isConnected) {
    try {
      await mongoGateway.connect();
      isConnected = true;
      console.log('MongoDB connected');
    } catch (error) {
      console.error('MongoDB connection failed:', error);
      throw error;
    }
  }
};

// For local development
if (process.env.NODE_ENV !== 'production') {
  const startServer = async () => {
    try {
      await connectToDatabase();
      app.listen(3000, () => {
        console.log('Server running on port 3000');
      });
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  };
  startServer();
}

// For Vercel serverless
module.exports = async (req, res) => {
  try {
    await connectToDatabase();
    return app(req, res);
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

