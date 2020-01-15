import React, { useState } from 'react';
import { css } from 'emotion';
import { API_URL } from '../constants';

import axios from 'axios';

import Calendar from '../components/Calendar';

const CreateScreen: React.FC = () => {
  const currYear = new Date().getFullYear();
  const initialYears = [];
  for (let i = -5; i <= 10; i++) {
    initialYears.push(currYear + i);
  }
  const initialSelected = [];
  for (let i = 0; i < 50; i++) {
    initialSelected.push(0);
  }

  const [ title, setTitle ] = useState('');
  const [ years, setYears ] = useState(initialYears);
  const [ year, setYear ] = useState(currYear);
  const [ startDate, setStartDate ] = useState(new Date(`${currYear}-01-01`));
  const [ selected, setSelected ] = useState<Array<number>>(initialSelected);
  const [ dates, setDates ] = useState<Array<number>>(initialSelected.map(() => 1));
  const [ errors, setErrors ] = useState('');

  const page = css`
    width: 80%;
    max-width: 1200px;
    margin: 3em auto;
  `;

  const titleStyle = css`
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
  `;

  const error = css`
    color: red;
  `;

  const moreDates = (num: number) => () => {
    const newSelected = [...selected];
    for (let i = 0; i < num; i++) {
      newSelected.push(0);
    }
    setSelected(newSelected);
    setDates(newSelected.map(() => 1));
  };

  return (
    <div className={page}>
      <div className={titleStyle}>Create Event</div>
      <div className={paneWrapper}>
        <div className={css(pane, mainPane)}>
          <div className={subtitle}>Settings</div>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (title === '') {
              setErrors('Please provide a title');
              return;
            }

            const first = selected.indexOf(1);
            const last = selected.lastIndexOf(1);
            const trimmedSelected = selected.slice(first, last + 1);

            if (trimmedSelected.length === 0) {
              setErrors('Please select dates on the right.');
              return;
            }

            const start = new Date(startDate);
            start.setUTCDate(first + 1);

            const resp: any = await axios.post(API_URL, {
              title,
              startDate: start,
              dates: trimmedSelected,
            });
            const id = resp.data.event._id;
            window.location.href = `/${id}`;
          }}>
            Title: <input placeholder='Title' value={title} onChange={e => {
              setTitle(e.target.value);
            }} /><br />
            Starting Year: <select value={year} onChange={e => {
              if (e.target.value === 'after') {
                const starting = years[years.length - 1];
                const newYears = [...years];
                for (let i = 1; i <= 10; i++) {
                  newYears.push(starting + i);
                }
                setYears(newYears);
                return;
              }
              if (e.target.value === 'before') {
                const starting = years[0];
                const newYears = [...years];
                for (let i = 1; i <= 10; i++) {
                  newYears.unshift(starting - i);
                }
                setYears(newYears);
                return;
              }
              setYear(parseInt(e.target.value));
              setStartDate(new Date(`${e.target.value}-01-01`));
            }}>
              <option value='before'>-- more --</option>
              { years.map(year => <option value={year} key={year}>{year}</option>) }
              <option value='after'>-- more --</option>
            </select><br /><br />
            <input type='submit' value='Create' />
          </form>
          <div className={error}>{errors}</div>
        </div>
        <div className={css(pane, mainPane)}>
          <div className={subtitle}>Possible Dates</div>
          <Calendar
            editable={true}
            setSelected={setSelected}
            setHover={() => {}}
            startDate={startDate}
            counts={selected}
            dates={dates}
            color={{ h: 110, s: 100, l: [100, 50] }}
          />
          <button onClick={moreDates(50)}>More</button>
          <button onClick={moreDates(100)}>Even More</button>
        </div>
      </div>
    </div>
  );
};

export default CreateScreen;
