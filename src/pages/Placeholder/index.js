import React from 'react';
import jaronPicture from '../../assets/getting-ready.jpg';
import Map from '../../components/Map';

const Placeholder = () => {
  const location = {
    address: '156 East 550 North Bountiful, UT 84010',
    lat: 40.89523,
    lng: -111.87739,
  };

  return (
    <>
      <div className="bg-white mt-8 w-2/3 m-auto">
        <div className="p-8">
          <div>picture of oven and me</div>
          <div>Location: My Backyard - 156 East 550 North, Bountiful UT</div>
          <div>Price: $5</div>
          <div>pictures of pizza</div>
          <div>menu and ordering TBA</div>
        </div>
      </div>
      <Map location={location} zoomLevel={19} />
    </>
  );
};

export default Placeholder;
