import React from 'react';
import { css } from 'emotion';

import { mapValues } from 'lodash';

import DateBox from './Date';

const MONTHS = [
  'January', 'February',
  'March', 'April', 'May',
  'June', 'July', 'August',
  'September', 'October',
  'November', 'December',
];
const NO_COLOR = { h: 0, s: 0, l: 100 };
const DISABLED_COLOR = { h: 0, s: 0, l: 70 };

interface ITouchInfo {
  pageX: number;
  pageY: number;

  [x: string]: any;
}

interface IColor {
  h: number;
  s: number;
  l: number;
}

interface IDate {
  index: number;
  date: number;
  count: number;
}

interface IMonth {
  year: number;
  month: number;
  
  dates: IDate[];
}

interface IProps {
  editable: boolean;
  setSelected: (selected: number[]) => void;
  setHover: (hovered: number) => void;

  startDate: Date;
  counts: number[];
  dates: number[];
  color: {
    h: number | number[];
    s: number | number[];
    l: number | number[];
  };
}

interface IState {
  dragCoords: number[];
  months: IMonth[];
  tempSelect: boolean[];
  showDetails: number;
}

class Calendar extends React.PureComponent<IProps, IState> {
  state = {
    dragCoords: [],
    months: [],
    tempSelect: [],
    showDetails: -1,
  };

  shouldRecalculate = (prevProps: IProps) => {
    if (prevProps.startDate.getTime() !== this.props.startDate.getTime()) {
      return true;
    }

    if (prevProps.counts !== this.props.counts) {
      return true;
    }

    return JSON.stringify(prevProps.color) !== JSON.stringify(this.props.color);
  };

  componentDidUpdate = (prevProps: IProps) => {
    if (!this.shouldRecalculate(prevProps)) return;
    this.recalculate();
  }

  componentDidMount = () => {
    this.recalculate();
  };

  recalculate = () => {
    let currDate = new Date(this.props.startDate);
    currDate.setUTCDate(1);

    // endDate is the first day of the next month after the date range
    const endDate = new Date(this.props.startDate);
    endDate.setUTCDate(endDate.getUTCDate() + this.props.counts.length - 1);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    endDate.setUTCDate(1);

    const months: IMonth[] = [];
    let lastMonth = -1;
    let lastIndex = -1;

    let i = -1;
    let j = -1;
    while (endDate > currDate) {
      if (currDate.getUTCMonth() !== lastMonth) {
        lastMonth = currDate.getUTCMonth();

        months.push({
          month: currDate.getUTCMonth(),
          year: currDate.getUTCFullYear(),
          dates: [],
        });

        lastIndex++;

        const placeholder = {
          index: -1,
          date: -1,
          count: -1,
        };

        for (let i = 0; i < currDate.getUTCDay(); i++) {
          months[lastIndex].dates.push(placeholder);
        }
      }

      const dataObj = {
        index: -1,
        date: currDate.getUTCDate(),
        count: -1,
      };

      if (j < 0 && currDate.getTime() === this.props.startDate.getTime() && this.props.counts.length > 0) {
        i = 0;
        j = 0;
      }

      if (i >= 0 && this.props.dates[j]) {
        dataObj.index = i;
        dataObj.count = this.props.counts[i];
        i++;

        if (j >= this.props.dates.length) {
          i = -1;
          j = -1;
        }
      }
      if (j >= 0) j++;

      months[lastIndex].dates.push(dataObj);
      currDate.setUTCDate(currDate.getUTCDate() + 1);
    }

    this.setState({ months });
    if (this.props.editable) {
      const tempSelect = this.props.counts.map(c => c === 1);
      this.setState({ tempSelect });
    }
  };

