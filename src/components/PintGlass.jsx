// A pint glass whose beer level rises with each pint logged at the current pub.
// `full` is how many pints count as a "full" glass visually (it tops out there).
export default function PintGlass({ pints, full = 5 }) {
  const ratio = Math.max(0, Math.min(pints / full, 1));
  return (
    <div className="pint-glass" aria-hidden="true">
      <div className="pg-beer" style={{ height: `${ratio * 100}%` }}>
        {pints > 0 && (
          <>
            <span className="pg-foam" />
            <span className="pg-bub b1" />
            <span className="pg-bub b2" />
            <span className="pg-bub b3" />
          </>
        )}
      </div>
      <span className="pg-shine" />
    </div>
  );
}
