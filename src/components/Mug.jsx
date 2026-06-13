// Small reusable beer-mug glyph. Relies on the shared #beerGrad gradient
// defined once in App.jsx.
export default function Mug({ className = 'mug' }) {
  return (
    <svg className={className} viewBox="0 0 24 28" fill="none" aria-hidden="true">
      <rect x="3" y="6" width="13" height="18" rx="2" fill="url(#beerGrad)" stroke="#fff6e0" strokeWidth="1.6" />
      <rect x="3" y="5" width="13" height="4" rx="2" fill="#fff6e0" />
      <path d="M16,9 h3 a3,3 0 0 1 3,3 v3 a3,3 0 0 1 -3,3 h-3" fill="none" stroke="#fff6e0" strokeWidth="1.6" />
    </svg>
  );
}
