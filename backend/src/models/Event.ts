import {
  prop,
  mapProp,
  instanceMethod,
  InstanceType,
  Typegoose,
} from 'typegoose';

import { mapValues } from 'lodash';
import shortid from 'shortid';

export class Event extends Typegoose {
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

  @instanceMethod
  toCleanObject(this: InstanceType<Event>) {
    const obj = this.toObject();
    obj.dates = obj.dates.map((d: boolean) => d ? 1 : 0);
    obj.attendees = mapValues(obj.attendees, (avail: boolean[]) => avail.map((d: boolean) => d ? 1 : 0));
    return obj;
  }
}

const EventModel = new Event().getModelForClass(Event);
export default EventModel;
