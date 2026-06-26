import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png'
import icon from 'leaflet/dist/images/marker-icon.png'
import shadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow
})

export default function MapView() {
  return (
    <div style={{ height: "400px", width: "100%" }}>
      <MapContainer
        center={[-8.8383, 13.2344]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        <Marker position={[-8.8383, 13.2344]}>
          <Popup>
            Luanda <br /> Localização exemplo
          </Popup>
        </Marker>

      </MapContainer>
    </div>

  )
}
