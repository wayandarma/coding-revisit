import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Validasi API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key tidak ditemukan" },
        { status: 500 }
      );
    }

    // Inisialisasi Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Ambil data dari request body
    const { description, minTasks, maxTasks } = await req.json();

    // Validasi input
    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Deskripsi tugas tidak boleh kosong" },
        { status: 400 }
      );
    }

    if (minTasks < 1 || maxTasks < minTasks || maxTasks > 20) {
      return NextResponse.json(
        { error: "Range tugas tidak valid" },
        { status: 400 }
      );
    }

    // Buat prompt yang detail untuk Gemini
    const prompt = `
Anda adalah asisten AI yang membantu membuat daftar tugas (todo list) yang terstruktur dan actionable.

Berdasarkan deskripsi berikut: "${description}"

Buatlah daftar tugas yang:
1. Spesifik dan dapat dilakukan (actionable)
2. Terurut secara logis berdasarkan prioritas atau timeline
3. Realistis dan dapat dicapai
4. Menggunakan bahasa Indonesia yang jelas
5. Jumlah tugas antara ${minTasks} hingga ${maxTasks} item

Format output:
- Berikan HANYA daftar tugas dalam format JSON array
- Setiap item adalah string yang merepresentasikan satu tugas
- Jangan tambahkan penjelasan atau teks lain
- Contoh format: ["Tugas 1", "Tugas 2", "Tugas 3"]

Pastikan setiap tugas:
- Dimulai dengan kata kerja aktif
- Jelas dan spesifik
- Tidak terlalu umum atau terlalu detail
- Dapat diselesaikan dalam waktu yang wajar
`;

    // Generate content dengan Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    // Parse response untuk mendapatkan array tugas
    let tasks: string[] = [];

    try {
      // Coba parse sebagai JSON
      const cleanedText = generatedText.trim();

      // Cari JSON array dalam response
      const jsonMatch = cleanedText.match(/\[.*\]/s);
      if (jsonMatch) {
        tasks = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: split by lines dan clean up
        tasks = cleanedText
          .split("\n")
          .map((line) => line.trim())
          .filter(
            (line) => line && !line.startsWith("```") && !line.startsWith("#")
          )
          .map((line) => line.replace(/^[\d\-\*\.\s]+/, "").trim())
          .filter((line) => line.length > 0)
          .slice(0, maxTasks);
      }
    } catch (parseError) {
      // Jika parsing gagal, fallback ke split manual
      tasks = generatedText
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) => line && !line.startsWith("```") && !line.startsWith("#")
        )
        .map((line) => line.replace(/^[\d\-\*\.\s]+/, "").trim())
        .filter((line) => line.length > 0)
        .slice(0, maxTasks);
    }

    // Validasi hasil
    if (tasks.length === 0) {
      return NextResponse.json(
        { error: "Gagal menghasilkan tugas dari deskripsi yang diberikan" },
        { status: 500 }
      );
    }

    // Pastikan jumlah tugas sesuai range
    if (tasks.length < minTasks) {
      // Jika kurang dari minimum, tambahkan tugas generik
      const additionalTasks = [
        "Review dan evaluasi progress",
        "Dokumentasi hasil kerja",
        "Persiapan untuk tahap selanjutnya",
        "Backup dan simpan file penting",
        "Komunikasi dengan tim terkait",
      ];

      while (tasks.length < minTasks && additionalTasks.length > 0) {
        tasks.push(additionalTasks.shift()!);
      }
    }

    // Batasi sesuai maksimum
    tasks = tasks.slice(0, maxTasks);

    return NextResponse.json({
      success: true,
      tasks: tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error("Error generating todos:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghasilkan tugas" },
      { status: 500 }
    );
  }
}
