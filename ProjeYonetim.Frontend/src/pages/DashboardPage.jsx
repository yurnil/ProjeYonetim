import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:5101'; 

function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [loading, setLoading] = useState(true);
  const [taskStats, setTaskStats] = useState([]);
  const [myTasks, setMyTasks] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 

  useEffect(() => {
    const fetchAllData = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const projRes = await axios.get(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
        setProjects(projRes.data);

        const statsRes = await axios.get(`${API_URL}/api/Tasks/stats`, { headers: { Authorization: `Bearer ${token}` } });
        const colors = ['#0dcaf0', '#ffc107', '#198754', '#fd7e14', '#6f42c1'];
        const formattedData = statsRes.data.map((item, index) => ({
          ...item,
          color: colors[index % colors.length]
        }));
        setTaskStats(formattedData);

        const tasksRes = await axios.get(`${API_URL}/api/Tasks/my-tasks`, { headers: { Authorization: `Bearer ${token}` } });
        setMyTasks(tasksRes.data);

      } catch (err) {
        console.error("Dashboard verileri çekilemedi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/api/projects`, 
        { projectName: newProjectName, description: "Yeni proje oluşturuldu." }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewProjectName('');
      toast.success("Proje başarıyla oluşturuldu! 🚀");
      
      const projRes = await axios.get(`${API_URL}/api/projects`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(projRes.data);
    } catch (err) {
      toast.error("Proje oluşturulamadı.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if(!window.confirm("Bu projeyi ve içindeki her şeyi silmek istediğine emin misin?")) return;

    const token = localStorage.getItem('token');
    try {
        await axios.delete(`${API_URL}/api/projects/${projectId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Proje başarıyla silindi! 🗑️");
        setProjects(projects.filter(p => p.projectId !== projectId));
    } catch (err) {
        toast.error("Proje silinemedi.");
    }
  };

  const totalTasks = taskStats.reduce((acc, curr) => acc + curr.value, 0);
  const completedTasks = taskStats.find(s => s.name === "Bitenler")?.value || 0;
  const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const upcomingTasks = myTasks
    .filter(t => t.dueDate && new Date(t.dueDate).getFullYear() > 1970 && t.status !== 2)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  const filteredProjects = projects.filter(p => 
    p.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div></div>;

  return (
    <div className="container py-4">

      <div className="row mb-4 align-items-center">
        <div className="col-md-4">
          <h2 className="fw-bold text-dark mb-0">📊 Kontrol Merkezi</h2>
          <p className="text-muted small mb-0">Proje ve görevlerinin genel durumu.</p>
        </div>
        <div className="col-md-8 d-flex gap-3 justify-content-end">
          <div className="input-group shadow-sm" style={{ maxWidth: '300px' }}>
            <span className="input-group-text bg-white border-end-0 rounded-start-pill">🔍</span>
            <input 
              type="text" 
              className="form-control border-start-0 rounded-end-pill" 
              placeholder="Projelerde ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ outline: 'none', boxShadow: 'none' }}
            />
          </div>
          <form onSubmit={handleCreateProject} className="d-flex gap-2">
            <input 
              type="text" 
              className="form-control shadow-sm rounded-pill px-3" 
              placeholder="Yeni Proje Adı..." 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              style={{ minWidth: '200px' }}
            />
            <button type="submit" className="btn btn-primary fw-bold shadow-sm rounded-pill px-4">
              + Oluştur
            </button>
          </form>
        </div>
      </div>

      <div className="row mb-4 g-3">
        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-primary text-white">
                <div className="card-body p-4 d-flex flex-column justify-content-center">
                    <h6 className="opacity-75 fw-bold mb-1">Aktif Projeler</h6>
                    <h2 className="fw-bold mb-0">{projects.length}</h2>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-body p-4 d-flex flex-column justify-content-center">
                    <h6 className="text-muted fw-bold mb-1">Toplam Görev</h6>
                    <h2 className="fw-bold text-dark mb-0">{totalTasks}</h2>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-body p-4 d-flex flex-column justify-content-center">
                    <h6 className="text-muted fw-bold mb-1">Tamamlanan İşler</h6>
                    <h2 className="fw-bold text-success mb-0">{completedTasks}</h2>
                </div>
            </div>
        </div>
        <div className="col-md-3">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
                <div className="card-body p-4 d-flex flex-column justify-content-center">
                    <h6 className="text-muted fw-bold mb-1">Başarı Yüzdesi</h6>
                    <div className="d-flex align-items-center gap-2">
                        <h2 className="fw-bold text-info mb-0">%{completionRate}</h2>
                        <div className="progress flex-grow-1" style={{ height: '8px' }}>
                            <div className="progress-bar bg-info rounded-pill" style={{ width: `${completionRate}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="row mb-5 g-4">
        {/* SOL: GRAFİK */}
        <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-4 h-100">
                <div className="card-body p-4">
                <h5 className="fw-bold mb-4 text-dark">Genel Görev Durumu</h5>
                {totalTasks === 0 ? (
                    <div className="d-flex align-items-center justify-content-center h-100 text-muted">Veri bulunmuyor.</div>
                ) : (
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                        <PieChart>
                            <Pie
                            data={taskStats}
                            cx="50%" cy="50%"
                            innerRadius={70} 
                            outerRadius={100}
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
                )}
                </div>
            </div>
        </div>

        <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-4 h-100">
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold text-dark mb-0">⏳ Yaklaşan Teslim Tarihleri</h5>
                        <Link to="/profile" className="btn btn-sm btn-light text-primary fw-bold rounded-pill px-3">Tümünü Gör</Link>
                    </div>
                    
                    {upcomingTasks.length === 0 ? (
                        <div className="text-center p-4 bg-light rounded-3">
                            <p className="text-muted mb-0 small">Yaklaşan acil bir göreviniz bulunmuyor. Harika!</p>
                        </div>
                    ) : (
                        <div className="list-group list-group-flush gap-2">
                            {upcomingTasks.map(task => {
                                const daysLeft = Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                                const isUrgent = daysLeft <= 2;

                                return (
                                    <div key={task.taskId} className="list-group-item d-flex justify-content-between align-items-center border-0 bg-light rounded-3 p-3">
                                        <div>
                                            <h6 className="fw-bold mb-1 text-dark">{task.title}</h6>
                                            <small className="text-secondary">{task.projectName}</small>
                                        </div>
                                        <div className="text-end">
                                            <span className={`badge ${isUrgent ? 'bg-danger' : 'bg-warning text-dark'} rounded-pill px-3 py-2 shadow-sm`}>
                                                {daysLeft < 0 ? 'Süresi Geçti' : `${daysLeft} Gün Kaldı`}
                                            </span>
                                            <br/>
                                            <Link to={`/board/${task.projectId}`} className="small text-decoration-none fw-bold mt-1 d-inline-block">Göreve Git →</Link>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      <h4 className="fw-bold text-dark mb-4">📁 Projelerim</h4>
      <div className="row g-4">
        {filteredProjects.length === 0 ? (
            <div className="col-12 text-center text-muted py-5 bg-white rounded-4 shadow-sm border-0">
                <h5 className="mb-0">Proje bulunamadı. Yukarıdan yeni bir tane oluşturabilirsin! 🚀</h5>
            </div>
        ) : (
            filteredProjects.map((proj) => (
            <div key={proj.projectId} className="col-md-4 col-lg-3">
                <div className="card h-100 shadow-sm border-0 rounded-4 transition-hover">
                <div className="card-body d-flex flex-column p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="badge bg-primary bg-opacity-10 text-primary border border-primary-subtle px-3 py-2 rounded-pill">
                            Aktif Proje
                        </div>
                        <button 
                            onClick={() => handleDeleteProject(proj.projectId)} 
                            className="btn btn-light text-danger btn-sm border-0 rounded-circle shadow-sm"
                            title="Projeyi Sil"
                            style={{width:'35px', height:'35px', display:'flex', alignItems:'center', justifyContent:'center'}}
                        >
                            🗑️
                        </button>
                    </div>

                    <h5 className="card-title fw-bold text-dark mb-2">{proj.projectName}</h5>
                    
                    
                    <div className="mt-3 pt-3 border-top">
                        <Link to={`/board/${proj.projectId}`} className="btn btn-primary w-100 fw-bold rounded-pill shadow-sm py-2">
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