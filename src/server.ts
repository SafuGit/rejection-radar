import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { otp, users } from './db/schema';
import jwt from 'jsonwebtoken';
import { and, desc, eq, gt } from 'drizzle-orm';
import nodemailer from 'nodemailer';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

function verifyJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env['JWT_SECRET'];

  if (!secret) {
    return res.status(500).json({ message: 'JWT_SECRET not configured' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // attach user info to request
    (req as any).user = decoded;
    next();
    return;
  });

  return;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  auth: {
    user: 'mafalda.rippin2@ethereal.email',
    pass: '7WbJteKYakXcRaZ868',
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// *Send Email OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.length === 0) return res.status(404).send({ message: 'Email not found' });

  const generatedOTP = generateOTP();
  try {
    await db.insert(otp).values({
      userId: user[0].id,
      otp: generatedOTP,
      expiresIn: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    });

    await transporter.sendMail({
      from: "Rejection Radar <no-reply@rejectionradar.com>",
      to: email,
      subject: 'Your Verification Code',
      html: `<p>Your verification code is: <strong>${generatedOTP}</strong></p><p>This code will expire in 10 minutes.</p>`,
    });

    return res.status(200).send({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).send({ message: 'Error sending OTP', error });
  }
});

// *Verify Email OTP
app.post('/api/auth/verify-token', async (req, res) => {
  const { email, otp: otpInput } = req.body;
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.length === 0) return res.status(404).send({ message: 'Email not found' });

  const now = new Date();
  const validOtp = await db
    .select()
    .from(otp)
    .where(and(eq(otp.userId, user[0].id), gt(otp.expiresIn, now), eq(otp.otp, otpInput)))
    .orderBy(desc(otp.id))
    .limit(1);

  if (!validOtp || validOtp.length === 0 || validOtp[0].otp !== otpInput) {
    return res.status(401).send({ message: 'Invalid or expired OTP' });
  }

  await db.delete(otp).where(eq(otp.id, validOtp[0].id));
  await db.update(users).set({ emailVerified: true }).where(eq(users.id, user[0].id));

  const secret = process.env['JWT_SECRET'];

  if (!secret) return res.json({ message: 'JWT_SECRET environment variable is not defined' });

  const token = jwt.sign({ id: user[0].id, email: user[0].email }, secret, { expiresIn: '1h' });
  return res.json({ token });
});

// *Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const [newUser] = await db.insert(users).values({
      email,
      passwordHash: hashed,
    }).returning();

    const generatedOTP = generateOTP();
    await db.insert(otp).values({
      userId: newUser.id,
      otp: generatedOTP,
      expiresIn: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    });

    await transporter.sendMail({
      from: "Rejection Radar <no-reply@rejectionradar.com>",
      to: email,
      subject: 'Verify Your Email',
      html: `<p>Welcome to Rejection Radar!</p><p>Your verification code is: <strong>${generatedOTP}</strong></p><p>This code will expire in 10 minutes.</p>`,
    });

    return res.status(201).send({ message: 'User registered successfully. Please check your email for verification code.' });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).send({ message: 'Error registering user', error });
  }
});

// *Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user || user.length === 0)
    return res.status(401).send({ message: 'Invalid email or password' });

  if (!user[0].emailVerified) {
    return res.status(403).json({ message: 'Email not verified' });
  }

  const match = await bcrypt.compare(password, user[0].passwordHash);
  if (!match) return res.status(401).send({ message: 'Invalid email or password' });

  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    return res.json({ message: 'JWT_SECRET environment variable is not defined' });
  }

  const token = jwt.sign({ id: user[0].id, email: user[0].email }, secret, { expiresIn: '1h' });
  return res.json({ token });
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) => (response ? writeResponseToNodeResponse(response, res) : next()))
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
