import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import SFTPManager from '../config/sftpConfig';

const router = Router();

// Test endpoint to check if the API is accessible
router.get('/status', (_req: Request, res: Response) => {
  res.json({ status: 'SFTP API is running' });
});

// Validate SFTP configuration
const validateConfig = [
  body('host').notEmpty().isString(),
  body('port').isInt({ min: 1, max: 65535 }),
  body('username').notEmpty().isString(),
  body('password').notEmpty().isString(),
  body('remotePath').notEmpty().isString(),
];

interface SFTPConfigBody {
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath: string;
}

// Configure SFTP settings
router.post(
  '/config',
  validateConfig,
  async (
    req: Request<{}, {}, SFTPConfigBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      SFTPManager.setConfig(req.body);
      await SFTPManager.testConnection();
      res.json({ message: 'SFTP configuration successful' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to configure SFTP connection', 
        details: errorMessage 
      });
      next(error);
    }
  }
);

// Test SFTP connection
router.post(
  '/test',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      await SFTPManager.testConnection();
      res.json({ message: 'SFTP connection test successful' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'SFTP connection test failed', 
        details: errorMessage 
      });
      next(error);
    }
  }
);

interface UploadBody {
  content: string;
  filename: string;
}

// Upload file via SFTP
router.post(
  '/upload',
  async (
    req: Request<{}, {}, UploadBody>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { content, filename } = req.body;
      if (!content || !filename) {
        return res.status(400).json({ error: 'Content and filename are required' });
      }

      const remotePath = await SFTPManager.uploadFile(content, filename);
      res.json({ message: 'File uploaded successfully', path: remotePath });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ 
        error: 'Failed to upload file via SFTP', 
        details: errorMessage 
      });
      next(error);
    }
  }
);

export default router;