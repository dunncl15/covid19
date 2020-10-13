import React, { useState, useEffect, useRef } from 'react';
import ReactMapGL, { Source, Layer, Popup } from 'react-map-gl';
import moment from 'moment';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import * as d3 from 'd3-scale-chromatic';

import CustomMapController from './MapController';
import Legend from './Legend';
import { statesData } from './data/stateGeoData';

const colorSteps = d3.schemeOranges[9];
const steps = [0, 20, 50, 100, 300, 500, 1000, 2000, 3000];

const Map = () => {
  const [viewport, setViewport] = useState({
    latitude: 50.10798253156572,
    longitude: -107.88684615827016,
    pitch: 15,
    zoom: 3.199513301307515,
    width: '100vw',
    height: '100vh',
  });
  const timeoutRef = useRef(null);

  const today = Number(moment().format('YYYYMMDD'));
  const [playing, setPlaying] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const [totalData, setTotalData] = useState({});
  const [range, setRange] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fetch(`https://api.covidtracking.com/api/states/daily`)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
      })
      .then((data) => {
        if (!data.error) {
          const dataMap = data.reduce((acc, row) => {
            // build state object by date { AK: { 20200331: {...} } }
            return {
              ...acc,
              [row.state]: {
                ...acc[row.state],
                [row.date]: row,
              },
            };
          }, {});
          setDailyData(dataMap);
        }
      });

    fetch(`https://api.covidtracking.com/api/us/daily`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          return null;
        }
        const totalData = data.reduce((acc, row) => {
          return { ...acc, [row.date]: row };
        }, {});
        const range = data.map((d) => d.date).sort((a, b) => a - b);

        setTotalData(totalData);
        setRange(range);
        setActiveIndex(range.indexOf(Math.max(...range)));
      });
  }, []);

  useEffect(() => {
    if (!playing) {
      setPlaying(false);
      clearTimeout(timeoutRef.current);
    }

    if (playing) {
      timeoutRef.current = setTimeout(() => {
        setActiveIndex((activeIndex) =>
          activeIndex === range.length - 1 ? 0 : activeIndex + 1
        );
        return () => clearTimeout(timeoutRef.current);
      }, 500);
    }
  }, [activeIndex, playing, range, today]);

  const createSteps = () => {
    return steps.reduce((acc, step, index) => {
      const withcolor = [step, colorSteps[index]];
      return [...acc, ...withcolor];
    }, []);
  };

  const date = range[activeIndex];
  const handlePlayToggle = () => setPlaying((playing) => !playing);
  const controller = new CustomMapController();

  let mergedData;
  if (dailyData && statesData) {
    mergedData = {
      ...statesData,
      features: statesData.features.map((row) => {
        const covidData = dailyData[row.id][`${date}`] || {
          positiveIncrease: 0,
        };
        return { ...row, properties: { ...row.properties, ...covidData } };
      }),
    };
  }

  return (
    <ReactMapGL
      {...viewport}
      controller={controller}
      onViewportChange={setViewport}
      className="mapContainer"
      mapboxApiAccessToken={process.env.REACT_APP_MAP_TOKEN}
      width="100%"
      height="100%"
      onClick={(e) => {
        const [lng, lat] = e.lngLat;
        const data = e.features.find((f) => f.layer.id === 'states-join');
        if (data) setPopup({ ...data.properties, lng, lat });
      }}
    >
      {popup && (
        <Popup
          latitude={popup.lat}
          longitude={popup.lng}
          onClose={() => setPopup(null)}
        >
          <h3>{popup.name}</h3>
          <p>Data quality grade: {popup.dataQualityGrade || 'N/A'}</p>
          <p>Positive increase (day/day): {popup.positiveIncrease}</p>
          <p>Positive cases: {popup.positive}</p>
          <p>
            Last updated:{' '}
            {moment(popup.dateChecked, 'YYYY-MM-DD').format('MMMM Do, YYYY')}
          </p>
        </Popup>
      )}
      {mergedData && (
        <Source id="states" type="geojson" data={mergedData}>
          <Layer
            id="states-join"
            type="fill"
            source="states"
            paint={{
              'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'positiveIncrease'],
                ...createSteps(),
              ],
              'fill-opacity': 0.9,
            }}
            beforeId="waterway-label"
          />
        </Source>
      )}
      <div className="ctrl-panel">
        <h3 className="date">
          {moment(date, 'YYYY-MM-DD').format('MMMM Do, YYYY')}
        </h3>
        <div className="stats">
          <p>
            Total cases: <strong>{totalData[date]?.positive || 0}</strong>
          </p>
          <p>
            Total fatalities: <strong>{totalData[date]?.death || 0}</strong>
          </p>
        </div>
        <div className="slider-wrapper">
          <button
            className={playing ? 'play-pause-btn pause' : 'play-pause-btn'}
            onClick={handlePlayToggle}
          />
          <Slider
            min={0}
            max={range.length - 1}
            value={activeIndex}
            onChange={(i) => {
              if (!playing) setActiveIndex(i);
            }}
            tooltip={false}
          />
        </div>
        <Legend steps={steps} colorSteps={colorSteps} />
        {!totalData[today] && (
          <span className="data-notice">
            * Today's data will be updated b/w 4pm - 5pm EST
          </span>
        )}
      </div>
    </ReactMapGL>
  );
};

export default Map;
