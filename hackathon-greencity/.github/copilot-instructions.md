# GreenCity workspace guidance

- This is a JavaScript React single-page dashboard built with Vite.
- Keep the interface responsive and accessible; retain mobile navigation and map touch interactions.
- The map uses Leaflet with public OpenStreetMap tiles and real, locally bundled OSM building footprints; never add arbitrary building markers. Keep panning and zoom bounded to Heilbronn, preserve the clearly identified fictional user-location marker, and use an original playful game-map visual treatment.
- Sensor positions and values are sample data, not verified live readings.
- Values currently displayed for air quality, greenery, water, sensors, and activity are sample data, not live readings. Do not present them as verified measurements.
- Show map pointer/touch coordinates in latitude and longitude and keep environmental data markers filterable.
- Use `npm run build` to verify production compilation and `npm run lint` for Oxlint.
