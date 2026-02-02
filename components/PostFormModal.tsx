'use client';

import { useState } from 'react';

interface PostFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPost: (post: any) => void;
}

export default function PostFormModal({ isOpen, onClose, onPost }: PostFormModalProps) {
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [images, setImages] = useState<any[]>([]);
  const [showImagePicker, setShowImagePicker] = useState(false);

  const apiKey = localStorage.getItem('twitterbot_api_key');

  if (!isOpen) return null;

  const charCountClass = charCount >= 450 ? 'near-limit' : charCount > 500 ? 'over-limit' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (charCount > 500) {
      alert('Post must be 500 characters or less');
      return;
    }

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          content,
          images,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onPost(data.post);
        setContent('');
        setImages([]);
        setCharCount(0);
      } else {
        alert(data.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    }
  };

  const addASCIIImage = () => {
    setImages([...images, {
      type: 'ascii',
      params: {
        style: 'border',
        text: 'Hello!',
        borderStyle: 'fancy',
      },
    }]);
    setShowImagePicker(false);
  };

  const addSVGImage = () => {
    setImages([...images, {
      type: 'svg',
      params: {
        type: 'gradient',
        colors: ['#ff6b6b', '#ffd93d'],
        width: 400,
        height: 300,
      },
    }]);
    setShowImagePicker(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Compose new post</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="post-form-avatar">
            <div className="post-form-avatar-img">🐦</div>
            <div className="post-form-input">
              <textarea
                className="post-form-textarea"
                placeholder="What's happening?"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setCharCount(e.target.value.length);
                }}
                maxLength={500}
              />
              <div className={`post-form-char-count ${charCountClass}`}>
                {charCount} / 500
              </div>
            </div>
          </div>

          {/* Image Preview */}
          {images.length > 0 && (
            <div className="post-images">
              {images.map((img, i) => (
                <div key={i} className="post-image">
                  {img.type === 'ascii' && (
                    <pre className="ascii-image">{/* ASCII preview */}</pre>
                  )}
                  {img.type === 'svg' && (
                    <div
                      dangerouslySetInnerHTML={{ __html: '<svg width="100" height="60"><rect width="100%" height="100%" fill="url(#grad)"/><defs><linearGradient id="grad"><stop offset="0%" stop-color="#ff6b6b"/><stop offset="100%" stop-color="#ffd93d"/></linearGradient></defs></svg>' }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Image Picker */}
          {images.length < 3 && (
            <button
              className="add-image-button"
              onClick={() => setShowImagePicker(!showImagePicker)}
            >
              {images.length > 0 ? 'Add another image' : 'Add image'}
            </button>
          )}

          {showImagePicker && (
            <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #e1e8ed', borderRadius: '4px' }}>
              <strong>Algorithmic Images:</strong>
              <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                <button
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                  onClick={addASCIIImage}
                >
                  ASCII Border
                </button>
                <button
                  style={{ padding: '8px 12px', cursor: 'pointer' }}
                  onClick={addSVGImage}
                >
                  SVG Gradient
                </button>
              </div>
            </div>
          )}

          {/* Remove images button */}
          {images.length > 0 && (
            <button
              style={{ marginTop: '10px', padding: '6px 12px', cursor: 'pointer', background: '#dc2626', color: 'white', border: 'none', borderRadius: '4px' }}
              onClick={() => setImages([])}
            >
              Remove all images
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="post-form-button"
            onClick={handleSubmit}
            disabled={charCount === 0 || charCount > 500 || !apiKey}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
