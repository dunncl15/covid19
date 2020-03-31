import React, { useState, useEffect, useRef } from "react";
import ReactMapGL, { Source, Layer, Popup } from "react-map-gl";
import moment from "moment";
import Slider from "react-rangeslider";
import "react-rangeslider/lib/index.css";

// import csv from "csvtojson";
import { statesData } from "./data/stateGeoData";

const Map = () => {
  const timeoutRef = useRef(null);
  const origin = 20200304;
  const today = Number(moment().format("YYYYMMDD"));
  const [playing, setPlaying] = useState(false);
  const [date, setDate] = useState(
    Number(
      moment(today, "YYYYMMDD")
        .subtract(1, "days")
        .format("YYYYMMDD")
    )
  );
  const [maxValue, setMaxValue] = useState(0);
  const [data, setData] = useState(null);
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    fetch(`https://covidtracking.com/api/states/daily?date=${date}`)
      .then(res => {
        if (res.ok) {
          return res.json();
        }
      })
      .then(data => {
        if (!data.error) {
          const maxValue = Math.max(...data.map(d => d.positive));
          const dataMap = data.reduce((acc, row) => {
            acc[row.state] = row;
            return acc;
          }, {});
          setData(dataMap);
          // setMaxValue(maxValue);
        }
      });
  }, [date]);

  useEffect(() => {
    if (date === today) {
      console.log("STOP: ", date, today);
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

  if (data && statesData) {
    mergedData = {
      ...statesData,
      features: statesData.features.map(row => {
        const covidData = data[row.id] || { positive: 0 };
        return { ...row, properties: { ...row.properties, ...covidData } };
      })
    };
  }

  return (
    <ReactMapGL
      className="mapContainer"
      latitude={48.60288590594354}
      longitude={-95.60336648930755}
      pitch={25}
      zoom={3}
      width="100%"
      height="100%"
      mapboxApiAccessToken="pk.eyJ1IjoiZHVubmNsMTUiLCJhIjoiY2sxNnd6Mm56MWFrNzNjbnh4OG0yY3E2aSJ9.TQ-FNfFCZVE40-yKv1ADaw"
      onClick={e => {
        const [lng, lat] = e.lngLat;
        console.log({ lat, lng });
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
        <h2 className="date">
          {moment(date, "YYYY-MM-DD").format("MMMM Do, YYYY")}
        </h2>
        <div className="slider-wrapper">
          <button
            className={playing ? "play-pause-btn pause" : "play-pause-btn"}
            onClick={() => {
              setDate(origin);
              setPlaying(playing => !playing);
            }}
          />
          <Slider
            min={origin}
            max={Number(today)}
            value={date}
            onChange={val => setDate(val)}
            tooltip={false}
          />
        </div>
      </div>
      <Legend />
    </ReactMapGL>
  );
};

export default Map;

const Legend = () => {
  return (
    <div className="legend">
      <div className="legend-row">
        <span className="step first" /> 0
      </div>
      <div className="legend-row">
        <span className="step second" /> 1-100
      </div>
      <div className="legend-row">
        <span className="step third" /> 101-500
      </div>
      <div className="legend-row">
        <span className="step fourth" /> 501-1000
      </div>
      <div className="legend-row">
        <span className="step fifth" /> 1001-2000
      </div>
      <div className="legend-row">
        <span className="step sixth" /> 2001-5000
      </div>
      <div className="legend-row">
        <span className="step seventh" /> 5001-10,000
      </div>
      <div className="legend-row">
        <span className="step eigth" /> 10,001-20,000
      </div>
      <div className="legend-row">
        <span className="step nineth" /> > 20,000
      </div>
    </div>
  );
};

// fetch(
//   "https://usafactsstatic.blob.core.windows.net/public/data/covid-19/covid_confirmed_usafacts.csv"
// )
//   .then(res => {
//     if (res.ok) {
//       return res.blob();
//     }
//   })
//   .then(async data => {
//     const csvData = await data.text();
//     const json = await csv().fromString(csvData);
//     console.log(json);
//   })
//   .catch(err => console.log("err: ", err));
