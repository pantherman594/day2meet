import React from 'react';
import { css } from 'emotion';

interface IProps {
  index: number;

  year: number;
  month: number;
  date: number,
  count: number;

  color: {
    h: number;
    s: number;
    l: number;
  };
  width: number;
  height: number;
  margin: number;

  dragCoords: number[];

  setSelected: (isSelected: boolean) => void;
  onHover: () => void;
}

class DateBox extends React.PureComponent<IProps> {
  boxRef: React.RefObject<HTMLDivElement>;

  constructor(props: IProps) {
    super(props);
    this.boxRef = React.createRef<HTMLDivElement>();
  }

  isDragSelected = () => {
    const coords = this.props.dragCoords;
    if (coords.length === 0) return false;

    const dLeft = Math.min(coords[0], coords[2]);
    const dRight = Math.max(coords[0], coords[2]);
    const dTop = Math.min(coords[1], coords[3]);
    const dBottom = Math.max(coords[1], coords[3]);

    if (!this.boxRef.current) return false;
    let { left, right, top, bottom } = this.boxRef.current.getBoundingClientRect();
    left += window.scrollX;
    right += window.scrollX;
    top += window.scrollY;
    bottom += window.scrollY;

    if (right < dLeft) return false;
    if (left > dRight) return false;
    if (bottom < dTop) return false;
    if (top > dBottom) return false;
    return true;
  };

  componentDidUpdate(prevProps: IProps) {
    if (prevProps.dragCoords !== this.props.dragCoords) {
      // if drag selected, invert. otherwise, don't change
      this.props.setSelected(this.props.count === (this.isDragSelected() ? 0 : 1));
    }
  }

  render = () => {
    const c = this.props.color;

    const dateBox = css`
      width: ${this.props.width}px;
      height: ${this.props.height}px;
      margin: ${this.props.margin}px;

      background-color: hsl(${c.h}, ${c.s}%, ${c.l}%);
      cursor: ${this.props.count === -1 ? 'not-allowed' : 'inherit'};
      user-select: none;

      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const dateNum = css`
      pointer-events: none;
    `;

    return (
      <div
        className={dateBox}
        ref={this.boxRef}
        onMouseEnter={() => this.props.onHover()}
        data-cal-date={this.props.date}
      >
        <div className={dateNum}>{this.props.date > 0 ? this.props.date : ''}</div>
      </div>
    );
  };
}

export default DateBox;
