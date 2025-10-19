import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createUserContent } from "@google/genai/node";
import { createPartFromUri } from "@google/genai/web";

// inisialisasi aplikasi
//
// deklarasi variable di JavaScript
// [cons|let][namaVariable] = [value]
// [var] --> nggak boleh dipake lagi (fungsinya sudah digantikan oleh cons/let di ES2015)
// [var] --> global declaration (var namaOrang)
//
// [const] --> 1x declare, nggak bisa diubah-ubah lagi
// [let]   --> 1x declare, tapi bisa diubah-ubah (re-assignment)
//
// tipe data: number, string, boolean (true/false), undefined
// special: null (tipe-nya object, tapi nilainya falsy)

// environment variable
const appPort = process.env.APP_PORT || 3001;
const geminiModel = process.env.GEMINI_MODEL;

const app = express();
const upload = multer({ dest: "uploads/" }); // akan digunakan di dalam recording
const ai = new GoogleGenAI({}); //instantiation menjadi object instance (OOP - Object Oriented Programming)

// inisialisasi middleware
// contoh: app.use(namaMiddleware());
app.use(cors()); // inisialisasi CORS (Cross-Origin Resource Sharing) sebagai middleware
app.use(express.json());

// inisialisasi routing
// contoh: app.get(), app.post(), app.put(), dll
// -- get/post/put itu bagian dari standar HTTP
// HTTP Methods:
// GET, PUT, POST, PATCH, DELETE, OPTIONS, HEAD
//
//Functions (* --> yang digunakan di sesi kali ini)
//
// secara penulisannya
// function biasa --> function namaFunction(){}
// [*] arrow function --> [const namaFunction=]() => {}
//
// secara alurnya
// syncronous --> () => {}
// [*] asyncronous --> async () => {}
app.post("/generate-text", async (req, res) => {
  // terima jeroannya, lalu cek di sini
  const { prompt } = req.body; // object destructuring

  // guard clause (kasarnya, satpam)
  if (!prompt || typeof prompt !== "string") {
    res.status(400).json({
      success: false,
      message: "Prompt harus berupa string!",
      data: null,
    });

    return;
  }

  // jeroannya
  try {
    const aiResponse = await ai.models.generateContent({
      model: geminiModel,
      // contents: [{ text: prompt }],
      contents: prompt,
      // ini untuk config AI-nya lebih jauh lagi
      config: {
        systemInstruction: "Harus dibalas dalam bahasa Jawa.",
      },
    });

    res.status(200).json({
      success: true,
      message: "Berhasil direspon sama Gemini nih!",
      data: aiResponse.text,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Gagal, kayaknya server lagi bermasalah!",
      data: aiResponse.text,
    });
  }
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const { prompt = "Describe this uploaded image" } = req.body;

  try {
    const image = await ai.files.upload({
      file: req.file.path,
      config: {
        mimeType: req.file.mimetype,
      },
    });

    const result = await ai.models.generateContent({
      model: geminiModel,
      contents: [
        createUserContent([
          prompt,
          createPartFromUri(image.uri, image.mimeType),
        ]),
      ],
    });

    res.json({ output: result.text });
  } catch (e) {
    console.error("Error generating content:", e);
    res.status(500).json({
      success: false,
      message: "Gagal, kayaknya server lagi bermasalah!",
      data: aiResponse.text,
    });
  } finally {
    // Cleanup uploaded file
    fs.unlinkSync(req.file.path);
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const { prompt = "Describe this uploaded document" } = req.body;

    try {
      const filePath = req.file.path;
      const buffer = fs.readFileSync(filePath);
      const base64Data = buffer.toString("base64");
      const mimeType = req.file.mimetype;

      const documentPart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };

      const result = await ai.models.generateContent({
        model: geminiModel,
        contents: [createUserContent([prompt, documentPart])],
      });

      res.json({ output: result.text });
    } catch (e) {
      console.error("Error generating content:", e);
      res.status(500).json({
        success: false,
        message: "Gagal, kayaknya server lagi bermasalah!",
        data: aiResponse.text,
      });
    } finally {
      // Cleanup uploaded file
      fs.unlinkSync(req.file.path);
    }
  },
);

// server-nya harus di-serve dulu!
app.listen(appPort, () => {
  console.log(`Server running in port ${appPort}`);
});
