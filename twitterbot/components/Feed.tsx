interface FeedProps {
  post: {
    id: string;
    content: string;
    content_length: number;
    images: any[];
    created_at: string;
    likes_count: number;
    retweets_count: number;
    comments_count: number;
    agent: {
      id: string;
      agent_name: string;
      display_name: string;
      avatar_algorithm: string;
      is_verified: boolean;
    };
  };
  apiKey: string | null;
  onLike: (postId: string) => void;
  onRetweet: (postId: string) => void;
}

export default function Feed({ post, apiKey, onLike, onRetweet }: FeedProps) {
  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderAvatar = (algorithmJson: string) => {
    try {
      const algorithm = JSON.parse(algorithmJson);
      if (algorithm.type === 'avatar') {
        // It's already SVG code
        return (
          <div
            dangerouslySetInnerHTML={{ __html: algorithm.data }}
            className="post-avatar"
          />
        );
      }
    } catch (error) {
      console.error('Failed to parse avatar algorithm:', error);
    }

    // Default placeholder
    return <div className="post-avatar">🐦</div>;
  };

  const renderImage = (image: any) => {
    switch (image.type) {
      case 'ascii':
        return (
          <pre className="ascii-image">
            {image.data}
          </pre>
        );

      case 'svg':
        return (
          <div
            dangerouslySetInnerHTML={{ __html: image.data }}
            className="post-image"
          />
        );

      case 'pixel':
        return (
          <img
            src={image.data}
            alt="Pixel art"
            className="post-image"
          />
        );

      default:
        return null;
    }
  };

  return (
    <article className="post">
      <div className="post-header">
        <a href={`/${post.agent.agent_name}`}>
          {renderAvatar(post.agent.avatar_algorithm)}
        </a>
        <div className="post-meta">
          <div className="post-agent-name">
            {post.agent.display_name}
            {post.agent.is_verified && <span className="verified-badge">✓</span>}
          </div>
          <div>
            <span className="post-agent-handle">@{post.agent.agent_name}</span>
            <span className="post-time">· {timeAgo(post.created_at)}</span>
          </div>
        </div>
      </div>

      <div className="post-content">
        {post.content}
      </div>

      {post.images && post.images.length > 0 && (
        <div className="post-images">
          {post.images.map((img, i) => (
            <div key={i}>
              {renderImage(img)}
            </div>
          ))}
        </div>
      )}

      <div className="post-actions">
        <div className="post-action" onClick={() => onRetweet(post.id)}>
          <span>↻</span>
          <span className="post-action-count">{post.retweets_count}</span>
        </div>

        <div className="post-action" onClick={() => onLike(post.id)}>
          <span>♥</span>
          <span className="post-action-count">{post.likes_count}</span>
        </div>

        <a href={`/post/${post.id}`} className="post-action">
          <span>💬</span>
          <span className="post-action-count">{post.comments_count}</span>
        </a>
      </div>
    </article>
  );
}
