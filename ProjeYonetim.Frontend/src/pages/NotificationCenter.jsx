import { useState, useEffect } from 'react';
import axios from 'axios';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { useNavigate } from 'react-router-dom'; 

const API_URL = 'http://localhost:5101'; 

export default function NotificationCenter() {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [connection, setConnection] = useState(null);
    
    const navigate = useNavigate(); 

    const token = localStorage.getItem('token');


    useEffect(() => {
        if (!token) return;

        axios.get(`${API_URL}/api/notification`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => setNotifications(res.data))
          .catch(err => console.error("Bildirimler çekilemedi:", err));

        const newConnection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/chatHub`, { accessTokenFactory: () => token })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);
    }, [token]);


    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    connection.on('ReceiveNotification', (notification) => {
                        setNotifications(prev => [notification, ...prev]);
                    });
                })
                .catch(e => console.error('SignalR Hatası: ', e));
        }
    }, [connection]);

    const unreadCount = notifications.filter(n => !n.isRead).length;


    const handleOpen = () => {
        setIsOpen(!isOpen);

        if (!isOpen && unreadCount > 0) {
            axios.put(`${API_URL}/api/notification/mark-as-read`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            });
        }
    };


    const handleNotificationClick = (url) => {
        setIsOpen(false);
        if (url) {
            navigate(url);
        }
    };

    return (
        <div style={{ position: 'relative' }} className="me-3">
            <button 
                onClick={handleOpen} 
                className="btn btn-dark position-relative border-0"
                style={{ fontSize: '1.2rem', backgroundColor: 'transparent' }}
                title="Bildirimler"
            >
                🔔
                {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.7rem' }}>
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="dropdown-menu show dropdown-menu-end shadow rounded-3 border-0" style={{ position: 'absolute', right: 0, top: '45px', width: '320px', maxHeight: '400px', overflowY: 'auto', zIndex: 1050 }}>
                    <div className="dropdown-header d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                        <span className="fw-bold text-dark fs-6">Bildirimler</span>
                    </div>
                    
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted small">Henüz bildiriminiz yok.</div>
                    ) : (
                        notifications.map((n, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleNotificationClick(n.targetUrl)} 
                                className={`dropdown-item text-wrap border-bottom py-3 ${!n.isRead ? 'bg-light fw-bold' : ''}`} 
                                style={{ fontSize: '0.85rem', cursor: 'pointer' }} 
                            >
                                <div className="mb-1 text-dark">{n.message}</div>
                                
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    {new Date(n.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute:'2-digit' })}
                                </small>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}