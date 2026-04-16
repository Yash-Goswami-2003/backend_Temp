const { MongoClient } = require('mongodb');

const client = new MongoClient('mongodb+srv://yashgoswamiyg2003:yash2902@cluster0.mttpnyr.mongodb.net/?appName=clustor0') ;

client.connect().then(()=>{
    console.log('Mongo DB connected') ;
})