// /client/src/pages/LiveQAPage.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import ReactPlayer from 'react-player';

function LiveQAPage() {
  const { id: qaId } = useParams();
  const { session, profile } = useAuth();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const chatContainerRef = useRef(null); // Ref สำหรับ Auto-scroll

  // --- 1. ฟังก์ชันสำหรับ "ดึงแชท" (เราจะเรียกใช้ซ้ำๆ) ---
  const fetchMessages = useCallback(async () => {
    if (!session?.access_token) return; // เช็ก Token ก่อน
    try {
      const messagesRes = await axios.get(
        `/api/qa/messages/${qaId}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );
      if (Array.isArray(messagesRes.data)) {
        setMessages(messagesRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch messages", err.response || err);
      // ไม่ set Error ที่นี่ เพราะอาจจะแค่โหลดไม่สำเร็จ 1 ครั้ง
    }
  }, [qaId, session]); // ฟังก์ชันนี้จะถูกสร้างใหม่ ถ้า qaId หรือ session เปลี่ยน

  // --- 2. ดึงข้อมูล Session (Stream URL) และ "แชทเก่า" (ครั้งแรก) ---
  useEffect(() => {
    if (!session?.access_token) return; // รอให้ session โหลด
    
    const fetchSessionData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // ดึง Stream URL
        const sessionRes = await axios.get(
          `/api/qa/session/${qaId}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        setSessionInfo(sessionRes.data);

        // ดึงแชท (ครั้งแรก)
        await fetchMessages();

      } catch (err) {
        console.error("Failed to load session data:", err.response || err);
        setError('Failed to load session data. This session might not be approved or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchSessionData();
  }, [qaId, session, fetchMessages]); // เพิ่ม fetchMessages ใน dependency
  
  // --- 3. (หัวใจหลัก - Refresh Chat) ---
  // ตั้งเวลาให้ "ดึงแชท" ทุกๆ 5 วินาที
  useEffect(() => {
    // เริ่ม Polling
    const intervalId = setInterval(() => {
      console.log("Polling for new messages...");
      fetchMessages();
    }, 5000); // 5000ms = 5 วินาที

    // (สำคัญ) Cleanup ตอนออกจากหน้า
    return () => {
      clearInterval(intervalId); // หยุด Polling
    };
  }, [fetchMessages]); // เริ่ม Interval ใหม่ ถ้า fetchMessages เปลี่ยน

  // --- 4. ฟังก์ชันส่งแชท (ยิงไป Node.js) ---
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !profile || !session?.access_token) {
        // ถ้าไม่มี profile หรือ token ให้หยุด
        if (!profile) console.error("Send Message: Profile not loaded.");
        if (!session?.access_token) console.error("Send Message: Access token not available.");
        return;
    }

    try {
      // 4.1 ส่งแชทไปที่ Backend (Node.js)
      const response = await axios.post(
        '/api/qa/messages',
        {
          qaId: qaId,
          message: newMessage
        },
        {
          headers: { Authorization: `Bearer ${session.access_token}` }
        }
      );

      // 4.2 (Trick) ทำให้แชทดู Real-time สำหรับ "คนส่ง"
      // เราเพิ่มข้อความใหม่ (ที่ Server ส่งกลับมา) เข้าไปใน State ทันที
      const newMsgData = response.data;
      
      // (เราต้องดึง profile เอง เพราะ Server ไม่ได้ส่ง username กลับมา)
      const messageWithProfile = {
        ...newMsgData,
        profiles: { username: profile.username } // ใช้ profile จาก useAuth()
      };
      
      setMessages(currentMessages => [...currentMessages, messageWithProfile]);
      setNewMessage(''); // เคลียร์ช่องแชท

    } catch (err) {
      console.error('Error sending message:', err.response || err);
      alert('Failed to send message.');
    }
  };

  // --- 5. Auto-scroll to bottom ---
  useEffect(() => {
    if (chatContainerRef.current) {
      // ให้มันเลื่อนลงล่างสุดเมื่อมีข้อความใหม่
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]); // ทำงานทุกครั้งที่ messages (Array) เปลี่ยน

  // --- Styles ---
  const pageStyle = { display: 'flex', height: 'calc(100vh - 65px)', padding: '1rem', background: '#141414' }; // 65px คือความสูง Navbar (โดยประมาณ)
  const videoSectionStyle = { flex: 3, background: '#000', borderRadius: '8px', overflow: 'hidden' };
  const chatSectionStyle = { flex: 1, marginLeft: '1rem', border: '1px solid #333', display: 'flex', flexDirection: 'column', background: '#1c1c1c', borderRadius: '8px' };
  const chatHeaderStyle = { padding: '1rem', borderBottom: '1px solid #333', color: '#e5b80b', margin: 0 };
  const chatMessagesStyle = { flex: 1, overflowY: 'auto', padding: '1rem', color: '#ccc' };
  const chatFormStyle = { padding: '1rem', borderTop: '1px solid #333' };
  const chatInputStyle = { width: '100%', boxSizing: 'border-box' };

  if (loading) return <div style={{ padding: '2rem', color: '#aaa' }}>Loading Live Session...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  return (
    <div style={pageStyle}>
      
      {/* 1. ส่วนของวิดีโอ */}
      <div style={videoSectionStyle}>
        <ReactPlayer 
          url={sessionInfo?.stream_url || ''} // ลิงก์จาก Admin
          controls 
          width="100%"
          height="100%"
          playing={true} // (Optional) ให้เล่นอัตโนมัติ
        />
      </div>

      {/* 2. ส่วนของแชท */}
      <div style={chatSectionStyle}>
        <h3 style={chatHeaderStyle}>Live Chat</h3>
        
        {/* กล่องข้อความ */}
        <div ref={chatContainerRef} style={chatMessagesStyle}>
          {messages.map(msg => (
            <div key={msg.id} style={{ marginBottom: '0.75rem' }}>
              <strong style={{ color: '#e5b80b' }}>{msg.profiles?.username || 'User'}:</strong>
              <p style={{ margin: '2px 0 0 0', color: '#f4f4f4', wordBreak: 'break-word' }}>{msg.message}</p>
            </div>
          ))}
          {messages.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>Welcome to the chat!</p>}
        </div>

        {/* ช่องพิมพ์ */}
        <form onSubmit={handleSendMessage} style={chatFormStyle}>
          <input 
            type="text" 
            placeholder="Say something..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={chatInputStyle}
            disabled={!profile} // ปิดช่องพิมพ์ถ้า profile ยังไม่โหลด
          />
          {/* (อาจจะเพิ่มปุ่ม Send ถ้าต้องการ) */}
        </form>
      </div>
    </div>
  );
}

export default LiveQAPage;