import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sftpRoutes from './routes/sftpRoutes';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Routes
app.use('/api/sftp', sftpRoutes);

// Basic health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});