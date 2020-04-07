import React from "react";

const Legend = ({ steps, colorSteps }) => {
  console.log(colorSteps);
  return (
    <div className="legend">
      <div className="range">
        <span>{Math.min(...steps)}</span>
        <span># of positive cases</span>
        <span>{Math.max(...steps)}+</span>
      </div>
      <div className="color-range">
        {steps.map((step, i) => {
          return (
            <span
              className="step"
              key={step}
              style={{
                backgroundColor: colorSteps[i],
                height: 20,
                width: 25,
                flex: 1,
              }}
            ></span>
          );
        })}
      </div>
    </div>
  );
};

export default Legend;
