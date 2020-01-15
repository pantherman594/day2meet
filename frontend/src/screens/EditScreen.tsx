import React, { useState } from 'react';
import { css } from 'emotion';
import { toPairs } from 'lodash';
import { API_URL } from '../constants';

import axios from 'axios';

import Calendar from '../components/Calendar';

interface IProps {
  match: any;
}

const EditScreen: React.FC<IProps> = (props) => {
  const [ event, setEvent ] = useState<any>(false);
  const [ counts, setCounts ] = useState<Array<number>>([]);
  const [ name, setName ] = useState<boolean | string>(false);
  const [ tempName, setTempName ] = useState<string>('');
  const [ selectedDates, setSelectedDates ] = useState<Array<number>>([]);
  const [ showDetails, setShowDetails ] = useState(0);

  const updateSelectedDates = (event: any, name: string) => {
    if (event.attendees[name]) {
      setSelectedDates(event.attendees[name]);
    } else {
      const allBlank: number[] = [];
      for (let i = 0; i < event.dates.length; i++) {
        if (event.dates[i]) allBlank.push(0);
      }
      setSelectedDates(allBlank);
    }
  };

  const processEvent = (event: any) => {
    event.startDate = new Date(event.startDate);
    setEvent(event);

    if (name && typeof name === 'string') {
      updateSelectedDates(event, name);
    }

    const attendeesByDate: string[][] = [];
    for (let i = 0; i < event.dates.length; i++) {
      if (event.dates[i]) attendeesByDate.push([]);
    }

    toPairs(event.attendees).forEach(([name, availability]: [string, any]) => {
      (availability as number[]).forEach((count, i) => {
        if (count) attendeesByDate[i].push(name);
      });
    });

    setCounts(attendeesByDate.map(list => list.length));
  };

  if (event === false) {
    const eventId = props.match.params.event_id;
    setEvent(null);
    (async () => {
      const resp = await axios.get(`${API_URL}/${eventId}`);
      processEvent(resp.data.event);
    })();
  }

  if (!event) {
    return null;
  }

  const page = css`
    width: 80%;
    max-width: 1200px;
    margin: 3em auto;
  `;

  const title = css`
    text-align: center;
    font-size: 40px;
  `;

  const subtitle = css`
    text-align: center;
    font-size: 20px;
    margin: 1em auto;
  `;

  const paneWrapper = css`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    flex-wrap: wrap;
    width: 100%;
  `;

  const pane = css`
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `;

  const mainPane = css`
    min-width: 330px;
    max-height: 75vh;
    overflow-y: auto;

    @media (max-width: 1237px) {
      max-height: 67vh;
    }

    @media (min-height: 700px) {
      max-height: 80vh;
    }

    @media (min-height: 800px) {
      max-height: 85vh;
    }
  `;

  const hint = css`
    font-size: 12px;
    margin: 0.5em;
  `;

  return (
    <div className={page}>
      <div className={title}>{event.title}</div>
      <div className={paneWrapper}>
        <div className={css(pane, mainPane)}>
          <div className={subtitle}>{name ? `${name}'s` : 'Edit'} availability</div>
          { name !== false
              ? (
                <React.Fragment>
                  <div className={hint}>Click and drag to toggle availability. Saved immediately.</div>
                  <Calendar
                    editable={true}
                    setSelected={(selected: number[]) => {
                      setSelectedDates(selected);
                      (async () => {
                        const resp: any = await axios.post(`${API_URL}/${event._id}`, {
                          name,
                          availability: selected,
                        });
                        const updatedEvent = resp.data.event;
                        updatedEvent.attendees[name as string] = selected;
                        processEvent(updatedEvent);
                      })();
                    }}
                    setHover={() => {}}
                    startDate={event.startDate}
                    counts={selectedDates}
                    dates={event.dates}
                    color={{ h: 110, s: 100, l: [100, 50] }}
                  />
                </React.Fragment>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setName(tempName);
                  updateSelectedDates(event, tempName);
                }}>
                  <input placeholder='Your name' value={tempName} onChange={e => {
                    setTempName(e.target.value);
                  }} />
                  <input type='submit' value='Submit' />
                </form>
              )
          }
        </div>
        <div className={css(pane, mainPane)}>
          <div className={subtitle}>Group's availability</div>
          <Calendar
            editable={false}
            setSelected={() => {}}
            setHover={setShowDetails}
            startDate={event.startDate}
            counts={counts}
            dates={event.dates}
            color={{ h: 110, s: 100, l: [100, 50] }}
          />
        </div>
        { showDetails === -1 ? null : (
          <div className={css(pane, mainPane)}>
            <div className={subtitle}>
              {counts[showDetails]} / {Object.keys(event.attendees).length} available
            </div>
            <div className={hint}>
              {
                (() => {
                  let i = 0;
                  let j = 0;
                  while (i < showDetails) {
                    if (event.dates[j]) i++;
                    j++;
                  }

                  const currDate = new Date(event.startDate);
                  currDate.setUTCDate(currDate.getUTCDate()  + j);
                  currDate.setUTCMinutes(currDate.getTimezoneOffset());

                  return currDate.toLocaleDateString();
                })()
              }
            </div>
            <div className={paneWrapper}>
              <div className={pane}>
                <div><strong>Available</strong></div>
                {
                  toPairs(event.attendees).map(([attendeeName, availability]) =>
                    (availability as any)[showDetails] === 1 ? <div key={attendeeName}>{attendeeName}</div> : null)
                }
              </div>
              <div className={pane}>
                <div><strong>Unavailable</strong></div>
                {
                  toPairs(event.attendees).map(([attendeeName, availability]) =>
                    (availability as any)[showDetails] !== 1 ? <div key={attendeeName}>{attendeeName}</div> : null)
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditScreen;
