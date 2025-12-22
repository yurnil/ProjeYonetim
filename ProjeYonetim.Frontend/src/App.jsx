import { Outlet, Link, useNavigate } from 'react-router-dom';

function App() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Çıkış yapınca token'ı sil ve girişe at
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      {/* --- PROFESYONEL MENÜ ÇUBUĞU (NAVBAR) --- */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          {/* Logo Kısmı */}
          <Link className="navbar-brand fw-bold" to="/">
            🚀 Proje Yönetim
          </Link>

          {/* Mobil Menü Butonu (Hamburger) */}
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Linkler */}
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link" to="/">Ana Sayfa</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/login">Giriş Yap</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/register">Kayıt Ol</Link>
              </li>
            </ul>
            
            {/* Sağ Taraf: Çıkış Butonu */}
            <div className="d-flex">
               <button onClick={handleLogout} className="btn btn-outline-danger btn-sm">
                 Çıkış Yap
               </button>
            </div>
          </div>
        </div>
      </nav>

      {/* --- İÇERİK ALANI (CONTAINER) --- */}
      {/* mt-4: Üstten boşluk bırakır */}
      <main className="container mt-4">
        <Outlet /> 
      </main>
    </div>
  );
}

export default App;