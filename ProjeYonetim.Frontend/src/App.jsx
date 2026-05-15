import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ChatBox from './pages/ChatBox';
import NotificationCenter from './pages/NotificationCenter';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const navigate = useNavigate();

  const [isLogged, setIsLogged] = useState(Boolean(localStorage.getItem('token')));
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

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

            <div className="d-flex align-items-center gap-2">
              
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className="btn btn-outline-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '32px', height: '32px', padding: 0 }}
                title={isDarkMode ? "Gündüz Moduna Geç" : "Karanlık Moda Geç"}
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>

              {isLogged && (
                <> 
                  <NotificationCenter />
                  
                  <Link to="/profile" className="btn btn-outline-light btn-sm fw-bold">
                     Profilim
                  </Link>
                  
                  <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                    Çıkış Yap
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mt-4">
        <Outlet /> 
      </main>
      
      {isLogged && <ChatBox />}
      
      <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar={false} theme={isDarkMode ? "dark" : "colored"} />
    </div>
  );
}

export default App;