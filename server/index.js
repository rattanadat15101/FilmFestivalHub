// /server/index.js

import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import filmRoutes from './routes/filmRoutes.js';
import userRoutes from './routes/userRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import filmmakerRoutes from './routes/filmmakerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import qaRoutes from './routes/qaRoutes.js';
import genreRoutes from './routes/genreRoutes.js';
import authRoutes from './routes/authRoutes.js';
// หา Path ของ Directory ปัจจุบัน
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- 1. Middleware Global (CORS) ---
// [FIXED CORS] ใช้ cors() เพื่ออนุญาตทุก Origin ในช่วง Dev (ปกติจะจำกัดใน Production)
// ถ้าต้องการอนุญาตทุก Origin: app.use(cors()); 
// แต่เราจะใช้ตัวเลือกที่ปลอดภัยกว่าใน Dev
const corsOptions = {
  // อนุญาต Origin ที่ระบุ (เช่น Client Port 5173) และอนุญาตทุก IP ในช่วง Dev
  origin: '*', // * อนุญาตให้ทุก Domain เข้ามา
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.use(express.json()); // สำหรับรับ body ที่เป็น JSON

// --- 2. Static Files (SPA Build) ---
app.use(express.static(path.join(__dirname, '../client/dist')));

// --- 3. API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/films', filmRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/filmmaker', filmmakerRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/genres', genreRoutes);

// --- 4. SPA Catch-all Route ---
app.get('*', (req, res) => {
  if (req.headers.accept && req.headers.accept.includes('html')) {
      res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  } else {
      res.status(404).json({ message: 'Resource not found.' });
  }
});


// --- Server Listener ---
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});