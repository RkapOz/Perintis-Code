import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const MODEL = "gemini-2.0-flash-exp";

// ---------------------------------------------------------------
// 1. TEXT GENERATION
// ---------------------------------------------------------------
app.post('/generate-text', async (req, res) => {
  try {
    const { prompt } = req.body;

    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent(prompt);

    res.json({ result: result.response.text() });
  } catch (err) {
    console.error("Text Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// 2. TEXT FROM IMAGE (VISION)
// ---------------------------------------------------------------
app.post('/generate-from-image', upload.single("image"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Describe this image";
    const file = req.file;

    const imageData = fs.readFileSync(file.path);
    const base64Image = imageData.toString("base64");

    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.mimetype
        }
      }
    ]);

    // Hapus file cache
    fs.unlinkSync(file.path);

    res.json({ result: result.response.text() });

  } catch (err) {
    console.error("Image Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// 3. TEXT FROM DOCUMENT (PDF / DOCX / TXT)
// ---------------------------------------------------------------
app.post('/generate-from-document', upload.single("document"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Summarize this document.";
    const file = req.file;

    const fileData = fs.readFileSync(file.path);
    const base64File = fileData.toString("base64");

    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64File,
          mimeType: file.mimetype
        }
      }
    ]);

    fs.unlinkSync(file.path);

    res.json({ result: result.response.text() });

  } catch (err) {
    console.error("Document Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------
// 4. TEXT FROM AUDIO (Speech → Text → Gemini Reasoning)
// ---------------------------------------------------------------
app.post('/generate-from-audio', upload.single("audio"), async (req, res) => {
  try {
    const prompt = req.body.prompt || "Transcribe this audio";
    const file = req.file;

    const audioData = fs.readFileSync(file.path);
    const base64Audio = audioData.toString("base64");

    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Audio,
          mimeType: file.mimetype   // contoh: audio/mpeg, audio/wav
        }
      }
    ]);

    fs.unlinkSync(file.path);

    res.json({ result: result.response.text() });

  } catch (err) {
    console.error("Audio Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`API Ready at http://localhost:${PORT}`);
});
