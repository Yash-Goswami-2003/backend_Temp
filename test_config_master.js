const request = require('supertest');
const express = require('express');
const MongoGateway = require('./gateways/MongoGateway');
const cors = require('cors') ;

// Setup test app
const app = express();
app.use(cors({
  origin: "http://localhost:5173",   // exact frontend URL
  credentials: true,                 // allow cookies / Authorization headers
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Handle preflight OPTIONS requests
app.options('*', cors());

app.use(express.json());

const mongoURI = 'mongodb+srv://yashgoswamiyg2003:yash2902@cluster0.mttpnyr.mongodb.net/?appName=Cluster0';
const mongoGateway = new MongoGateway(mongoURI);

// Middleware to pass mongoGateway to routes
app.use((req, res, next) => {
  req.mongoGateway = mongoGateway;
  next();
});

const configMaster = require('./routes/configMaster');
app.use('/', configMaster);

async function testConfigMaster() {
  try {
    console.log('Testing config_master API...');
    
    // Test POST - Create new config
    console.log('\n1. Testing POST /config_master');
    const postResponse = await request(app)
      .post('/config_master')
      .send({
        config_type: 'TEST_CONFIG',
        data: { name: 'test', value: 123 }
      });
    
    console.log('POST Response:', postResponse.body);
    
    if (postResponse.status === 200 && postResponse.body.id) {
      console.log('POST: SUCCESS');
    } else {
      console.log('POST: FAILED');
      return;
    }
    
    // Test GET - Fetch config by type
    console.log('\n2. Testing GET /config_master?config_type=TEST_CONFIG');
    const getResponse = await request(app)
      .get('/config_master')
      .query({ config_type: 'TEST_CONFIG' });
    
    console.log('GET Response:', getResponse.body);
    
    if (getResponse.status === 200 && getResponse.body.documents) {
      console.log('GET: SUCCESS');
    } else {
      console.log('GET: FAILED');
    }
    
    console.log('\nConfig_master API test completed!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run test if called directly
if (require.main === module) {
  testConfigMaster().then(() => process.exit(0));
}

module.exports = testConfigMaster;
