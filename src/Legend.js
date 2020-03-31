import React from "react";

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

export default Legend;
