import bluebird from 'bluebird';
import mongoose from 'mongoose';

(mongoose as any).Promise = bluebird;

let isConnected: boolean | number = false;
const resolveStack: any[] = [];

const connectDB = () => {
  return new Promise((resolve, _reject) => {
    if (resolveStack.length > 0) {
      console.log('Mongo DB: Waiting for connection to establish.');
      return resolveStack.push(resolve);
    }

    if (isConnected) {
      console.log('Mongo DB: Using existing database connection.');
      return resolve();
    }

    console.log('Mongo DB: Creating new database connection.');
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useFindAndModify', false);
    mongoose.set('useCreateIndex', true);
    mongoose.set('useUnifiedTopology', true);

    resolveStack.push(resolve);
    mongoose.connect(
      process.env.DB_URL || 'mongodb://localhost:27017/d2m',
    )
      .then((db) => {
        console.log(`MongoDB: Connected. Resolving ${resolveStack.length} queued connections.`);
        isConnected = db.connections[0].readyState;
        while (resolveStack.length > 0) {
          (resolveStack.pop())();
        }
      });
  });
};

export default connectDB;
