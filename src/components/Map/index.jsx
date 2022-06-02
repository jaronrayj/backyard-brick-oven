import React from 'react';
import GoogleMapReact from 'google-map-react';
import './MapStyles.css';
// import LocationPin from '../LocationPin';

import { Icon } from '@iconify/react';
import locationIcon from '@iconify/icons-mdi/map-marker';
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const LocationPin = ({ text }) => (
  <div className="pin">
    <Icon icon={locationIcon} className="pin-icon" />
    <a
      href="https://goo.gl/maps/sQ3ZoUpVgMqc2aZg8"
      target="_blank"
      rel="noreferrer"
    >
      <p className="pin-text">{text}</p>
    </a>
  </div>
);

const Map = ({ location, zoomLevel }) => (
  <div className="map">
    <h2 className="map-h2">Find Us in the Backyard!</h2>

    <div className="google-map">
      <GoogleMapReact
        bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
        defaultCenter={location}
        defaultZoom={zoomLevel}
      >
        <LocationPin
          lat={location.lat}
          lng={location.lng}
          text={location.address}
        />
      </GoogleMapReact>
    </div>
  </div>
);

export default Map;
