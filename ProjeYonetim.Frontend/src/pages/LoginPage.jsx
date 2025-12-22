import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5101';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, { email, password });
      localStorage.setItem('token', response.data.token);
      navigate('/'); 
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg border-0 rounded-4" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <h2 className="text-center fw-bold mb-4 text-primary">Giriş Yap</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">E-posta</label>
              <input 
                type="email" 
                className="form-control form-control-lg bg-light" 
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold text-secondary">Şifre</label>
              <input 
                type="password" 
                className="form-control form-control-lg bg-light" 
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg w-100 fw-bold shadow-sm">
              Giriş Yap 
            </button>

            {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
          </form>

          <div className="text-center mt-4 text-secondary">
            Hesabın yok mu? <Link to="/register" className="text-decoration-none fw-bold">Kayıt Ol</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;