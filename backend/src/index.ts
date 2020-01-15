import * as bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import path from 'path';
import 'reflect-metadata';

import errors from './lib/errors';

import event from './routes/event';

const {
  handleError,
} = errors;

const PORT = process.env.PORT || 5000;
const app = express();

const corsOptionsDelegate = (req: any, callback: any) => {
  let corsOptions = {
    origin: false,
    credentials: true,
  };

  const whitelist = [
    process.env.URL || 'http://localhost:3000',
  ];

  if (process.env.NODE_ENV !== 'production' || whitelist.indexOf(req.header('Origin')) !== -1) {
    corsOptions.origin = true; // reflect (enable) the requested origin in the CORS response
  }
  console.log(req.header('Origin'));

  callback(null, corsOptions); // callback expects two parameters: error and options
};

const webClient = path.join(__dirname, '..','..',  'frontend', 'build');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptionsDelegate) as any);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(webClient));
}

app.use('/api/', event);

if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(webClient, 'index.html'));
  });
}

app.use(((err: any, _req: any, res: any, _next: any) => { // Handle 500
  handleError(err, res);
}));

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}.`);
});
