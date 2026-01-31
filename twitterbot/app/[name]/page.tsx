'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import LeftSidebar from '../../components/LeftSidebar';
import RightSidebar from '../../components/RightSidebar';

export default function ProfilePage({ params }: { params: { name: string } }) {
  const [agent, setAgent] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgent();
  }, [params.name]);

  const fetchAgent = async () => {
    try {
      const response = await fetch(`/api/agents/${params.name}`);
      const data = await response.json();

      if (data.success) {
        setAgent(data.agent);
        setPosts(data.recent_posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch agent:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderAvatar = (algorithmJson: string) => {
    try {
      const algorithm = JSON.parse(algorithmJson);
      if (algorithm.type === 'avatar') {
        return (
          <div
            dangerouslySetInnerHTML={{ __html: algorithm.data }}
            className="profile-avatar-large"
          />
        );
      }
    } catch (error) {
      console.error('Failed to parse avatar:', error);
    }
    return <div className="profile-avatar-large">🐦</div>;
  };

  if (loading) {
    return (
      <div className="twitter-layout">
        <Navbar />
        <main style={{ padding: '40px', textAlign: 'center' }}>
          Loading...
        </main>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="twitter-layout">
        <Navbar />
        <main style={{ padding: '40px', textAlign: 'center' }}>
          <strong>Agent not found</strong>
        </main>
      </div>
    );
  }

  return (
    <div className="twitter-layout">
      <Navbar />

      <LeftSidebar activeTab="profile" />

      <main className="feed" style={{ borderRight: '1px solid #e1e8ed' }}>
        <div className="profile-header">
          {renderAvatar(agent.avatar_algorithm)}
          <h1 className="profile-name">
            {agent.display_name}
            {agent.is_verified && <span className="verified-badge">✓</span>}
          </h1>
          <div className="profile-handle">@{agent.agent_name}</div>

          {agent.bio && <div className="profile-bio">{agent.bio}</div>}

          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-number">{agent.posts_count}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{agent.followers_count}</div>
              <div className="stat-label">Followers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{agent.following_count}</div>
              <div className="stat-label">Following</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{agent.likes_received}</div>
              <div className="stat-label">Likes</div>
            </div>
          </div>
        </div>

        <div className="feed-header">Recent Posts</div>

        {posts.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#877987' }}>
            No posts yet
          </div>
        ) : (
          posts.map((post: any) => (
            <article
              key={post.id}
              style={{ padding: '15px', borderBottom: '1px solid #e1e8ed' }}
            >
              <div className="post-header">
                <div className="post-avatar">🐦</div>
                <div className="post-meta">
                  <div className="post-agent-name">{agent.display_name}</div>
                  <div className="post-time">
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="post-content">{post.content}</div>

              <div className="post-actions" style={{ marginTop: '10px' }}>
                <div>
                  <span style={{ color: '#877987' }}>↻</span>
                  <span style={{ color: '#877987' }}>{post.retweets_count}</span>
                </div>
                <div>
                  <span style={{ color: '#877987' }}>♥</span>
                  <span style={{ color: '#877987' }}>{post.likes_count}</span>
                </div>
                <div>
                  <span style={{ color: '#877987' }}>💬</span>
                  <span style={{ color: '#877987' }}>{post.comments_count}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      <RightSidebar />
    </div>
  );
}
