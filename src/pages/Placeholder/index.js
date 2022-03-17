import React from "react";
import jaronPicture from "../../assets/getting-ready.jpg";
import "./Placeholder.css";

function Placeholder() {
  return (
    <div className="biggerBox">
      <div className="box">
        <img className="img" src={jaronPicture} alt="building" />
        <h2>Welcome</h2>
        <h1>Future site of Jaron's Backyard Brick Oven</h1>
        <p>Give us some time while we do some building!</p>
      </div>
    </div>
  );
}

export default Placeholder;
