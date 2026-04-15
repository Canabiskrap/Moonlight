import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { put } from '@vercel/blob';

dotenv.config();

export const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Multer setup for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Encryption Setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'default_secret_key_32_chars_long!';
const IV_LENGTH = 16;

function encrypt(text: string) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text: string) {
  try {
    if (!text.includes(':')) return text; // Fallback for unencrypted legacy URLs
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    console.error("Decryption failed:", e);
    return text; // Fallback
  }
}

// 0. Upload Endpoint (Used by Dashboard)
app.post('/api/upload', (upload.single('file') as any), async (req: any, res: any) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Vercel Blob
    const blob = await put(req.file.originalname, req.file.buffer, {
      access: 'public',
    });

    res.json({ url: blob.url });
  } catch (error: any) {
    console.error("Upload Error:", error);
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// 1. Encrypt URL (Used by Dashboard when adding a product)
app.post('/api/encrypt', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });
  
  const encryptedUrl = encrypt(url);
  res.json({ encryptedUrl });
});

// 2. Verify PayPal Order and Return Decrypted URL
app.post('/api/verify-order', async (req, res) => {
  const { orderId, encryptedUrl } = req.body;
  
  if (!orderId || !encryptedUrl) {
    return res.status(400).json({ error: 'Missing orderId or encryptedUrl' });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  // If PayPal secret is not configured, we just decrypt and return (Fallback mode)
  // This ensures the app doesn't break while the user is setting up their keys.
  if (!clientId || !secret) {
    console.warn("WARNING: PAYPAL_SECRET is not set. Skipping server-side verification.");
    const decryptedUrl = decrypt(encryptedUrl);
    return res.json({ downloadUrl: decryptedUrl });
  }

  try {
    // 1. Get PayPal Access Token
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.paypal.com'; // Use api-m.sandbox.paypal.com for testing
    
    const tokenRes = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: { 
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    if (!tokenRes.ok) {
      throw new Error('Failed to get PayPal token');
    }
    
    const { access_token } = await tokenRes.json();

    // 2. Verify Order Status
    const orderRes = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!orderRes.ok) {
      throw new Error('Failed to fetch order details');
    }

    const orderData = await orderRes.json();

    // 3. Check if payment is completed
    if (orderData.status === 'COMPLETED') {
      const decryptedUrl = decrypt(encryptedUrl);
      return res.json({ downloadUrl: decryptedUrl });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (error) {
    console.error("PayPal Verification Error:", error);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// Vite Middleware for Development / Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

if (process.env.VERCEL !== '1') {
  startServer();
}

export default app;
