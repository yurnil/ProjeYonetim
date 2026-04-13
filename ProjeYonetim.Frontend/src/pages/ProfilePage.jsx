import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:5101'; 

export default function ProfilePage() {
    const [projects, setProjects] = useState([]);
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [userInfo, setUserInfo] = useState({
        fullName: "",
        email: "",
        role: "",
        department: "",
        skills: ""
    });

    useEffect(() => {
        const fetchProfileData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {

                const profileRes = await axios.get(`${API_URL}/api/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUserInfo(profileRes.data);

                const projRes = await axios.get(`${API_URL}/api/projects`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(projRes.data);

                const statsRes = await axios.get(`${API_URL}/api/Tasks/stats`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(statsRes.data);
            } catch (err) {
                console.error("Veriler çekilemedi:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    const handleSaveProfile = async () => {
        const token = localStorage.getItem('token');
        try {
            await axios.put(`${API_URL}/api/profile`, {
                fullName: userInfo.fullName,
                role: userInfo.role,
                department: userInfo.department,
                skills: userInfo.skills
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsEditing(false);
        } catch (error) {
            alert("Profil kaydedilirken hata oluştu!");
        }
    };

    const handleInputChange = (e) => {
        setUserInfo({ ...userInfo, [e.target.name]: e.target.value });
    };

    const totalTasks = stats.reduce((acc, curr) => acc + curr.value, 0);
    const completedTasks = stats.find(s => s.name === "Bitenler")?.value || 0;
    const completionRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}></div></div>;

    return (
        <div className="container py-5">
            <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                <div style={{ height: '150px', background: 'linear-gradient(135deg, #0079bf, #00b4d8)' }}></div>
                <div className="card-body position-relative px-5 pb-5">
                    <div className="position-absolute" style={{ top: '-50px', width: '120px', height: '120px', backgroundColor: 'white', borderRadius: '50%', padding: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <div className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center text-white fw-bold fs-1" style={{ backgroundColor: '#ff9f43' }}>
                            {userInfo.fullName ? userInfo.fullName.charAt(0).toUpperCase() : '?'}
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '70px' }}>
                        <div className="d-flex justify-content-between align-items-start">
                            <div className="w-75">
                                {isEditing ? (
                                    <div className="d-flex flex-column gap-2 mb-3">
                                        <input type="text" name="fullName" value={userInfo.fullName} onChange={handleInputChange} className="form-control fw-bold fs-4" placeholder="Ad Soyad" />
                                        <div className="d-flex gap-2">
                                            <input type="text" name="role" value={userInfo.role} onChange={handleInputChange} className="form-control" placeholder="Unvan (Örn: Frontend Developer)" />
                                            <input type="text" name="department" value={userInfo.department} onChange={handleInputChange} className="form-control" placeholder="Departman" />
                                        </div>
                                        <input type="email" value={userInfo.email} className="form-control text-muted" disabled title="E-posta değiştirilemez" />
                                    </div>
                                ) : (
                                    <>
                                        <h2 className="fw-bold mb-1">{userInfo.fullName}</h2>
                                        <p className="text-muted mb-2 fs-5">{userInfo.role} <span className="mx-2">•</span> {userInfo.department}</p>
                                        <p className="text-secondary small"> {userInfo.email}</p>
                                    </>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <button onClick={handleSaveProfile} className="btn btn-success rounded-pill px-4 fw-bold"> Kaydet</button>
                            ) : (
                                <button onClick={() => setIsEditing(true)} className="btn btn-outline-primary rounded-pill px-4 fw-bold"> Profili Düzenle</button>
                            )}
                        </div>

                        <div className="mt-4">
                            <h6 className="fw-bold text-secondary mb-3">Teknoloji & Yetenekler</h6>
                            {isEditing ? (
                                <input type="text" name="skills" value={userInfo.skills} onChange={handleInputChange} className="form-control" placeholder="Yetenekleri virgülle ayırarak yazın" />
                            ) : (
                                <div className="d-flex flex-wrap gap-2">
                                    {userInfo.skills && userInfo.skills !== "Henüz yetenek eklenmedi" ? (
                                        userInfo.skills.split(',').map((skill, index) => (
                                            skill.trim() && (
                                                <span key={index} className="badge bg-light text-dark border border-secondary-subtle px-3 py-2 rounded-pill shadow-sm">
                                                    {skill.trim()}
                                                </span>
                                            )
                                        ))
                                    ) : (
                                        <span className="text-muted small">Henüz yetenek eklenmedi</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-4">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <h5 className="fw-bold text-dark mb-4">Performans</h5>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between mb-1">
                                    <span className="text-muted fw-semibold">Görev Tamamlama</span>
                                    <span className="fw-bold text-success">%{completionRate}</span>
                                </div>
                                <div className="progress" style={{ height: '10px' }}>
                                    <div className="progress-bar bg-success rounded-pill" role="progressbar" style={{ width: `${completionRate}%` }}></div>
                                </div>
                            </div>
                            <div className="row text-center mt-4 pt-3 border-top">
                                <div className="col-6 border-end">
                                    <h3 className="fw-bold text-primary mb-0">{projects.length}</h3>
                                    <span className="text-muted small">Aktif Proje</span>
                                </div>
                                <div className="col-6">
                                    <h3 className="fw-bold text-primary mb-0">{totalTasks}</h3>
                                    <span className="text-muted small">Toplam Görev</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-8">
                    <div className="card border-0 shadow-sm rounded-4 h-100">
                        <div className="card-body p-4">
                            <h5 className="fw-bold text-dark mb-4">📁 Dahil Olduğum Projeler</h5>
                            {projects.length === 0 ? (
                                <p className="text-muted text-center my-5">Henüz bir projeye dahil değilsiniz.</p>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {projects.slice(0, 4).map(proj => (
                                        <div key={proj.projectId} className="list-group-item px-0 py-3 d-flex justify-content-between align-items-center border-bottom-0 mb-2 rounded-3 bg-light px-3">
                                            <div>
                                                <h6 className="fw-bold mb-1">{proj.projectName}</h6>
                                                <small className="text-muted">Durum: Aktif Proje</small>
                                            </div>
                                            <Link to={`/board/${proj.projectId}`} className="btn btn-sm btn-primary rounded-pill px-3 fw-bold">
                                                Panoya Git →
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}