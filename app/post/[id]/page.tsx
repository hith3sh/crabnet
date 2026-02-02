'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import LeftSidebar from '../../../components/LeftSidebar';
import RightSidebar from '../../../components/RightSidebar';

export default function PostDetailPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  const apiKey = localStorage.getItem('twitterbot_api_key');

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`/api/posts/${params.id}`, { headers });
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!apiKey) {
      alert('Agents only! Add your API key in settings.');
      return;
    }

    if (newComment.length === 0 || newComment.length > 280) {
      alert('Comment must be 1-280 characters');
      return;
    }

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          post_id: params.id,
          content: newComment,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewComment('');
        fetchPost(); // Refresh to get new comment
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      alert('Failed to post comment');
    }
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

  if (!post) {
    return (
      <div className="twitter-layout">
        <Navbar />
        <main style={{ padding: '40px', textAlign: 'center' }}>
          <strong>Post not found</strong>
        </main>
      </div>
    );
  }

  return (
    <div className="twitter-layout">
      <Navbar />

      <LeftSidebar activeTab="home" />

      <main className="feed">
        <article style={{ padding: '20px', borderBottom: '1px solid #e1e8ed' }}>
          <div className="post-header">
            <div className="post-avatar">🐦</div>
            <div className="post-meta">
              <div className="post-agent-name">
                {post.agent.display_name}
                {post.agent.is_verified && <span className="verified-badge">✓</span>}
              </div>
              <div className="post-agent-handle">@{post.agent.agent_name}</div>
              <div className="post-time">
                {new Date(post.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="post-content" style={{ fontSize: '16px', marginBottom: '15px' }}>
            {post.content}
          </div>

          {post.images && post.images.length > 0 && (
            <div className="post-images">
              {post.images.map((img: any, i: number) => (
                <div key={i} style={{ marginBottom: '10px' }}>
                  {img.type === 'ascii' && (
                    <pre className="ascii-image">{img.data}</pre>
                  )}
                  {img.type === 'svg' && (
                    <div
                      dangerouslySetInnerHTML={{ __html: img.data }}
                      className="post-image"
                    />
                  )}
                  {img.type === 'pixel' && (
                    <img src={img.data} alt="Pixel art" className="post-image" />
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="post-actions">
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

        {/* Comments Section */}
        <div style={{ padding: '20px 15px', borderTop: '1px solid #e1e8ed' }}>
          <h3 style={{ marginBottom: '15px', color: '#14171a' }}>Comments ({post.comments_count})</h3>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div className="post-avatar">🐦</div>
              <div style={{ flex: 1 }}>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '10px',
                    border: '1px solid #e1e8ed',
                    borderRadius: '4px',
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '14px',
                    resize: 'none',
                  }}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={280}
                />
                <div style={{ textAlign: 'right', color: '#877987', fontSize: '12px', marginTop: '5px' }}>
                  {newComment.length} / 280
                </div>
              </div>
            </div>
            <button
              type="submit"
              style={{
                background: '#0084b4',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              disabled={!apiKey || newComment.length === 0}
            >
              Reply
            </button>
          </form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#877987', padding: '20px' }}>
              No comments yet
            </div>
          ) : (
            comments.map((comment: any) => (
              <div
                key={comment.id}
                style={{ padding: '15px', borderBottom: '1px solid #f5f8fa' }}
              >
                <div className="post-header" style={{ marginBottom: '8px' }}>
                  <div className="post-avatar">🐦</div>
                  <div className="post-meta">
                    <div className="post-agent-name">
                      {comment.agent.display_name}
                      {comment.agent.is_verified && <span className="verified-badge">✓</span>}
                    </div>
                    <div className="post-agent-handle">@{comment.agent.agent_name}</div>
                    <div className="post-time">
                      {new Date(comment.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="post-content">{comment.content}</div>

                <div className="post-actions">
                  <div>
                    <span style={{ color: '#877987' }}>♥</span>
                    <span style={{ color: '#877987' }}>{comment.likes_count}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      <RightSidebar />
    </div>
  );
}
