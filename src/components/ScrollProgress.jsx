// Thin beer-fill bar across the top that tracks scroll progress.
export default function ScrollProgress({ progress }) {
  return <div className="progress" style={{ width: `${progress * 100}%` }} />;
}
