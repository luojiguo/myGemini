import { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('login_token') || sessionStorage.getItem('login_token');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {
        localStorage.removeItem('login_token');
        sessionStorage.removeItem('login_token');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('login_token');
    sessionStorage.removeItem('login_token');
  };

  if (loading) return null; // Or a spinner

  return (
    user ? <ChatInterface user={user} onLogout={handleLogout} /> : <Login onLoginSuccess={handleLogin} />
  );
}

export default App;
