import {
  prop,
  mapProp,
  DocumentType,
  getModelForClass,
} from 'typegoose';

import { mapValues, fromPairs } from 'lodash';
import shortid from 'shortid';

export class Event {
  @prop({ default: shortid.generate })
  _id!: string;

  @prop({ required: true })
  title!: string;

  @prop({ required: true })
  startDate!: Date;

  @prop({ required: true, default: [] })
  dates!: number[]; // array of date offsets

  @mapProp({ of: Array, required: true, default: new Map() })
  attendees!: Map<string, Array<boolean>>;

  toCleanObject(this: DocumentType<Event>) {
    const obj = this.toObject();
    obj.dates = obj.dates.map((d: boolean) => d ? 1 : 0);
    obj.attendees = mapValues(fromPairs([...obj.attendees]), (avail: boolean[]) => avail.map((d: boolean) => d ? 1 : 0));
    return obj;
  }
}

const EventModel = getModelForClass(Event);
export default EventModel;
