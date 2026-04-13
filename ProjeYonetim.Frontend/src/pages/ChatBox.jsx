import { useState, useEffect, useRef } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

const API_URL = 'http://localhost:5101'; // Kendi portuna göre düzeltmeyi unutma

export default function ChatBox() {
    const [connection, setConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [contacts, setContacts] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Canlı mesaj gelirken seçili kullanıcıyı bilmek için (SignalR bug'ını önler)
    const selectedUserRef = useRef(null);
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

    // 1. AÇILIŞTA KİŞİLERİ VE OKUNMAMIŞ SAYILARINI GETİR
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        fetch(`${API_URL}/api/messages/contacts`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setContacts(data.users);
            setCurrentUserId(data.currentUserId);
        })
        .catch(err => console.error("Kişiler çekilemedi:", err));

        const newConnection = new HubConnectionBuilder()
            .withUrl(`${API_URL}/chatHub`, { accessTokenFactory: () => token })
            .withAutomaticReconnect()
            .build();
        setConnection(newConnection);
    }, []);

    // 2. KİŞİYE TIKLAYINCA: Eski mesajları getir ve "Okundu" yap
    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        const token = localStorage.getItem('token');
        
        // Ekranda okunmamış sayısını anında sıfırla
        setContacts(prev => prev.map(c => c.userId === user.userId ? { ...c, unreadCount: 0 } : c));

        // Eski mesajları getir
        fetch(`${API_URL}/api/messages/history/${user.userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => setMessages(data));

        // Backend'e okundu bilgisini gönder
        fetch(`${API_URL}/api/messages/mark-read/${user.userId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
    };

    // 3. SIGNALR DİNLEMESİ (Canlı Mesajlar & Bildirim Arttırma)
    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    connection.on('ReceiveMessage', (message) => {
                        setMessages(prev => [...prev, message]);
                        
                        // Eğer mesaj atan kişi o an SEÇİLİ DEĞİLSE, okunmamış sayısını 1 arttır
                        setContacts(prev => prev.map(c => {
                            if (c.userId === message.senderId && selectedUserRef.current?.userId !== message.senderId) {
                                return { ...c, unreadCount: (c.unreadCount || 0) + 1 };
                            }
                            return c;
                        }));

                        if (!isOpen) setIsOpen(true); 
                    });
                })
                .catch(e => console.error('SignalR Hatası: ', e));
        }
    }, [connection, isOpen]);

    const sendMessage = async () => {
        if (!messageInput.trim() || !selectedUser || !connection) return;
        try {
            const receiverIdInt = parseInt(selectedUser.userId);
            await connection.invoke('SendMessage', receiverIdInt, messageInput);
            
            setMessages(prev => [...prev, { 
                senderId: currentUserId, 
                receiverId: receiverIdInt, 
                content: messageInput 
            }]);
            setMessageInput('');
        } catch (e) { console.error("Gönderim Hatası:", e); }
    };

    const messagesEndRef = useRef(null);
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages]);

    // Toplam okunmamış mesaj sayısını hesapla (Ana buton için)
    const totalUnread = contacts.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    if (!currentUserId) return null; 

    return (
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
            {/* KAPALIYKEN GÖRÜNEN ANA BUTON VE TOPLAM BİLDİRİM */}
            {!isOpen && (
                <button onClick={() => setIsOpen(true)} style={{ backgroundColor: '#0079bf', color: 'white', borderRadius: '50%', width: '60px', height: '60px', fontSize: '24px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', border: 'none', cursor: 'pointer', position: 'relative' }}>
                    💬
                    {totalUnread > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', backgroundColor: '#e53935', color: 'white', borderRadius: '50%', padding: '4px 8px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                            {totalUnread}
                        </span>
                    )}
                </button>
            )}
           
            {isOpen && (
                <div style={{ width: '400px', height: '450px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#0079bf', color: 'white', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
                        <span>Takım İçi Mesajlar</span>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '16px' }}>✖</button>
                    </div>

                    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                        {/* SOL TARAF: KİŞİLER LİSTESİ */}
                        <div style={{ width: '35%', borderRight: '1px solid #ccc', overflowY: 'auto', backgroundColor: '#fafafa' }}>
                            {contacts.map(u => (
                                <div 
                                    key={u.userId} 
                                    onClick={() => handleSelectUser(u)} 
                                    style={{ 
                                        padding: '12px 10px', 
                                        cursor: 'pointer', 
                                        // TASARIM: Seçiliyse normal mavi, okunmamış varsa hafif mavi
                                        backgroundColor: selectedUser?.userId === u.userId ? '#e6f0ff' : (u.unreadCount > 0 ? '#f0f8ff' : 'transparent'), 
                                        borderBottom: '1px solid #eee', 
                                        fontSize: '13px', 
                                        // TASARIM: Okunmamış varsa kalın font
                                        fontWeight: (selectedUser?.userId === u.userId || u.unreadCount > 0) ? 'bold' : 'normal', 
                                        color: '#333',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <span>{u.fullName || 'Kullanıcı'}</span>
                                    
                                    {/* KİŞİYE ÖZEL BİLDİRİM YUVARLAĞI */}
                                    {u.unreadCount > 0 && (
                                        <span style={{ backgroundColor: '#e53935', color: 'white', borderRadius: '12px', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
                                            {u.unreadCount}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                       
                        {/* SAĞ TARAF: MESAJ ALANI */}
                        <div style={{ width: '65%', display: 'flex', flexDirection: 'column' }}>
                            {selectedUser ? (
                                <>
                                    <div style={{ flex: 1, padding: '10px', overflowY: 'auto', backgroundColor: '#e5ddd5', fontSize: '13px' }}>
                                        {messages.filter(m => (m.senderId === selectedUser.userId) || (m.receiverId === selectedUser.userId)).map((msg, idx) => (
                                            <div key={idx} style={{ textAlign: msg.senderId === currentUserId ? 'right' : 'left', marginBottom: '8px' }}>
                                                <span style={{ display: 'inline-block', padding: '8px 12px', borderRadius: '8px', backgroundColor: msg.senderId === currentUserId ? '#dcf8c6' : 'white', boxShadow: '0 1px 1px rgba(0,0,0,0.1)', maxWidth: '90%', wordWrap: 'break-word' }}>
                                                    {msg.content}
                                                </span>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} /> 
                                    </div>
                                    <div style={{ display: 'flex', padding: '10px', backgroundColor: '#f0f0f0', boxSizing: 'border-box' }}>
                                        <input 
                                            type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} 
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), sendMessage())} 
                                            style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '20px', outline: 'none', fontSize: '13px', minWidth: '0' }} 
                                            placeholder="Mesaj yaz..." 
                                        />
                                        <button onClick={sendMessage} style={{ marginLeft: '8px', padding: '0 15px', backgroundColor: '#0079bf', color: 'white', border: 'none', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', flexShrink: 0 }}>
                                            Gönder
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    Sohbet etmek için soldan birini seçin.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}