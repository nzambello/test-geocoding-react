import React, { useState, useCallback, useEffect } from "react";
import { Map, TileLayer, Marker, Popup } from "react-leaflet";
import uniqBy from "lodash.uniqby";
import "./App.css";

const useDebouncedEffect = (effect, delay, deps) => {
  const callback = useCallback(effect, deps);

  useEffect(() => {
    const handler = setTimeout(() => {
      callback();
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [callback, delay]);
};

const OSMMap = ({ venue, zoom = 15 }) => {
  const position = [venue.lat, venue.lng];

  return (
    <Map center={position} zoom={zoom} id="geocoded-result">
      <TileLayer
        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>{venue.address}</Popup>
      </Marker>
    </Map>
  );
};

const App = () => {
  const [searchAddress, setSearchAddress] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [venue, setVenue] = useState(null);

  const doSearch = async () => {
    try {
      const response = await fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${searchAddress}&outFields=Match_addr,Addr_type`
      );
      const data = await response.json();
      const results = uniqBy(
        (data?.candidates ?? []).map(candidate => ({
          ...candidate,
          key: `${candidate.location?.y ?? 0} ${candidate.location?.x ?? 0}`
        })),
        "key"
      );
      setSearchSuggestions(results);
    } catch (err) {
      console.error(err);
    }
  };

  useDebouncedEffect(() => doSearch(), 600, [searchAddress]);

  return (
    <div className="App">
      <header className="App-header">
        <div className="autosuggest-address" style={{ position: "relative" }}>
          <input
            type="text"
            value={searchAddress}
            onChange={e => setSearchAddress(e.target.value)}
            placeholder="Type an address..."
            style={{ height: 40 }}
          />
          <button
            onClick={() => {
              setVenue(null);
              setSearchAddress("");
              setSearchSuggestions([]);
            }}
          >
            Clear
          </button>
          {searchSuggestions?.length > 0 && (
            <div className="suggestions-wrapper">
              <ul>
                {searchSuggestions.map(candidate => (
                  <li
                    title={`Address: ${candidate.address}, location: ${candidate
                      .location?.y ?? 0}, ${candidate.location?.x ?? 0}`}
                    key={candidate.key}
                  >
                    <button
                      onClick={() => {
                        setVenue({
                          address: candidate.address,
                          lat: candidate.location?.y ?? 0,
                          lng: candidate.location?.x ?? 0
                        });
                        setSearchSuggestions([]);
                      }}
                    >
                      {candidate.address}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {venue && (
          <div className="results">
            <p>
              Address: {venue.address}
              <br />
              Latitude: {venue.lat}
              <br />
              Longitude: {venue.lng}
            </p>
            <OSMMap venue={venue} />
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
