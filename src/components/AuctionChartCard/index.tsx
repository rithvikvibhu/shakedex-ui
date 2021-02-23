import React, {ReactElement, useEffect, useState} from "react";
import moment from "moment";
import Card, {CardHeader} from "../Card";
import {useAuctionByTLD} from "../../ducks/auctions";
import {Auction} from "../../util/auction";
import {
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {fromDollaryDoos} from "../../util/number";

import "./auction-chart.scss";
import {useCurrentBlocktime} from "../../ducks/handshake";
import Button from "../Button";

type Props = {
  tld: string;
}

export default function AuctionChart(props: Props): ReactElement {
  const auctionState = useAuctionByTLD(props.tld);
  const currentBlocktime = useCurrentBlocktime();
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [hoverPrice, setHoverPrice] = useState(-1);
  const [hoverLocktime, setHoverLocktime] = useState('');

  const auction = new Auction(auctionState || null);
  const data = auction.getChartData();
  const startPriceTick = Number(fromDollaryDoos(auction.startPrice));
  const endPriceTick = Number(fromDollaryDoos(auction.endPrice));
  const currentPrice = auction.getCurrentPrice(currentBlocktime);
  const currentLockTime = auction.getCurrentTime(currentBlocktime);

  useEffect(() => {
    setHoverLocktime(moment(currentLockTime).format('YYYY-MM-DD HH:mm'));
    setHoverPrice(Number(fromDollaryDoos(currentPrice)));
  }, [currentPrice, currentLockTime]);

  if (!auctionState) {
    return <></>;
  }

  const adjPrice = hoverPrice || Number(fromDollaryDoos(currentPrice));
  const adjLocktime = hoverLocktime || moment(currentLockTime * 1000).format('YYYY-MM-DD HH:mm');

  return (
    <Card className="auction-chart">
      <div className="auction-chart__header">
        <div className="auction-chart__header__data-group">
          <div className="auction-chart__header__data-group__label">
            Current Price
          </div>
          <div className="auction-chart__header__data-group__value">
            {`${fromDollaryDoos(currentPrice)} HNS`}
          </div>
        </div>
        <div className="auction-chart__header__data-group">
          <div className="auction-chart__header__data-group__label">
            Current Locktime
          </div>
          <div className="auction-chart__header__data-group__value">
            {moment(currentLockTime * 1000).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
        <div className="auction-chart__header__actions">
          <Button>
            Buy Now
          </Button>
        </div>
      </div>
      <LineChart
        width={768}
        height={460.8}
        margin={{
          top: 32,
          bottom: 32,
          left: 96,
          right: 96,
        }}
        data={data}
      >
        <XAxis
          dataKey="locktime"
          interval={0}
          ticks={[data[0].locktime, adjLocktime, data[data.length - 1].locktime]}
          domain={[data[0].locktime, data[data.length - 1].locktime]}
          tick={(opts: any) => renderXTicks(opts)}
        />
        <YAxis
          type="number"
          domain={[startPriceTick, endPriceTick]}
          ticks={[startPriceTick, adjPrice, endPriceTick]}
          interval={0}
          tick={(opts: any) => renderYTicks(opts)}
        />
        <Tooltip
          content={(opts: any) => renderTooltip({
            ...opts,
            setX,
            setY,
            setHoverPrice,
            setHoverLocktime,
          })}
          cursor={false}
        />
        <ReferenceLine
          x={adjLocktime}
          stroke="#FFFFFF"
          strokeDasharray="3 3"
          strokeOpacity={0.25}
        />
        <ReferenceLine
          y={adjPrice}
          stroke="#FFFFFF"
          strokeDasharray="3 3"
          strokeOpacity={0.25}
        />
        <Line
          type="step"
          dataKey="price"
          stroke="#00B2FF"
        />
      </LineChart>
    </Card>
  )
}

const renderTooltip = (opts: {
  coordinate?: {
    x: number;
    y: number;
  };
  payload?: {
    payload: {
      locktime: string;
      price: number
    };
  }[];
  setX: (x: number) => null;
  setY: (y: number) => null;
  setHoverPrice: (hoverPrice: number) => null;
  setHoverLocktime: (hoverLocktime: string) => null;
}) => {
  const { x = 0, y = 0 } = opts.coordinate || {};
  const payloadList = opts.payload || [];
  const { price, locktime } = payloadList[0]?.payload || {};

  useEffect(() => {
    opts.setX(x);
    opts.setY(y);
    opts.setHoverPrice(price);
    opts.setHoverLocktime(locktime);
  }, [x, y, price, locktime]);

  return null;
};

const renderXTicks = (opts: {
  payload: {
    value: string;
  };
  index: number;
  x: number;
  y: number;
}) => {
  let anchor = 'start';

  if (opts.index === 2) {
    anchor = 'end';
  }

  if (opts.index === 1) {
    return (
      <foreignObject
        className="x-marker"
        x={opts.x - 80}
        y={opts.y}
        textAnchor="middle"
      >
        <div>
          {opts.payload.value}
        </div>
      </foreignObject>
    )
  }

  return (
    <g transform={`translate(0, 16)`}>
      <text
        x={opts.x}
        y={opts.y}
        textAnchor={anchor}
        fill="#666"
      >
        {opts.payload.value}
      </text>
    </g>
  );
};


const renderYTicks = (opts: {
  payload: {
    value: string;
  };
  index: number;
  x: number;
  y: number;
}) => {
  let anchor = 'end';

  if (opts.index === 1) {
    return (
      <foreignObject
        className="y-marker"
        x={opts.x - 128}
        y={opts.y - 16}
        textAnchor="middle"
      >
        <div>
          {opts.payload.value}
        </div>
      </foreignObject>
    )
  }

  return (
    <g transform={`translate(-8, 8)`}>
      <text
        x={opts.x}
        y={opts.y}
        textAnchor={anchor}
        fill="#666"
      >
        {opts.payload.value}
      </text>
    </g>
  );
};