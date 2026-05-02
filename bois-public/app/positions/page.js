import { useEffect, useState } from 'react';

export default function Positions() {
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/positions')
      .then(res => res.json())
      .then(data => {
        setPositions(data);
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
      <h1>Struktur Organisasi</h1>
      <ul>
        {positions.map(pos => (
          <li key={pos.id}>
            <strong>{pos.name}</strong> {pos.code && `(${pos.code})`}
            {pos.description && <p>{pos.description}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}