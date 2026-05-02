import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:4001/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Dashboard</h2>
      <p>Welcome, {user.username} ({user.role})</p>
      <nav>
        <button onClick={handleLogout}>Logout</button>
      </nav>
      <div style={{ marginTop: '2rem' }}>
        <h3>Admin Functions</h3>
        <ul>
          <li>Manage Positions</li>
          <li>Manage Officers</li>
          <li>Manage Assignments</li>
          <li>Manage Posts</li>
          <li>View Audit Logs</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;