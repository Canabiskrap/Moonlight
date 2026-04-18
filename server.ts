import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import twilio from 'twilio';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import { put } from '@vercel/blob';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

export const app = express();
const PORT = 3000;

// Gemini setup (Server-Side)
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY ? new GoogleGenAI({ apiKey: GEMINI_KEY }) : null;

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
    if (!text || typeof text !== 'string') return text;
    if (!text.includes(':')) return text;
    
    const textParts = text.split(':');
    // Basic check: IV should be 32 hex chars (16 bytes)
    const ivPart = textParts[0];
    const isHex = /^[0-9a-fA-F]+$/.test(ivPart);
    
    if (ivPart.length !== 32 || !isHex) {
      return text; // Not an encrypted string
    }

    const iv = Buffer.from(ivPart, 'hex');
    const encryptedText = Buffer.from(textParts.slice(1).join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text;
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
      const errorText = await tokenRes.text();
      console.error(`PayPal Token Error: ${tokenRes.status} ${errorText}`);
      throw new Error(`PayPal auth failed Check credentials.`);
    }
    
    const { access_token } = await tokenRes.json();

    // 2. Verify Order Status
    const orderRes = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    if (!orderRes.ok) {
      const errorText = await orderRes.text();
      console.error(`PayPal Order Fetch Error: ${orderRes.status} ${errorText}`);
      throw new Error(`Failed to fetch order details from PayPal (Status: ${orderRes.status})`);
    }

    const orderData = await orderRes.json();

    // 3. Check if payment is completed
    if (orderData.status === 'COMPLETED') {
      const decryptedUrl = decrypt(encryptedUrl);
      
      // Trigger WhatsApp notification if enabled
      if (req.body.whatsappEnabled && req.body.whatsappNumber) {
        try {
          const sid = process.env.TWILIO_ACCOUNT_SID;
          const token = process.env.TWILIO_AUTH_TOKEN;
          const from = process.env.TWILIO_WHATSAPP_FROM_NUMBER;
          
          if (sid && token && from) {
            const client = twilio(sid, token);
            await client.messages.create({
              body: `تم الطلب بنجاح في Moonlight 🌑\nرقم الطلب: ${orderId}\nشكراً لثقتك بنا!`,
              from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
              to: `whatsapp:${req.body.whatsappNumber}`
            });
          } else {
            console.warn("Twilio credentials missing. Skipping notification.");
          }
        } catch (e) {
          console.error("WhatsApp notification failed:", e);
        }
      }

      return res.json({ downloadUrl: decryptedUrl });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (error) {
    console.error("PayPal Verification Error:", error);
    return res.status(500).json({ error: 'Internal server error during verification' });
  }
});

// 3. Smart Link Doctor - Check URL Accessibility
app.post('/api/check-links', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    const results = await Promise.all(urls.map(async (encryptedUrl) => {
      let url = encryptedUrl;
      try {
        url = decrypt(encryptedUrl);
        
        // Ensure URL has a protocol
        if (url && typeof url === 'string' && !url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'https://' + url;
        }

        if (!url || typeof url !== 'string' || !url.includes('.')) {
          return { url, status: 'broken', message: 'Invalid URL format' };
        }
        
        // We use a shorter timeout (3s per link) to prevent Vercel Function hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        try {
          const response = await fetch(url, { 
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Moonlight Link Bot)',
              'Accept': '*/*',
            }
          });
          
          clearTimeout(timeoutId);

          const isPrivate = response.url.includes('accounts.google.com/ServiceLogin') || response.status === 403;
          const isBroken = response.status >= 400 && response.status !== 403;

          return {
            url,
            status: isBroken ? 'broken' : (isPrivate ? 'private' : 'ok'),
            statusCode: response.status
          };
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          return {
            url,
            status: 'error',
            message: fetchErr?.name === 'AbortError' ? 'Timeout (3s)' : 'Network Error'
          };
        }
      } catch (error: any) {
        return {
          url: encryptedUrl,
          status: 'error',
          message: 'Processing error'
        };
      }
    }));

    res.json({ results });
  } catch (error: any) {
    console.error("Check Links Global Error:", error);
    res.status(500).json({ error: 'Failed to process links. ' + (error.message || '') });
  }
});

// 4. AI Endpoints (Moving logic to server)
app.post('/api/ai/insights', async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "AI service not initialized" });
  try {
    const { product } = req.body;
    const response = await (genAI as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Analyze this product for 'Moonlight 🌕' brand in Arabic:
        Name: ${product.name}
        Description: ${product.description}
        Category: ${product.category}`,
      config: {
        systemInstruction: "You are a marketing expert. Return JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            creativeSummary: { type: Type.STRING },
            targetAudience: { type: Type.STRING },
            proTip: { type: Type.STRING },
            suggestedUseCases: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["creativeSummary", "targetAudience", "proTip", "suggestedUseCases"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("AI Insights Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "AI service not initialized" });
  try {
    const { message, history, instruction } = req.body;
    const response = await (genAI as any).models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
            ...history.map((h: any) => ({ role: h.role, parts: h.parts })),
            { role: 'user', parts: [{ text: message }] }
        ],
        config: {
            systemInstruction: instruction,
            temperature: 0.7
        }
    });
    res.json({ text: response.text });
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/factory', async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "AI service not initialized" });
  try {
    const { input, systemInstruction, responseSchema } = req.body;
    const response = await (genAI as any).models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: input }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema
      }
    });
    
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("AI Factory Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/image', async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "AI service not initialized" });
  try {
    const { prompt } = req.body;
    const response = await (genAI as any).models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ai/recommendations', async (req, res) => {
  if (!genAI) return res.status(500).json({ error: "AI service not initialized" });
  try {
    const { query, products } = req.body;
    const response = await (genAI as any).models.generateContent({
        model: "gemini-1.5-flash",
        contents: `User is asking for: "${query}". Products: ${JSON.stringify(products)}. Return IDs.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    res.json(JSON.parse(response.text));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Send WhatsApp Notification
app.post('/api/send-whatsapp-notification', async (req, res) => {
  const { whatsappNumber, orderDetails } = req.body;
  if (!whatsappNumber || !orderDetails) {
    return res.status(400).json({ error: 'Missing whatsappNumber or orderDetails' });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return res.status(500).json({ error: 'Twilio not configured' });
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({
      body: `طلب جديد: ${orderDetails}`,
      from: fromNumber,
      to: `whatsapp:${whatsappNumber}`
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error("Twilio Error:", error);
    res.status(500).json({ error: 'Failed to send WhatsApp notification' });
  }
});

// Vite Middleware for Development / Static Serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          clientPort: 443
        }
      },
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
