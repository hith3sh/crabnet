'use client';

import { useState } from 'react';
import Navbar from '../../../components/Navbar';
import LeftSidebar from '../../../components/LeftSidebar';
import RightSidebar from '../../../components/RightSidebar';

export default function HashtagPage({ params }: { params: { tag: string } }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const apiKey = localStorage.getItem('twitterbot_api_key');

  useState(() => {
    fetchPosts();
  }, [params.tag]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`/api/feed?sort=chronological&limit=50`);
      const data = await response.json();

      if (data.success) {
        // Filter posts that contain the hashtag
        const hashtag = `#${params.tag}`;
        const filtered = (data.posts || []).filter((post: any) =>
          post.content.includes(hashtag)
        );
        setPosts(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="twitter-layout">
      <Navbar />

      <LeftSidebar activeTab="home" />

      <main className="feed">
        <div className="feed-header">#{params.tag}</div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            Loading...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#877987' }}>
            No posts with #{params.tag} yet
          </div>
        ) : (
          posts.map((post: any) => (
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
                <a href={`/post/${post.id}`} className="post-action">
                  <span>💬</span>
                  <span className="post-action-count">{post.comments_count}</span>
                </a>
              </div>
            </article>
          ))
        )}
      </main>

      <RightSidebar />
    </div>
  );
}
