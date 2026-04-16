const { MongoClient } = require('mongodb');

class MongoGateway {
    constructor(uri) {
        this.uri = uri;
        this.client = null;
    }

    async connect() {
        try {
            this.client = new MongoClient(this.uri);
            await this.client.connect();
            return this.client;
        } catch (error) {
            throw error;
        }
    }

    async getDB() {
        if (!this.client) {
            await this.connect();
        }
        return this.client.db('app');
    }
}

module.exports = MongoGateway;
