import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_SECRET || 'default_secret_key_32_chars_long!';

function decrypt(text) {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const textParts = text.split(':');
    if (textParts.length < 2) return text;
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts.slice(1).join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch {
    return text;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId, encryptedUrl } = req.body;

  if (!orderId || !encryptedUrl) {
    return res.status(400).json({ error: 'Missing orderId or encryptedUrl' });
  }

  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    const decryptedUrl = decrypt(encryptedUrl);
    return res.json({ downloadUrl: decryptedUrl });
  }

  try {
    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
    const apiUrl = process.env.PAYPAL_API_URL || 'https://api-m.paypal.com';

    const tokenRes = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!tokenRes.ok) {
      throw new Error('PayPal auth failed. Check credentials.');
    }

    const { access_token } = await tokenRes.json();

    const orderRes = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!orderRes.ok) {
      throw new Error(`PayPal order fetch failed (${orderRes.status})`);
    }

    const orderData = await orderRes.json();

    if (orderData.status === 'COMPLETED') {
      const decryptedUrl = decrypt(encryptedUrl);
      return res.json({ downloadUrl: decryptedUrl });
    } else {
      return res.status(402).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('verify-order error:', error);
    return res.status(500).json({ error: error.message });
  }
}
