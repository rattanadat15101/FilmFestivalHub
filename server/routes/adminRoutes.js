// /server/routes/adminRoutes.js
import express from 'express';
import { supabase } from '../utils/supabaseServer.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Middleware: ตรวจสอบว่าต้อง Login และเป็น Admin
router.use(authMiddleware);
router.use(adminMiddleware);

// --- Get Films Pending Approval ---
// (Endpoint นี้คือจุดที่ Error ในภาพหน้าจอของคุณ)
router.get('/pending-films', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('films')
      .select(`
        id, title, synopsis, video_url,
        profiles:filmmaker_id ( username )
      `)
      .eq('status', 'pending');
    if (error) {
        // Log Error ที่เกิดขึ้นใน Terminal ของ Server
        console.error("!!! Supabase Error in /pending-films:", error); 
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching pending films:", err);
    res.status(500).json({ message: 'Error fetching pending films', error: err.message });
  }
});

// --- Approve a Pending Film ---
router.post('/approve-film/:filmId', async (req, res) => {
  const { filmId } = req.params;
  try {
    const { data, error } = await supabase.from('films').update({ status: 'approved' }).eq('id', filmId).select();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error approving film:", err);
    res.status(500).json({ message: 'Error approving film', error: err.message });
  }
});

// --- Reject a Pending Film ---
router.post('/reject-film/:filmId', async (req, res) => {
  const { filmId } = req.params;
  try {
    const { data, error } = await supabase.from('films').update({ status: 'rejected' }).eq('id', filmId).select();
    if (error) throw error;
    res.json({ message: 'Film rejected successfully.' });
  } catch (err) {
    console.error("Error rejecting film:", err);
    res.status(500).json({ message: 'Error rejecting film', error: err.message });
  }
});

// --- Get Approved Films (for Management) ---
router.get('/approved-films', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('films')
      .select(`
        id, title, is_premium,
        profiles:filmmaker_id ( username )
      `)
      .eq('status', 'approved');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Error fetching approved films:", err);
    res.status(500).json({ message: 'Error fetching approved films', error: err.message });
  }
});

// --- Hide (Unpublish) an Approved Film ---
router.post('/hide-film/:filmId', async (req, res) => {
  const { filmId } = req.params;
  try {
    const { data, error } = await supabase.from('films').update({ status: 'hidden' }).eq('id', filmId).select();
    if (error) throw error;
    res.json({ message: 'Film hidden successfully.' });
  } catch (err) {
    console.error("Error hiding film:", err);
    res.status(500).json({ message: 'Error hiding film', error: err.message });
  }
});

// --- Get Pending Filmmaker Applications ---
router.get('/pending-applications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('filmmaker_applications')
      .select(`
        id, created_at, reason,
        profiles:user_id ( id, username )
      `)
      .eq('status', 'pending');
    if (error) {
      console.error("!!! Supabase Error in /pending-applications:", error);
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("!!! Caught Error in /pending-applications Endpoint:", err);
    res.status(500).json({ message: 'Error fetching applications', error: err.message });
  }
});

// --- Approve a Filmmaker Application ---
router.post('/approve-application', async (req, res) => {
  const { applicationId, userId } = req.body;
  if (!applicationId || !userId) {
    return res.status(400).json({ message: 'Application ID and User ID are required.' });
  }
  try {
    // 1. Update profiles table
    const { error: profileError } = await supabase.from('profiles').update({ is_filmmaker: true }).eq('id', userId);
    if (profileError) throw profileError;

    // 2. Update applications table
    const { error: appError } = await supabase.from('filmmaker_applications').update({ status: 'approved' }).eq('id', applicationId);
    if (appError) throw appError;

    res.json({ message: 'Application approved successfully.' });
  } catch (err) {
    console.error("Error approving application:", err);
    res.status(500).json({ message: 'Error approving application', error: err.message });
  }
});

// --- Get Pending Q&A Requests ---
router.get('/pending-qas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('live_qas')
      .select(`
        id, scheduled_at,
        films ( title ),
        profiles:filmmaker_id ( username )
      `)
      .eq('status', 'requested');
    if (error) {
        console.error("!!! Supabase Error in /pending-qas:", error);
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching pending Q&As:", err);
    res.status(500).json({ message: 'Error fetching pending Q&As', error: err.message });
  }
});

// --- Approve a Q&A Request ---
router.post('/approve-qa', async (req, res) => {
  const { qaId, streamUrl } = req.body;
  if (!qaId || !streamUrl) {
    return res.status(400).json({ message: 'Q&A ID and Stream URL are required.' });
  }
  try {
    const { error } = await supabase.from('live_qas').update({ status: 'approved', stream_url: streamUrl }).eq('id', qaId);
    if (error) throw error;
    res.json({ message: 'Q&A session approved successfully.' });
  } catch (err) {
    console.error("Error approving Q&A:", err);
    res.status(500).json({ message: 'Error approving Q&A session', error: err.message });
  }
});

// --- Reject/Delete a Q&A Request/Session ---
router.post('/reject-qa/:qaId', async (req, res) => {
  const { qaId } = req.params;
  try {
    const { error } = await supabase.from('live_qas').delete().eq('id', qaId);
    if (error) throw error;
    res.json({ message: 'Q&A session deleted successfully.' });
  } catch (err) {
    console.error("Error deleting Q&A:", err);
    res.status(500).json({ message: 'Error deleting Q&A session', error: err.message });
  }
});

// --- Get Approved Q&A Sessions (for Management) ---
router.get('/approved-qas', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('live_qas')
      .select(`
        id, scheduled_at, stream_url,
        films ( title ),
        profiles:filmmaker_id ( username )
      `)
      .eq('status', 'approved')
      .order('scheduled_at', { ascending: true });

    if (error) {
        console.error("!!! Supabase Error in /approved-qas:", error);
        throw error;
    }
    res.json(data);
  } catch (err) {
    console.error("Error fetching approved Q&As:", err);
    res.status(500).json({ message: 'Error fetching approved Q&As', error: err.message });
  }
});

export default router;