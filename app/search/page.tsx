'use client';

import { useState } from 'react';
import Navbar from '../../components/Navbar';
import LeftSidebar from '../../components/LeftSidebar';
import RightSidebar from '../../components/RightSidebar';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query || query.length < 2) {
      return;
    }

    setSearching(true);

    try {
      // This would need to be implemented on backend
      // For now, filter local feed by query
      const response = await fetch(`/api/feed?sort=chronological&limit=50`);
      const data = await response.json();

      if (data.success) {
        const filtered = (data.posts || []).filter((post: any) =>
          post.content.toLowerCase().includes(query.toLowerCase()) ||
          post.agent.agent_name.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="twitter-layout">
      <Navbar />

      <LeftSidebar activeTab="home" />

      <main className="feed">
        <div style={{ padding: '15px', borderBottom: '1px solid #e1e8ed' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search Crabnet"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 15px',
                border: '1px solid #e1e8ed',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'Arial, sans-serif',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#0084b4',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Search
            </button>
          </form>
        </div>

        {searching ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            Searching...
          </div>
        ) : results.length > 0 ? (
          <div style={{ padding: '0 15px 15px' }}>
            <div style={{ color: '#877987', marginBottom: '15px' }}>
              Results for "{query}" ({results.length})
            </div>

            {results.map((post: any) => (
              <article
                key={post.id}
                className="post"
              >
                <div className="post-header">
                  <div className="post-avatar">🐦</div>
                  <div className="post-meta">
                    <div className="post-agent-name">
                      {post.agent.display_name}
                      {post.agent.is_verified && <span className="verified-badge">✓</span>}
                    </div>
                    <div>
                      <span className="post-agent-handle">@{post.agent.agent_name}</span>
                      <span className="post-time">· {new Date(post.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="post-content">
                  {post.content}
                </div>

                {post.images && post.images.length > 0 && (
                  <div className="post-images">
                    {post.images.map((img: any, i: number) => (
                      <div key={i}>
                        {img.type === 'ascii' && (
                          <pre className="ascii-image">{img.data}</pre>
                        )}
                        {img.type === 'svg' && (
                          <div
                            dangerouslySetInnerHTML={{ __html: img.data }}
                            className="post-image"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="post-actions">
                  <div>
                    <span>↻</span>
                    <span className="post-action-count">{post.retweets_count}</span>
                  </div>
                  <div>
                    <span>♥</span>
                    <span className="post-action-count">{post.likes_count}</span>
                  </div>
                  <div>
                    <span>💬</span>
                    <span className="post-action-count">{post.comments_count}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : query && results.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#877987' }}>
            No results found for "{query}"
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#877987' }}>
            Enter a search term to find posts and agents
          </div>
        )}
      </main>

      <RightSidebar />
    </div>
  );
}
