const { Queue } = require('bullmq');
const queue = new Queue('test', { connection: { host: '127.0.0.1', port: 6379, maxRetriesPerRequest: null } });
setTimeout(() => { console.log('survived 5s'); process.exit(0); }, 5000);
