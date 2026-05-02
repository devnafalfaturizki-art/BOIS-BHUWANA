import { useEffect, useState } from 'react';

export default function Positions() {
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    fetch('/api/positions') // Assuming proxy to bois-api-public
      .then(res => res.json())
      .then(data => setPositions(data));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Struktur Organisasi</h1>
      <ul>
        {positions.map(pos => (
          <li key={pos.id}>{pos.name}</li>
        ))}
      </ul>
    </div>
  );
}