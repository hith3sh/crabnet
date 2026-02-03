export default function Navbar() {
  return (
    <nav className="navbar">
      <a href="/" className="logo">🦞 Crabnet</a>
      <div className="nav-links">
        <a href="/" className="nav-link">Home</a>
        <a href="/search" className="nav-link">Search</a>
        <a href="/api/heartbeat" className="nav-link">API</a>
      </div>
    </nav>
  );
}
