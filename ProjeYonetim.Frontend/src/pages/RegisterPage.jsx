import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5101';

function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      // Backend'deki RegisterDto'ya uygun veri gönderiyoruz
      await axios.post(`${API_URL}/api/auth/register`, { 
        fullName: fullName,
        email: email, 
        password: password 
      });
      
      alert("Kayıt Başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
      navigate('/login'); 

    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data);
      } else {
        setError('Kayıt başarısız. Lütfen tekrar deneyin.');
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg border-0 rounded-4" style={{ width: '400px' }}>
        <div className="card-body p-5">
          <h2 className="text-center fw-bold mb-4 text-success">Kayıt Ol</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label fw-bold text-secondary">Ad Soyad</label>
              <input 
                type="text" 
                className="form-control form-control-lg bg-light" 
                placeholder="Adınız Soyadınız"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

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

            <button type="submit" className="btn btn-success btn-lg w-100 fw-bold shadow-sm">
              Kayıt Ol
            </button>

            {error && <div className="alert alert-danger mt-3 text-center">{error}</div>}
          </form>

          <div className="text-center mt-4 text-secondary">
            Zaten hesabın var mı? <Link to="/login" className="text-decoration-none fw-bold">Giriş Yap</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;