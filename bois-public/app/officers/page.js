import { useEffect, useState } from 'react';

export default function Officers() {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/officers')
      .then(res => res.json())
      .then(data => {
        setOfficers(data);
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
      <h1>Personel</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
        {officers.map(officer => (
          <div key={officer.id} style={{ border: '1px solid #ccc', padding: '1rem' }}>
            {officer.photo_url && <img src={officer.photo_url} alt={officer.full_name} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />}
            <h3>{officer.full_name}</h3>
            <p>{officer.rank}</p>
            <p>NRP: {officer.nrp}</p>
            <p>Status: {officer.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}