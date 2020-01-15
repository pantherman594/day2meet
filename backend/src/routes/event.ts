import * as express from 'express';
import { DocumentType } from 'typegoose';
import _ from 'lodash';

import Event, { Event as IEvent } from '../models/Event';

import connectDB from '../lib/db';
import { EventNotFoundError, handleError } from '../errors/users';

const router = express.Router();

router.route('/')
  .post(async (req, res) => {
    let { title, startDate, dates } = req.body;

    console.log(req.body);

    console.log({
      title,
      startDate: new Date(startDate),
      dates: dates.map((d: number) => d === 1),
    });

    await connectDB();
    const event = await Event.create({
      title,
      startDate: new Date(startDate),
      dates: dates.map((d: number) => d === 1),
    });

    console.log('done');

    res.json({ event: event.toCleanObject() });
  });

const getEventFromUrl = async (req: EventRequest, res: express.Response, next: express.NextFunction) => {
  const eventId = (req as any).params.event_id;

  try {
    if (!eventId) throw new EventNotFoundError();

    await connectDB();
    req.reqEvent = (await Event.findById(eventId).exec()) as DocumentType<IEvent>;
    if (!req.reqEvent) throw new EventNotFoundError();

    next();
  } catch (err) {
    handleError(err, res);
  }
};

interface EventRequest extends express.Request {
  reqEvent?: DocumentType<IEvent>
  body: any;
}

router.use('/:event_id', getEventFromUrl);
router.route('/:event_id')
  .get(async (req: EventRequest, res: express.Response) => { // Get event
    res.json({ event: req.reqEvent!.toCleanObject() });
  })
  .post(async (req: EventRequest, res: express.Response) => { // User entry in event
    let { name, availability } = req.body;

    req.reqEvent!.set(`attendees.${name}`, availability.map((a: number) => a === 1));
    console.log(req.reqEvent);
    await req.reqEvent!.save();

    res.json({ event: req.reqEvent!.toCleanObject() });
  });

export default router;
