import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express, { NextFunction, Request, Response } from 'express';
import { join, parse } from 'node:path';
import bcrypt from 'bcryptjs';
import { db } from './db';
import { otp, users } from './db/schema';
import jwt from 'jsonwebtoken';
import { and, desc, eq, gt } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import Busboy from 'busboy';
import pdf from 'pdf-parse';
import { parseCVtoJSON } from './app/util/cvToJson';
import { parseJobPostingToJSON } from './app/util/jdToJson';
import { websiteReport } from './app/util/htmlreport';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

const apiRouter = express.Router();
apiRouter.use(express.json());
apiRouter.use(express.urlencoded({ extended: true }));

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
  host: process.env['SMTP_HOST'],
  port: parseInt(process.env['SMTP_PORT'] || '587', 10),
  auth: {
    user: process.env['SMTP_USER'],
    pass: process.env['SMTP_PASS'],
  },
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// *Send Email OTP
apiRouter.post('/auth/send-otp', async (req, res) => {
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
apiRouter.post('/auth/verify-token', async (req, res) => {
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
apiRouter.post('/auth/register', async (req, res) => {
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
apiRouter.post('/auth/login', async (req, res) => {
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

// *Upload CV
apiRouter.post('/upload-cv', verifyJWT, async (req, res) => {
  try {

    const busboy = Busboy({
      headers: req.headers,
      limits: {
        fileSize: 10 * 1024 * 1024,
      }
    });

    req.pipe(busboy);

    let pdfBuffer = Buffer.alloc(0);

    busboy.on('file', (fieldname, file, info) => {
      const { mimeType } = info;
      if (mimeType !== 'application/pdf') {
        file.resume();
        return res.status(400).json({ message: 'Only PDF files are allowed' });
      }

      file.on('data', (data) => {
        pdfBuffer = Buffer.concat([pdfBuffer, data]);
        return;
      });

      return;
    });

    busboy.on('finish', async () => {
      if (!pdfBuffer.length) {
        return res.status(400).json({ message: 'No CV uploaded' });
      }

      try {
        const parsed = await pdf(pdfBuffer);

        const extractedText = parsed.text.trim();

        if (!extractedText) {
          return res.status(400).json({ message: 'Unable to extract text from PDF' });
        }

        const parsedJson = await parseCVtoJSON(extractedText);

        return res.status(200).json({
          message: 'CV parsed successfully',
          text: extractedText,
          pages: parsed.numpages,
          cvJson: parsedJson,
        });
      } catch (err) {
        console.error('PDF parse error:', err);
        return res.status(400).json({ message: 'Invalid or corrupted PDF' });
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Error uploading CV', error: err });
  }
});

// *Parse JD
apiRouter.post('/parse-jd', verifyJWT, async (req, res) => {
  const { jd } = req.body;
  if (!jd || jd.trim() === '') {
    return res.status(400).json({ message: 'Job description is required' });
  }

  try {
    const parsedJD = await parseJobPostingToJSON(jd);
    return res.status(200).json({ message: 'JD parsed successfully', jdJson: parsedJD });
  } catch (err) {
    console.error('JD parse error:', err);
    return res.status(500).json({ message: 'Error parsing job description', error: err });
  }
});

// *Get Website HTML & Analyze
apiRouter.get('/website-analysis', async (req, res) => {
  const { url } = req.query;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL query parameter is required' });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return res.status(500).json({ error: 'Failed to fetch the website' });
  }

  const html = await response.text();
  const result = await websiteReport(html);
  if (!result) {
    return res.status(500).json({ error: 'Failed to analyze the website' });
  }

  return res.status(200).json({ analysis: result });
});

// Mount API router
app.use('/api', apiRouter);

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
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) return next();

  try {
    const response = await angularApp.handle(req, { cloneRequest: true });
    if (response) {
      writeResponseToNodeResponse(response, res);
    } else {
      next();
    }
  } catch (err) {
    next(err);
  }
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
