import React, { useState, useEffect, useRef } from "react";
import ReactMapGL, { Source, Layer, Popup } from "react-map-gl";
import moment from "moment";
import Slider from "react-rangeslider";
import "react-rangeslider/lib/index.css";

import Legend from "./Legend";
import { statesData } from "./data/stateGeoData";

const Map = () => {
  const [viewport, setViewport] = useState({
    latitude: 50.10798253156572,
    longitude: -107.88684615827016,
    pitch: 15,
    zoom: 3.199513301307515,
    width: "100vw",
    height: "100vh"
  });
  const timeoutRef = useRef(null);
  const origin = 20200304; // First day API data is available
  const today = Number(moment().format("YYYYMMDD"));
  const [date, setDate] = useState(today);

  const [playing, setPlaying] = useState(false);
  // Todo: utilize maxValue for meaningful data steps
  const [maxValue, setMaxValue] = useState(0);
  const [hasLatestData, setHasLatestData] = useState(false);
  const [dailyData, setDailyData] = useState(null);
  const [totalData, setTotalData] = useState({});
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    // Check if today's data has been published yet
    if (date === today) {
      fetch(`https://covidtracking.com/api/states/daily?date=${today}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            setDate(
              Number(
                moment(today, "YYYYMMDD")
                  .subtract(1, "days")
                  .format("YYYYMMDD")
              )
            );
          } else {
            setHasLatestData(true);
          }
        });
    }
  }, [date, today]);

  useEffect(() => {
    fetch(`https://covidtracking.com/api/states/daily`)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
      })
      .then(data => {
        if (!data.error) {
          // const maxValue = Math.max(...data.map(d => d.positive));
          const dataMap = data.reduce((acc, row) => {
            // build state object by date { AK: { 20200331: {...} } }
            return {
              ...acc,
              [row.state]: {
                ...acc[row.state],
                [row.date]: row
              }
            };
          }, {});
          setDailyData(dataMap);
          // setMaxValue(maxValue);
        }
      });

    fetch(`https://covidtracking.com/api/us/daily`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          return null;
        }
        const totalData = data.reduce((acc, row) => {
          return { ...acc, [row.date]: row };
        }, {});
        setTotalData(totalData);
      });
  }, []);

  useEffect(() => {
    if (date === today) {
      setPlaying(false);
      clearTimeout(timeoutRef.current);
    }
    if (playing) {
      timeoutRef.current = setTimeout(() => {
        setDate(
          Number(
            moment(date, "YYYYMMDD")
              .add(1, "days")
              .format("YYYYMMDD")
          )
        );
        return () => clearTimeout(timeoutRef.current);
      }, 500);
    }
  }, [date, playing, today]);

  let mergedData;

  if (dailyData && statesData) {
    mergedData = {
      ...statesData,
      features: statesData.features.map(row => {
        const covidData = dailyData[row.id][`${date}`] || { positive: 0 };
        return { ...row, properties: { ...row.properties, ...covidData } };
      })
    };
  }

  console.log(mergedData);

  const handlePlayToggle = () => {
    const latest = hasLatestData
      ? today
      : Number(
          moment(today, "YYYYMMDD")
            .subtract(1, "days")
            .format("YYYYMMDD")
        );
    let dateToSet;
    if (playing) {
      dateToSet = date;
    } else {
      dateToSet = date === latest ? origin : date;
    }
    setDate(dateToSet);
    setPlaying(playing => !playing);
  };

  return (
    <ReactMapGL
      {...viewport}
      onViewportChange={setViewport}
      className="mapContainer"
      mapboxApiAccessToken={process.env.REACT_APP_MAP_TOKEN}
      onClick={e => {
        const [lng, lat] = e.lngLat;
        const data = e.features.find(f => f.layer.id === "states-join");
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
          <p>Positive cases: {popup.positive}</p>
          <p>
            Last updated:{" "}
            {moment(popup.dateChecked, "YYYY-MM-DD").format("MMMM Do, YYYY")}
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
              "fill-color": [
                "interpolate",
                ["linear"],
                ["get", "positive"],
                0,
                "#FFF",
                1,
                "#F1F1CD",
                100,
                "#EED78D",
                500,
                "#F3C11B",
                1000,
                "#DA9C20",
                2000,
                "#CF8124",
                5000,
                "#CB682C",
                10000,
                "#7B2320",
                20000,
                "#591302"
              ]
            }}
            beforeId="waterway-label"
          />
        </Source>
      )}
      <div className="ctrl-panel">
        <h3 className="date">
          {moment(date, "YYYY-MM-DD").format("MMMM Do, YYYY")}
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
            className={playing ? "play-pause-btn pause" : "play-pause-btn"}
            onClick={handlePlayToggle}
          />
          <Slider
            min={origin}
            max={
              hasLatestData
                ? today
                : Number(
                    moment(today, "YYYYMMDD")
                      .subtract(1, "days")
                      .format("YYYYMMDD")
                  )
            }
            value={date}
            onChange={val => setDate(val)}
            tooltip={false}
          />
        </div>
        {!hasLatestData && (
          <span className="data-notice">
            * Today's data will be updated b/w 4pm - 5pm EST
          </span>
        )}
      </div>
      <Legend />
    </ReactMapGL>
  );
};

export default Map;
