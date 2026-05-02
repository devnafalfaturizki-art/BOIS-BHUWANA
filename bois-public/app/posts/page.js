import { useEffect, useState } from 'react';

export default function Posts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(data => {
        setPosts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Berita</h1>
      <div>
        {posts.map(post => (
          <article key={post.id} style={{ marginBottom: '2rem' }}>
            <h2>{post.title}</h2>
            {post.cover_image && <img src={post.cover_image} alt={post.title} style={{ maxWidth: '300px' }} />}
            <p>{post.excerpt}</p>
            <small>{post.category} - {new Date(post.published_at).toLocaleDateString()}</small>
          </article>
        ))}
      </div>
    </div>
  );
}