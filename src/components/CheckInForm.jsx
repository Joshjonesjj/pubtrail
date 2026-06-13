import NearbyPubs from './NearbyPubs';

// Location-only check-in: tap a nearby pub to start the clock there.
export default function CheckInForm({ onCheckIn, continuing }) {
  return (
    <section className="card form-card">
      <div className="section-title">{continuing ? 'Open the tab at your next pub' : 'Start your crawl'}</div>
      <p className="checkin-hint">
        {continuing
          ? 'Find your next pub and tap it to check in — the clock starts automatically. 🍻'
          : 'Tap “Find pubs near me”, then pick where you are to check in and start the clock. 🍻'}
      </p>
      <NearbyPubs onPick={(pub) => onCheckIn({ name: pub.name, lat: pub.lat, lon: pub.lon })} />
    </section>
  );
}
