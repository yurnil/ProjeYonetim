import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './ProjectDetailPage.css';
import ChatBox from './ChatBox';
 
const API_URL = 'http://localhost:5101'; 
 
const getCurrentUserId = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const payload = JSON.parse(jsonPayload);
    const userId = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || payload.nameid || payload.sub || payload.id;
    return userId ? Number(userId) : null;
  } catch (e) { return null; }
};
 
const getCurrentUserName = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || payload.unique_name || payload.name || payload.email || null;
  } catch (e) { return null; }
};
 
function ProjectDetailPage() {
  const { id } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedTask, setSelectedTask] = useState(null);
  const [comments, setComments] = useState([]);  
        
  const [newComment, setNewComment] = useState('');
  
  const [newListTitle, setNewListTitle] = useState('');
  const [newTaskTitles, setNewTaskTitles] = useState({});
  const [memberEmail, setMemberEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false); 
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
 
  const currentUserId = getCurrentUserId();
 
  const labelOptions = [
    { name: 'Yok', color: '#ebecf0' }, { name: 'Acil', color: '#eb5a46' },
    { name: 'Önemli', color: '#ffab00' }, { name: 'Backend', color: '#0079bf' },
    { name: 'Frontend', color: '#51e898' }, { name: 'Tasarım', color: '#f2d600' }
  ];
 
  const fetchProjectDetails = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjectData(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Proje yüklenemedi:", err);
      setLoading(false);
    }
  };
 
  useEffect(() => { fetchProjectDetails(); }, [id]);
 
  const isOwner = projectData?.project && currentUserId && (Number(currentUserId) === Number(projectData.project.ownerUserId));
 
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
 
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
 
    const startList = projectData.lists.find(l => l.listId.toString() === source.droppableId);
    const finishList = projectData.lists.find(l => l.listId.toString() === destination.droppableId);
    
    if (!startList || !finishList) return;
 
    const taskMoved = startList.tasks.find(t => t.taskId.toString() === draggableId);
 
    if (startList.listId === finishList.listId) {
        const newTasks = Array.from(startList.tasks);
        newTasks.splice(source.index, 1);
        newTasks.splice(destination.index, 0, taskMoved);
 
        const newLists = projectData.lists.map(list => 
            list.listId === startList.listId ? { ...list, tasks: newTasks } : list
        );
        setProjectData({ ...projectData, lists: newLists });
 
        const token = localStorage.getItem('token');
        try {
 
            const orderedIds = newTasks.map(t => t.taskId);
 
            await axios.put(`${API_URL}/api/tasks/reorder`,
                { listId: startList.listId, taskIds: orderedIds },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error("Sıralama kaydedilemedi:", err);
        }
        return;
    }
 
    const newLists = projectData.lists.map(list => {
        if (list.listId === startList.listId) {
            return { ...list, tasks: list.tasks.filter(t => t.taskId !== taskMoved.taskId) };
        }
        if (list.listId === finishList.listId) {
            const newTasks = Array.from(list.tasks);
            newTasks.splice(destination.index, 0, taskMoved);
            return { ...list, tasks: newTasks };
        }
        return list;
    });
 
    setProjectData({ ...projectData, lists: newLists });
 
    const token = localStorage.getItem('token');
    try {
        await axios.put(`${API_URL}/api/tasks/${draggableId}/move`,
            { targetListId: finishList.listId }, 
            { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error("Taşıma hatası:", err);
        fetchProjectDetails();
    }
  };
 
  const handleAddMember = async () => {
    if (!memberEmail.trim()) return;
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/api/projects/${id}/members`, `"${memberEmail}"`, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
      alert("Üye başarıyla eklendi!"); setMemberEmail(''); fetchProjectDetails();
    } catch (err) { alert("Yetkiniz yok veya üye bulunamadı."); }
  };
 
  const updateLocalTask = (taskId, newData) => {
    setProjectData(prev => ({ ...prev, lists: prev.lists.map(list => ({ ...list, tasks: list.tasks.map(t => t.taskId === taskId ? { ...t, ...newData } : t) })) }));
    if (selectedTask?.taskId === taskId) setSelectedTask(prev => ({ ...prev, ...newData }));
  };
 
  const handleUpdateLabel = async (taskId, labelName) => {
    if (!isOwner) return alert("Sadece proje sahibi etiketleri değiştirebilir!");
    const token = localStorage.getItem('token');
    const finalLabel = labelName === 'Yok' ? "" : labelName;
    try {
        await axios.put(`${API_URL}/api/tasks/${taskId}/label`, `"${finalLabel}"`, {
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        updateLocalTask(taskId, { label: finalLabel });
    } catch (err) { alert("Hata oluştu."); }
  };
 
  const handleAddTask = async (listId) => {
    const title = newTaskTitles[listId];
    if (!title?.trim()) return;
    const token = localStorage.getItem('token');
    try {
        await axios.post(`${API_URL}/api/tasks`, { listId, title }, { headers: { Authorization: `Bearer ${token}` } });
        setNewTaskTitles({ ...newTaskTitles, [listId]: '' }); 
        fetchProjectDetails(); 
    } catch (err) {
        alert("Kart eklenemedi! Lütfen Backend'i kontrol edin.");
    }
  };
 
  const handleAddList = async () => {
    if (!newListTitle.trim()) return;
    const token = localStorage.getItem('token');
    await axios.post(`${API_URL}/api/lists`, { projectId: id, listName: newListTitle }, { headers: { Authorization: `Bearer ${token}` } });
    setNewListTitle('');
    fetchProjectDetails();
  };

  const handleStatusChange = async (taskId, newStatus) => {
    
    updateLocalTask(taskId, { status: newStatus });

    const token = localStorage.getItem('token');
    try {
      
      await axios.put(`${API_URL}/api/Tasks/${taskId}/status`, 
        newStatus, 
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
    
      fetchProjectDetails(); 
    } catch (err) {
      console.error("Durum güncellenemedi:", err);
      alert("Durum güncellenirken bir hata oluştu.");
    }
  };
 
  const handleTaskClick = (task) => { 
      setSelectedTask(task); 
 
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setIsEditing(false); 
      fetchComments(task.taskId);
  };
 
  const fetchComments = async (taskId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get(`${API_URL}/api/tasks/${taskId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
      setComments(response.data || []);
    } catch (err) {
      // Fallback: try query-based endpoint if the above doesn't exist
      try {
        const response = await axios.get(`${API_URL}/api/comments?taskId=${taskId}`, { headers: { Authorization: `Bearer ${token}` } });
        setComments(response.data || []);
      } catch (e) {
        console.error('Yorumlar yüklenemedi:', err);
        setComments([]);
      }
    }
  };
 
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toLocaleTimeString() : d.toLocaleTimeString();
  };
 
  const handleAddComment = async () => {
    const text = newComment.trim();
    if (!text) return; // ignore empty
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/api/tasks/comments`, { taskId: selectedTask.taskId, text }, { headers: { Authorization: `Bearer ${token}` } });
      // Prepare a normalized comment object to append immediately
      const resp = response.data || {};
      const createdAt = resp.createdAt && !isNaN(new Date(resp.createdAt).getTime()) ? resp.createdAt : new Date().toISOString();
      const commentId = resp.commentId || resp.id || `tmp-${Date.now()}`;
      const userName = resp.userName || resp.userFullName || getCurrentUserName() || 'Sen';
      const commentText = resp.text || text;
 
      const appended = { commentId, userName, text: commentText, createdAt };
      setComments(prev => [...prev, appended]);
      setNewComment('');
      // Try to sync with server in background (refresh if server returns full data)
      if (!response.data || !response.data.commentId) {
        fetchComments(selectedTask.taskId);
      }
    } catch (err) {
      console.error('Yorum gönderilemedi:', err);
      alert('Yorum gönderilemedi. Lütfen tekrar deneyin.');
    }
  };
 
  const handleAssignUser = async (taskId, userId) => {
    if (!isOwner) return alert("Sadece proje sahibi atama yapabilir!");
    const token = localStorage.getItem('token');
    try { await axios.put(`${API_URL}/api/tasks/${taskId}/assign/${userId}`, {}, { headers: { Authorization: `Bearer ${token}` } }); updateLocalTask(taskId, { assignedUserId: parseInt(userId) }); } catch (err) { alert("Yetkiniz yok."); }
  };
 
  const handleDeleteTask = async (taskId) => {
      if (!window.confirm("Bu kartı kalıcı olarak silmek istediğinize emin misiniz?")) return;
 
      const token = localStorage.getItem('token');
      try {
 
          await axios.delete(`${API_URL}/api/tasks/${taskId}`, {
              headers: { Authorization: `Bearer ${token}` }
          });
 
          setSelectedTask(null);
 
          const newLists = projectData.lists.map(list => ({
              ...list,
              tasks: list.tasks.filter(t => t.taskId !== taskId)
          }));
          setProjectData({ ...projectData, lists: newLists });
 
      } catch (err) {
          console.error(err);
          alert("Kart silinemedi. Yetkiniz olmayabilir.");
      }
  };
 
  const handleUpdateTask = async () => {
      const token = localStorage.getItem('token');
      try {
          await axios.put(`${API_URL}/api/tasks/${selectedTask.taskId}`,
              { title: editTitle, description: editDescription },
              { headers: { Authorization: `Bearer ${token}` } }
          );
 
          updateLocalTask(selectedTask.taskId, { title: editTitle, description: editDescription });
          
          setIsEditing(false);
          alert("Kart güncellendi!");
      } catch (err) {
          alert("Güncelleme başarısız.");
      }
  };
 
  if (loading) return <div className="loading">Yükleniyor...</div>;
  if (!projectData || !projectData.project) return <div style={{textAlign:'center', color:'white', marginTop:'50px'}}><h2>Proje Yüklenemedi</h2><a href="/" style={{color:'white'}}>Geri Dön</a></div>;
 
  return (
    <div className="project-detail-container">
      <div className="project-header">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h1>{projectData.project.projectName}</h1>
          {isOwner && (
            <div className="member-add-box">
                <input placeholder="Üye E-posta..." value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                <button onClick={handleAddMember} className="btn-success">➕ Üye Ekle</button>
            </div>
          )}
        </div>
        <p>{projectData.project.description}</p>
      </div>
 
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="board-canvas">
            {projectData.lists.map((list) => (
            <div key={list.listId} className="list-wrapper">
                <h3>{list.listName}</h3>
                
                <Droppable droppableId={list.listId.toString()}>
                {(provided) => (
                    <div 
                        className="tasks-container"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ minHeight: '50px' }}
                    >
                        {list.tasks && list.tasks.map((task, index) => (
                            <Draggable key={task.taskId} draggableId={task.taskId.toString()} index={index}>
                                {(provided) => (
                                    <div 
                                        className="task-card" 
                                        onClick={() => handleTaskClick(task)}
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{ ...provided.draggableProps.style, opacity: 1 }}
                                    >
                                        {task.label && <div className="label-badge" style={{ backgroundColor: labelOptions.find(l => l.name === task.label)?.color }}>{task.label}</div>}
                                        <div style={{fontWeight:'500'}}>{task.title}</div>
                                        {task.assignedUserId && <div className="assign-badge"> Atandı</div>}
                                        
                                      
                                        <select 
                                          className="form-select form-select-sm mt-2 border-secondary" 
                                          value={task.status || 0} 
                                          onChange={(e) => {
                                            e.stopPropagation(); 
                                            handleStatusChange(task.taskId, parseInt(e.target.value));
                                          }}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <option value={0}> Yapılacak</option>
                                          <option value={1}> Devam Ediyor</option>
                                          <option value={2}> Bitti</option>
                                        </select>
                                        

                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )} 
                </Droppable>
 
                <div style={{display:'flex', gap:'5px', marginTop:'5px'}}>
                    <input 
                        className="input-styled" 
                        placeholder="Kart ekle..." 
                        value={newTaskTitles[list.listId] || ''} 
                        onChange={(e) => setNewTaskTitles({ ...newTaskTitles, [list.listId]: e.target.value })} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask(list.listId)}
                        style={{marginTop:0}}
                    />
                    <button 
                        onClick={() => handleAddTask(list.listId)} 
                        className="btn-primary" 
                        style={{width:'auto', padding:'0 10px', fontSize:'18px', display:'flex', alignItems:'center'}}
                    >
                        +
                    </button>
                </div>
 
            </div>
            ))}
            <div className="add-list-wrapper">
            <input className="input-styled" placeholder="+ Liste ekle..." value={newListTitle} onChange={(e) => setNewListTitle(e.target.value)} />
            <button onClick={handleAddList} className="btn-primary">Ekle</button>
            </div>
        </div>
      </DragDropContext>
 
      {selectedTask && (
        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                {isEditing ? (
                    <input 
                        className="input-styled"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ fontSize: '1.5em', fontWeight: 'bold', margin: 0 }}
                    />
                ) : (
                    <h2>{selectedTask.title}</h2>
                )}
 
                {isOwner && (
                    <div style={{ display: 'flex', gap: '5px' }}>
                        {!isEditing ? (
                            <>
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="btn-primary"
                                    style={{ padding: '5px 10px', fontSize: '12px', background: '#0079bf' }}
                                >
                                    Düzenle
                                </button>
                                <button 
                                    onClick={() => handleDeleteTask(selectedTask.taskId)}
                                    style={{ backgroundColor: '#cf3c3c', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                >
                                    Sil
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={handleUpdateTask}
                                    className="btn-success"
                                    style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                    Kaydet
                                </button>
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
                                >
                                    ❌İptal
                                </button>
                            </>
                        )}
                    </div>
                )}
              </div>
              
              <button className="close-btn" onClick={() => setSelectedTask(null)}>×</button>
            </div>
 
            <div className="modal-body">
 
              <section className="modal-section">
                <h4> Açıklama</h4>
                {isEditing ? (
                    <textarea 
                        className="input-styled"
                        rows="4"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Kart açıklaması girin..."
                    />
                ) : (
                    <p style={{ background: '#f4f5f7', padding: '10px', borderRadius: '4px', minHeight: '40px' }}>
                        {selectedTask.description || <span style={{color:'#888', fontStyle:'italic'}}>Açıklama yok...</span>}
                    </p>
                )}
              </section>
 
              <section className="modal-section">
                <h4> Etiket {!isOwner && '(Salt Okunur)'}</h4>
                <div className="label-selector">
                  {labelOptions.map(l => (
                    <button key={l.name} onClick={() => !isEditing && handleUpdateLabel(selectedTask.taskId, l.name)} style={{ background: l.color, opacity: isOwner ? 1 : 0.5, cursor: isOwner ? 'pointer' : 'not-allowed' }} className="label-btn" disabled={!isOwner}>{l.name}</button>
                  ))}
                </div>
              </section>
              <section className="modal-section">
                <h4> Sorumlu { !isOwner && '(Salt Okunur)' }</h4>
                <select
                    className="input-styled" 
                    value={selectedTask.assignedUserId || 0} 
                    onChange={(e) => handleAssignUser(selectedTask.taskId, e.target.value)}
                    disabled={!isOwner}
                    style={{ cursor: isOwner ? 'pointer' : 'not-allowed', opacity: isOwner ? 1 : 0.7 }}
                >
                    <option value="0">Atanmadı</option>
                    <option value={projectData.project.ownerUserId}>{projectData.project.ownerName} (Sahibi)</option>
                    {projectData.collaborators?.map(col => (
                        <option key={col.userId} value={col.userId}>{col.fullName}</option>
                    ))}
                </select>
              </section>
              <section className="comments-section">
                <h4> Yorumlar</h4>
                <div className="comments-list">
                  {comments.map(c => (
                    <div key={c.commentId} className="comment-item">
                      <div className="comment-meta"><strong>{c.userName}</strong> <span>{formatTime(c.createdAt)}</span></div>
                      <p>{c.text}</p>
                    </div>
                  ))}
                </div>
                <div className="add-comment-area">
                    <textarea className="input-styled" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Yorum yaz..." />
                    <button onClick={handleAddComment} className="btn-primary">Gönder</button>
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
 
export default ProjectDetailPage;