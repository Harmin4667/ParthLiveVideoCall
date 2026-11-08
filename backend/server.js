import 'dotenv/config';"^16.6.1"
import express from 'express';
import cors from 'cors';
import crypto from 'node:crypto';
import { AccessToken } from 'livekit-server-sdk';

const app = express();
app.use(express.json({ limit: '32kb' }));
app.use(cors({ origin: true }));

const PORT = Number(process.env.PORT || 3001);
const ADMIN_PIN = process.env.ADMIN_PIN || 'change-this-pin';
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';
const rooms = new Map(); // MVP only: rooms reset when backend restarts.

const clean = (v, max = 80) => String(v ?? '').trim().slice(0, max);
const safeEqual = (a, b) => {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
};
const requireAdmin = (req, res, next) => {
  const pin = req.header('x-admin-pin') || req.body?.adminPin;
  if (!safeEqual(pin || '', ADMIN_PIN)) return res.status(401).json({ error: 'Admin PIN ખોટો છે.' });
  next();
};

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'Parth Live Video Call' }));

app.post('/api/rooms', requireAdmin, (req, res) => {
  const password = clean(req.body?.password, 100);
  const title = clean(req.body?.title || 'Parth Live Room', 60);
  if (password.length < 4) return res.status(400).json({ error: 'Room password ઓછામાં ઓછો 4 અક્ષરનો હોવો જોઈએ.' });
  const roomId = crypto.randomBytes(5).toString('hex');
  rooms.set(roomId, { password, title, createdAt: Date.now() });
  res.json({ roomId, title, guestUrl: `${process.env.APP_ORIGIN || 'http://localhost:5173'}/join/${roomId}` });
});

app.post('/api/token', async (req, res) => {
  try {
    const roomId = clean(req.body?.roomId, 32);
    const password = clean(req.body?.password, 100);
    const identity = clean(req.body?.identity || `guest-${crypto.randomBytes(3).toString('hex')}`, 48)
      .replace(/[^a-zA-Z0-9_-]/g, '');
    const room = rooms.get(roomId);
    if (!room || !safeEqual(password, room.password)) {
      return res.status(403).json({ error: 'Room ID અથવા password ખોટો છે.' });
    }
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: identity || `guest-${crypto.randomBytes(3).toString('hex')}`,
      name: clean(req.body?.name || 'Guest', 48),
      ttl: '2h'
    });
    at.addGrant({ roomJoin: true, room: roomId, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    res.json({ token, serverUrl: LIVEKIT_URL, roomId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Token બનાવી શકાયો નથી.' });
  }
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = rooms.get(clean(req.params.roomId, 32));
  if (!room) return res.status(404).json({ error: 'Room મળ્યો નથી અથવા server restart થયો છે.' });
  res.json({ roomId: req.params.roomId, title: room.title });
});

app.listen(PORT, () => console.log(`Parth backend running at http://localhost:${PORT}`));
