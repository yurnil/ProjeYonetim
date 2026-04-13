import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ChatBox from './pages/ChatBox';

function App() {
  const navigate = useNavigate();

  const [isLogged, setIsLogged] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const onAuthChange = () => setIsLogged(Boolean(localStorage.getItem('token')));
    const onStorage = (e) => {
      if (e.key === 'token') onAuthChange();
    };

    window.addEventListener('authChange', onAuthChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('authChange', onAuthChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/login');
  };

  return (
    <div>

      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">

          <Link className="navbar-brand fw-bold" to="/">
             Proje Yönetim
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Ana Sayfa</Link>
              </li>
              {!isLogged && (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Giriş Yap</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/register">Kayıt Ol</Link>
                  </li>
                </>
              )}
            </ul>

            <div className="d-flex">
              {isLogged && (
                <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                  Çıkış Yap
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

  
      <main className="container mt-4">
        <Outlet /> 
      </main>
      {isLogged && <ChatBox />}
    </div>
  
  );
}

export default App;