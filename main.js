const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const appRoutes = require('./routes/appRoutes');
const dbRoutes = require('./routes/dbRoutes');
const configMaster = require('./routes/configMaster');
const MongoGateway = require('./gateways/MongoGateway');

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
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

const startServer = async () => {
  try {
    await mongoGateway.connect();
    app.listen(3000, () => {
      console.log('Server running on port 3000');
    });
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

startServer();

