import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_URL = 'http://localhost:5101'; 

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState([]);


  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Projeler yüklenemedi:", err);
      setLoading(false);
    }
  };

  
  const fetchTaskStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/Tasks/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const colors = ['#ffc107', '#0dcaf0', '#198754', '#fd7e14', '#6f42c1'];
      const formattedData = response.data.map((item, index) => ({
        ...item,
        color: colors[index % colors.length]
      }));
      
      setTaskStats(formattedData);
    } catch (err) {
      console.error("İstatistikler yüklenemedi:", err);
    }
  };

 
  useEffect(() => {
    fetchProjects();
    fetchTaskStats();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/api/projects`, 
        { projectName: newProjectName, description: "React'ten oluşturuldu" }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewProjectName('');
      fetchProjects(); 
    } catch (err) {
      alert("Proje oluşturulamadı.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if(!window.confirm("Bu projeyi ve içindeki her şeyi silmek istediğine emin misin?")) return;

    const token = localStorage.getItem('token');
    try {
        await axios.delete(`${API_URL}/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchProjects(); 
    } catch (err) {
        alert("Proje silinemedi.");
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container py-4">

      <div className="row mb-5 align-items-center">
        <div className="col-md-6">
          <h1 className="fw-bold text-dark mb-0">📁 Projelerim</h1>
          <p className="text-muted">Projelerini buradan yönetebilirsin.</p>
        </div>
        <div className="col-md-6">
          <form onSubmit={handleCreateProject} className="d-flex gap-2">
            <input 
              type="text" 
              className="form-control form-control-lg" 
              placeholder="Yeni Proje Adı..." 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-lg px-4 fw-bold">
              + Oluştur
            </button>
          </form>
        </div>
      </div>
      {/* --- YÖNETİCİ GRAFİK PANELİ --- */}
      <div className="card shadow-sm border-0 rounded-4 mb-5">
        <div className="card-body p-4">
          <h4 className="fw-bold mb-4 text-secondary">Genel Görev Durumu</h4>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={taskStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={80} /* Donut grafik */
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {taskStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {projects.length === 0 ? (
            <div className="col-12 text-center text-muted py-5">
                <h4>Henüz hiç projen yok. Yukarıdan bir tane oluştur! 🚀</h4>
            </div>
        ) : (
            projects.map((proj) => (
            <div key={proj.projectId} className="col-md-4 col-lg-3">
                <div className="card h-100 shadow-sm border-0 rounded-4 transition-hover">
                <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="badge bg-light text-primary border border-primary-subtle p-2 rounded-3">
                             Proje
                        </div>
                        <button 
                            onClick={() => handleDeleteProject(proj.projectId)} 
                            className="btn btn-outline-danger btn-sm border-0 rounded-circle"
                            title="Projeyi Sil"
                            style={{width:'32px', height:'32px', padding:0}}
                        >
                            🗑️
                        </button>
                    </div>

                    <h4 className="card-title fw-bold text-dark">{proj.projectName}</h4>
                    <p className="card-text text-muted small flex-grow-1">
                        {proj.description || "Açıklama yok."}
                    </p>
                    
                    <div className="mt-3">
                        <Link to={`/board/${proj.projectId}`} className="btn btn-outline-primary w-100 fw-semibold rounded-pill">
                            Panoya Git →
                        </Link>
                    </div>
                </div>
                </div>
            </div>
            ))
        )}
      </div>
    </div>
  ); 
}

export default DashboardPage;