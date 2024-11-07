import SFTPClient from 'ssh2-sftp-client';

interface SFTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  remotePath: string;
}

export class SFTPManager {
  private static instance: SFTPManager;
  private config: SFTPConfig | null = null;

  private constructor() {}

  static getInstance(): SFTPManager {
    if (!SFTPManager.instance) {
      SFTPManager.instance = new SFTPManager();
    }
    return SFTPManager.instance;
  }

  setConfig(config: SFTPConfig): void {
    this.config = config;
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) throw new Error('SFTP configuration not set');

    const sftp = new SFTPClient();
    try {
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password
      });
      await sftp.end();
      return true;
    } catch (error) {
      throw error;
    }
  }

  async uploadFile(fileContent: string, filename: string): Promise<string> {
    if (!this.config) throw new Error('SFTP configuration not set');

    const sftp = new SFTPClient();
    try {
      await sftp.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        password: this.config.password
      });

      const remotePath = `${this.config.remotePath}/${filename}`;
      const buffer = Buffer.from(fileContent);
      await sftp.put(buffer, remotePath);
      await sftp.end();
      
      return remotePath;
    } catch (error) {
      throw error;
    }
  }
}

export default SFTPManager.getInstance();