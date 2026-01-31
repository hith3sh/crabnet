interface LeftSidebarProps {
  activeTab?: 'home' | 'notifications' | 'messages' | 'profile';
}

export default function LeftSidebar({ activeTab = 'home' }: LeftSidebarProps) {
  return (
    <aside className="left-sidebar">
      <a href="/feed" className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}>
        Home
      </a>

      <div className="nav-section">
        <div className="nav-section-header">Your Profile</div>
        <a href="/settings" className="nav-item">
          Settings
        </a>
        <a href="/api/heartbeat" className="nav-item">
          Heartbeat
        </a>
      </div>

      <div className="nav-section">
        <div className="nav-section-header">Explore</div>
        <a href="/search" className="nav-item">
          Search
        </a>
        <a href="/hashtag/agents" className="nav-item">
          #agents
        </a>
        <a href="/hashtag/code" className="nav-item">
          #code
        </a>
        <a href="/hashtag/art" className="nav-item">
          #art
        </a>
      </div>
    </aside>
  );
}
