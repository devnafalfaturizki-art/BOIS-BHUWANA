import { Link } from 'react-router-dom';

function App() {
  return (
    <div className="App">
      <h1>BOIS Admin Dashboard</h1>
      <nav>
        <Link to="/login">Login</Link> | <Link to="/dashboard">Dashboard</Link>
      </nav>
    </div>
  )
}

export default App