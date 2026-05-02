import { useEffect, useState } from 'react';

export default function Officers() {
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    fetch('/api/officers')
      .then(res => res.json())
      .then(data => setOfficers(data));
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Personel</h1>
      <ul>
        {officers.map(officer => (
          <li key={officer.id}>{officer.full_name} - {officer.rank}</li>
        ))}
      </ul>
    </div>
  );
}