import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

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
const upload = multer(); // akan digunakan di dalam recording
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

// server-nya harus di-serve dulu!
app.listen(appPort, () => {
  console.log(`Server running in port ${appPort}`);
});