  mouseDown = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!this.props.editable) return;
    if (!(parseInt((e.target as any).getAttribute('data-cal-date')) > 0)) return;
    e.preventDefault();
    e.persist();

    let touch: ITouchInfo = e as React.MouseEvent<HTMLDivElement>;
    if (!e.hasOwnProperty('pageX')) touch = (e as React.TouchEvent<HTMLDivElement>).changedTouches[0];

    const x = touch.pageX;
    const y = touch.pageY;
    this.setState({
      dragCoords: [x, y, x, y],
    });
  };

  mouseMove = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!this.props.editable) return;
    if (this.state.dragCoords.length === 0) return;
    if (!(parseInt((e.target as any).getAttribute('data-cal-date')) > 0)) return;
    e.preventDefault();
    e.persist();

    let touch: ITouchInfo = e as React.MouseEvent<HTMLDivElement>;
    if (!e.hasOwnProperty('pageX')) touch = (e as React.TouchEvent<HTMLDivElement>).changedTouches[0];

    const x = touch.pageX;
    const y = touch.pageY;
    this.setState(({dragCoords}) => ({
      dragCoords: [dragCoords[0], dragCoords[1], x, y],
    }));
  };

  mouseUp = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
    if (!this.props.editable) return;
    if (!(parseInt((e.target as any).getAttribute('data-cal-date')) > 0)) return;
    e.preventDefault();

    this.setState({
      dragCoords: [],
    });
    this.props.setSelected(this.state.tempSelect.map(b => b ? 1 : 0));
  };

  render = () => {
    let maxNum = 1;
    this.props.counts.forEach(count => {
      if (count > maxNum) maxNum = count;
    });

    const colors = (this.props.editable ? this.state.tempSelect : this.props.counts).map(count => mapValues(this.props.color, vals => {
      if (!Array.isArray(vals)) return vals;

      const start = vals[0];
      const range = vals[1] - vals[0];
      return start + range * (count / maxNum);
    }));

    const size = 40;
    const margin = 2;

    const coords = this.state.dragCoords;

    const calendarWrapper = css`
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      width: 100%;
    `;

    const calendarMonth = css`
      display: flex;
      flex-wrap: wrap;
      width: ${(size + margin * 2) * 7}px;

      cursor: ${!this.props.editable ? 'default' : (coords.length > 0 ? 'grabbing' : 'grab')};
    `;

    const monthWrapper = css`
      margin: 0 auto;
    `;

    const monthTitle = css`
      margin-top: 0.5em;
      font-weight: bold;
    `;

    const left = Math.min(coords[0], coords[2]);
    const right = Math.max(coords[0], coords[2]);
    const top = Math.min(coords[1], coords[3]);
    const bottom = Math.max(coords[1], coords[3]);

    const dragIndicator = css`
      display: ${coords.length > 0 ? 'initial' : 'none'};
      position: absolute;
      top: ${top}px;
      left: ${left}px;
      width: ${right - left}px;
      height: ${bottom - top}px;

      pointer-events: none;
      background-color: rgba(99, 154, 255, 0.5);
      border: 1px solid rgba(99, 154, 255, 0.7);
    `;

    return (
      <div
        onTouchStart={this.mouseDown}
        onTouchMove={this.mouseMove}
        onTouchEnd={this.mouseUp}
        onMouseDown={this.mouseDown}
        onMouseMove={this.mouseMove}
        onMouseUp={this.mouseUp}
        className={calendarWrapper}
      >
        <div className={dragIndicator}></div>
        {
          this.state.months.map((month: IMonth) => {
            return (
              <div className={monthWrapper} key={`${month.year}-${month.month + 1}`}>
                <div className={monthTitle}>
                  {`${MONTHS[month.month]} ${month.year}`}
                </div>

                <div className={calendarMonth}>
                  {
                    month.dates.map((date: IDate, i) => (
                      <DateBox
                        key={`${month.year}-${month.month + 1}-${i}`}
                        index={date.index}

                        year={month.year}
                        month={month.month}
                        date={date.date}
                        count={date.count}

                        color={date.date === -1 ? NO_COLOR : (date.index >= 0 ? colors[date.index] : DISABLED_COLOR)}
                        width={size}
                        height={size}
                        margin={margin}

                        dragCoords={coords}

                        setSelected={(isSelected: boolean) => {
                          const selected: boolean[] = this.state.tempSelect;
                          if (selected[date.index] === isSelected) return;

                          selected[date.index] = isSelected;
                          this.setState({ tempSelect: selected });
                        }}
                        onHover={() => {
                          if (this.props.editable || date.index === -1) return;
                          this.props.setHover(date.index);
                        }}
                      />
                    ))
                  }
                </div>
              </div>
            );
          })
        }
      </div>
    );
  };
}

export default Calendar;
