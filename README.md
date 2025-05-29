# Next.js Supabase App

Aplikasi Todo dengan Next.js, TailwindCSS, dan Supabase. Proyek ini dibuat sebagai contoh integrasi teknologi modern untuk pengembangan web.

## Teknologi yang Digunakan

- **Next.js 15**: Framework React dengan fitur App Router, Server Components, dan optimasi performa.
- **TailwindCSS 4**: Framework CSS utility-first untuk desain cepat dan responsif.
- **Supabase**: Platform backend open source dengan database PostgreSQL, autentikasi, dan API real-time.
- **TypeScript**: Superset JavaScript dengan pengetikan statis untuk pengembangan yang lebih aman.

## Fitur

- Autentikasi pengguna (login, register, logout)
- Manajemen profil pengguna
- Aplikasi Todo dengan operasi CRUD
- Real-time updates dengan Supabase Realtime
- Desain responsif dengan TailwindCSS
- Tema gelap/terang otomatis

## Cara Memulai

### Prasyarat

- Node.js (versi 18 atau lebih baru)
- npm atau yarn
- Akun Supabase

### Langkah-langkah

1. **Clone repositori**

   ```bash
   git clone <url-repositori>
   cd nextjs-supabase-app
   ```

2. **Instal dependensi**

   ```bash
   npm install
   # atau
   yarn install
   ```

3. **Konfigurasi Supabase**

   - Buat proyek baru di [Supabase](https://supabase.com)
   - Buat tabel `todos` dengan struktur berikut:
     ```sql
     create table todos (
       id uuid default uuid_generate_v4() primary key,
       user_id uuid references auth.users(id) not null,
       task text not null,
       is_complete boolean default false,
       created_at timestamp with time zone default now()
     );
     ```
   - Buat tabel `profiles` dengan struktur berikut:
     ```sql
     create table profiles (
       id uuid references auth.users(id) primary key,
       username text,
       full_name text,
       avatar_url text,
       updated_at timestamp with time zone default now()
     );
     ```
   - Atur kebijakan keamanan (RLS) untuk kedua tabel

4. **Konfigurasi lingkungan**

   - Salin file `.env.local.example` menjadi `.env.local`
   - Isi dengan URL dan kunci anonim Supabase Anda

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Jalankan aplikasi**

   ```bash
   npm run dev
   # atau
   yarn dev
   ```

6. **Buka aplikasi**

   Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

## Struktur Proyek

```
/src
  /app                  # App Router Next.js
    /auth               # Halaman autentikasi
    /profile            # Halaman profil pengguna
    /todos              # Halaman daftar tugas
    layout.tsx          # Layout utama aplikasi
    page.tsx            # Halaman beranda
  /components           # Komponen React
    Auth.tsx            # Komponen autentikasi
    Navbar.tsx          # Navigasi aplikasi
    Profile.tsx         # Komponen profil pengguna
    TodoList.tsx        # Komponen daftar tugas
  /lib                  # Utilitas dan konfigurasi
    supabase.ts         # Konfigurasi klien Supabase
```

## Pengembangan Lebih Lanjut

- Tambahkan fitur upload gambar profil
- Implementasikan fitur berbagi tugas dengan pengguna lain
- Tambahkan kategori dan tag untuk tugas
- Implementasikan notifikasi untuk tenggat waktu tugas
- Tambahkan fitur ekspor/impor data

## Lisensi

MIT
