/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { CreditSurvey, AIAnalysis, FieldUser, Office, SurveyScheme } from "./src/types.js";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, deleteDoc } from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Firebase Firestore connection using pre-configured applet credential file
const CONFIG_FILE = path.join(process.cwd(), "firebase-applet-config.json");
const firebaseConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
const firebaseApp = initializeApp(firebaseConfig);
const dbFirestore = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// System Offices
const OFFICES: Office[] = [
  // KP 1
  { id: "kp1-pusat", name: "Kantor Pusat - KP 1", region: "KP1", type: "KANTOR_PUSAT" },
  { id: "kp1-kauman", name: "Kantor Kas Kauman", region: "KP1", type: "KANTOR_KAS" },
  { id: "kp1-ngantru", name: "Kantor Kas Ngantru", region: "KP1", type: "KANTOR_KAS" },
  { id: "kp1-ngemplak", name: "Kantor Kas Ngemplak", region: "KP1", type: "KANTOR_KAS" },
  { id: "kp1-karangrejo", name: "Kantor Kas Karangrejo", region: "KP1", type: "KANTOR_KAS" },
  // KP 2
  { id: "kp2-pusat", name: "Kantor Pusat - KP 2", region: "KP2", type: "KANTOR_PUSAT" },
  { id: "kp2-ngunut", name: "Kantor Kas Ngunut", region: "KP2", type: "KANTOR_KAS" },
  { id: "kp2-kalidawir", name: "Kantor Kas Kalidawir", region: "KP2", type: "KANTOR_KAS" },
  { id: "kp2-rejotangan", name: "Kantor Kas Rejotangan", region: "KP2", type: "KANTOR_KAS" },
  { id: "kp2-pucanglaban", name: "Kantor Kas Pucanglaban", region: "KP2", type: "KANTOR_KAS" },
  // Cabang Campurdarat
  { id: "cab-campurdarat", name: "Kantor Cabang Campurdarat", region: "CAMPURDARAT", type: "CABANG" },
  { id: "cab-bandung", name: "Kantor Kas Bandung", region: "CAMPURDARAT", type: "KANTOR_KAS" },
  { id: "cab-boyolangu", name: "Kantor Kas Boyolangu", region: "CAMPURDARAT", type: "KANTOR_KAS" },
  { id: "cab-pakel", name: "Kantor Kas Pakel", region: "CAMPURDARAT", type: "KANTOR_KAS" },
  { id: "cab-ngentrong", name: "Kantor Kas Ngentrong", region: "CAMPURDARAT", type: "KANTOR_KAS" }
];

// Initial seeded users
const INITIAL_USERS: FieldUser[] = [
  {
    email: "admin@banktulungagung.co.id",
    name: "Hendra Admin Utama",
    role: "ADMIN",
    nik: "3504011202800001",
    officeId: "kp1-pusat",
    status: "APPROVED",
    createdAt: "2026-06-01T00:00:00Z",
    username: "admin",
    password: "bank123"
  },
  {
    email: "appslaporan@gmail.com",
    name: "Alhuda (Admin)",
    role: "ADMIN",
    nik: "3504011202800002",
    officeId: "kp1-pusat",
    status: "APPROVED",
    createdAt: "2026-06-01T00:00:00Z",
    username: "alhuda",
    password: "bank123"
  },
  {
    email: "alhuda@banktulungagung.co.id",
    name: "Alhuda (Admin Utama)",
    role: "ADMIN",
    nik: "3504011202800003",
    officeId: "kp1-pusat",
    status: "APPROVED",
    createdAt: "2026-06-01T00:00:00Z",
    username: "alhuda2",
    password: "bank123"
  },
  // KP 1
  {
    email: "mo.kurniawan@banktulungagung.co.id",
    name: "Kurniawan (MO KP1)",
    role: "MO",
    nik: "3504121508940002",
    officeId: "kp1-kauman",
    status: "APPROVED",
    createdAt: "2026-06-01T02:00:00Z",
    username: "mo.kurniawan",
    password: "bank123"
  },
  {
    email: "kasubag.kp1@banktulungagung.co.id",
    name: "Budi Santoso (Kasubag KP1)",
    role: "KASUBAG",
    nik: "3504022405820003",
    officeId: "kp1-pusat",
    status: "APPROVED",
    createdAt: "2026-06-01T02:05:00Z",
    username: "kasubag.kp1",
    password: "bank123"
  },
  {
    email: "kabag.kredit1@banktulungagung.co.id",
    name: "Sugeng Riyadi (Kabag Kredit 1)",
    role: "KABAG",
    nik: "3504010311750001",
    officeId: "kp1-pusat",
    status: "APPROVED",
    createdAt: "2026-06-01T02:10:00Z",
    username: "kabag.kredit1",
    password: "bank123"
  },
  // KP 2
  {
    email: "mo.prakoso@banktulungagung.co.id",
    name: "Dwi Prakoso (MO KP2)",
    role: "MO",
    nik: "3504221109960001",
    officeId: "kp2-ngunut",
    status: "APPROVED",
    createdAt: "2026-06-02T01:00:00Z",
    username: "mo.prakoso",
    password: "bank123"
  },
  {
    email: "kasubag.kp2@banktulungagung.co.id",
    name: "Endang Tri (Kepala Kas Ngunut)",
    role: "KASUBAG",
    nik: "3504201802840004",
    officeId: "kp2-pusat",
    status: "APPROVED",
    createdAt: "2026-06-02T01:10:00Z",
    username: "kasubag.kp2",
    password: "bank123"
  },
  {
    email: "kabag.kredit2@banktulungagung.co.id",
    name: "Prasetyo (Kabag Kredit 2)",
    role: "KABAG",
    nik: "3504012010720002",
    officeId: "kp2-pusat",
    status: "APPROVED",
    createdAt: "2026-06-02T01:20:00Z",
    username: "kabag.kredit2",
    password: "bank123"
  },
  // Cabang Campurdarat
  {
    email: "mo.anita@banktulungagung.co.id",
    name: "Anita Rahma (MO Campurdarat)",
    role: "MO",
    nik: "3504104205930005",
    officeId: "cab-bandung",
    status: "APPROVED",
    createdAt: "2026-06-03T02:00:00Z",
    username: "mo.anita",
    password: "bank123"
  },
  {
    email: "kasubag.campurdarat@banktulungagung.co.id",
    name: "Wahyudi (Kasubag Campurdarat)",
    role: "KASUBAG",
    nik: "3504121510850001",
    officeId: "cab-campurdarat",
    status: "APPROVED",
    createdAt: "2026-06-03T02:10:00Z",
    username: "kasubag.campurdarat",
    password: "bank123"
  },
  {
    email: "pimpinan.campurdarat@banktulungagung.co.id",
    name: "Bambang Widjojo (Pimcab Campurdarat)",
    role: "KABAG",
    nik: "3504011212700001",
    officeId: "cab-campurdarat",
    status: "APPROVED",
    createdAt: "2026-06-03T02:20:00Z",
    username: "pimpinan.campurdarat",
    password: "bank123"
  },
  // PENDING Registration Mock accounts to show User Approval feature!
  {
    email: "mo.lapangan@banktulungagung.co.id",
    name: "Rian Hidayat (MO Baru)",
    role: "MO",
    nik: "3504151205970002",
    officeId: "cab-boyolangu",
    status: "PENDING",
    createdAt: "2026-06-04T01:30:00Z",
    username: "mo.lapangan",
    password: "bank123"
  },
  {
    email: "kasubag.baru@banktulungagung.co.id",
    name: "Siti Rahayu (Pendaftar Kasubag)",
    role: "KASUBAG",
    nik: "3504054412900001",
    officeId: "kp1-ngemplak",
    status: "PENDING",
    createdAt: "2026-06-04T03:45:00Z",
    username: "kasubag.baru",
    password: "bank123"
  }
];

// Initial preloaded surveys
const INITIAL_SURVEYS: CreditSurvey[] = [
  {
    id: "SRV-2026-001",
    borrowerName: "Haji Slamet Raharjo",
    nik: "3504121205680001",
    phone: "081234567891",
    address: "Jl. Raya Campurdarat No. 45, Kecamatan Campurdarat, Tulungagung",
    businessType: "Kerajinan Batu Marmer & Granit",
    businessAge: 12,
    requestedAmount: 75000000,
    requestedTenor: 24,
    monthlyRevenue: 45000000,
    monthlyExpenses: 28000000,
    netMonthlyIncome: 17000000,
    collateralType: "SHM",
    collateralDescription: "SHM Tanah dan Bangunan Rumah No. 402/Campurdarat, luas 250m2",
    collateralValue: 150000000,
    moNotes: "Debitur memiliki reputasi yang sangat baik di lingkungan pengrajin marmer Campurdarat. Pesanan marmer rutin mengalir ke luar kota. Rumah milik sendiri, agunan SHM atas nama sendiri dan sangat marketable.",
    gpsLatitude: -8.1724,
    gpsLongitude: 111.8791,
    gpsAddress: "Campurdarat, Tulungagung, Jawa Timur",
    photoUrl: null,
    photoKtp: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
    photoDebitur: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    surveyPhotos: {
      rumah: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400"
      ],
      usaha: [
        "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400",
        "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
        "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400"
      ],
      stok: [
        "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
        "https://images.unsplash.com/photo-1553413719-8758737371b2?w=400",
        "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=400",
        "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400"
      ],
      agunan: [
        "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
        "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400",
        "https://images.unsplash.com/photo-1512403754473-278556139b6a?w=400",
        "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400"
      ]
    },
    photoCoordinates: {
      rumah: [
        { lat: -8.1724, lng: 111.8791 },
        { lat: -8.1725, lng: 111.8792 },
        { lat: -8.1723, lng: 111.8790 },
        { lat: -8.1726, lng: 111.8793 }
      ],
      usaha: [
        { lat: -8.1724, lng: 111.8791 },
        { lat: -8.1725, lng: 111.8792 },
        { lat: -8.1723, lng: 111.8790 },
        { lat: -8.1726, lng: 111.8793 }
      ],
      stok: [
        { lat: -8.1724, lng: 111.8791 },
        { lat: -8.1725, lng: 111.8792 },
        { lat: -8.1723, lng: 111.8790 },
        { lat: -8.1726, lng: 111.8793 }
      ],
      agunan: [
        { lat: -8.1724, lng: 111.8791 },
        { lat: -8.1725, lng: 111.8792 },
        { lat: -8.1723, lng: 111.8790 },
        { lat: -8.1726, lng: 111.8793 }
      ]
    },
    status: "APPROVED",
    createdAt: "2026-06-01T08:30:00Z",
    updatedAt: "2026-06-02T14:15:00Z",
    surveyorEmail: "mo.kurniawan@banktulungagung.co.id",
    officeId: "kp1-kauman",
    scheme: "PJI",
    scores5c: {
      character: 95,
      capacity: 90,
      capital: 85,
      collateral: 95,
      condition: 90,
      qCharacter: "Hubungan baik dengan pembeli marmer nasional, tidak memiliki catatan SLIK jelek.",
      qCapacity: "Arus kas harian sangat tinggi, penutupan angsuran sisa kas sisa Rp17.000.000 bersih.",
      qCapital: "60% modal mandiri modal sendiri, tidak tergantung hutang lain.",
      qCollateral: "SHM di pusat perkotaan Campurdarat, taksiran nilai s/d Rp150.000.000.",
      qCondition: "Minat marmer Tulungagung tinggi pasca pembangunan infrastruktur baru."
    },
    kasubagEmail: "kasubag.kp1@banktulungagung.co.id",
    kasubagNotes: "Usaha marmer Haji Slamet terpantau ramai. Omzet stabil. Rekomendasi plafon penuh IDR 75.000.000 dengan tenor tetap 24 bulan.",
    kasubagApprovedAmount: 75000000,
    kasubagActionAt: "2026-06-02T10:00:00Z",
    kabagEmail: "kabag.kredit1@banktulungagung.co.id",
    kabagNotes: "Komite kredit menyetujui pengajuan ini. Karakter dan agunan sangat kuat untuk meng-cover risiko kredit mikro.",
    kabagApprovedAmount: 75000000,
    kabagActionAt: "2026-06-02T14:15:00Z",
    ewsScore: 1,
    aiAnalysis: {
      riskAssessment: "LOW",
      scoringModel: 92,
      ewsFactors: [
        "Usaha sudah berjalan lama (>10 tahun) memberikan ketahanan bisnis tinggi",
        "Debt Service Ratio sangat sehat, angsuran bulanan diperkirakan ter-cover 4x lipat sisa pendapatan bersih",
        "Agunan SHM bernilai 200% dari nominal kredit yang diajukan",
        "Faktor risiko: Ketergantungan pada bahan baku batu marmer alam dari luar daerah yang fluktuatif"
      ],
      recommendationLimit: 75000000,
      narrativeSummary: "Analisis AI menunjukkan Haji Slamet Raharjo memiliki kelayakan kredit yang sangat tinggi berdasarkan profil usaha kerajinan marmer yang sudah matang di Sentra Campurdarat. Cashflow kuat dengan kapasitas angsuran prima. Agunan SHM memberikan jaminan likuidasi risiko yang sangat aman bagi BPR Bank Tulungagung.",
      businessViability: "SEHAT",
      repaymentCapacity: "KUAT",
      capacityRatio: 25
    }
  },
  {
    id: "SRV-2026-002",
    borrowerName: "Ibu Sumiati",
    nik: "3504095408790003",
    phone: "085678901234",
    address: "Jl. Demuk Gg. 3, Kecamatan Kauman, Tulungagung",
    businessType: "Warung Makan Ayam Lodho Khas Tulungagung",
    businessAge: 4,
    requestedAmount: 30000000,
    requestedTenor: 12,
    monthlyRevenue: 28000000,
    monthlyExpenses: 21000000,
    netMonthlyIncome: 7000000,
    collateralType: "BPKB",
    collateralDescription: "BPKB Sepeda Motor Honda Vario 150 Tahun 2022 No. Pol AG 4192 RDG",
    collateralValue: 14000000,
    moNotes: "Membuka warung kuliner Ayam Lodho yang cukup terkenal di sekitar Kauman. Pengunjung ramai terutama saat makan siang. Agunan motor dipergunakan untuk operasional harian.",
    gpsLatitude: -8.0642,
    gpsLongitude: 111.8711,
    gpsAddress: "Kauman, Tulungagung, Jawa Timur",
    photoUrl: null,
    photoKtp: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
    photoDebitur: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400",
    surveyPhotos: {
      rumah: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400"
      ],
      usaha: [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400"
      ],
      stok: [
        "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400",
        "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400",
        "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400",
        "https://images.unsplash.com/photo-1512152272829-e3139592d56f?w=400"
      ],
      agunan: [
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400",
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400",
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400",
        "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=400"
      ]
    },
    photoCoordinates: {
      rumah: [
        { lat: -8.0642, lng: 111.8711 },
        { lat: -8.0643, lng: 111.8712 },
        { lat: -8.0641, lng: 111.8710 },
        { lat: -8.0644, lng: 111.8713 }
      ],
      usaha: [
        { lat: -8.0642, lng: 111.8711 },
        { lat: -8.0643, lng: 111.8712 },
        { lat: -8.0641, lng: 111.8710 },
        { lat: -8.0644, lng: 111.8713 }
      ],
      stok: [
        { lat: -8.0642, lng: 111.8711 },
        { lat: -8.0643, lng: 111.8712 },
        { lat: -8.0641, lng: 111.8710 },
        { lat: -8.0644, lng: 111.8713 }
      ],
      agunan: [
        { lat: -8.0642, lng: 111.8711 },
        { lat: -8.0643, lng: 111.8712 },
        { lat: -8.0641, lng: 111.8710 },
        { lat: -8.0644, lng: 111.8713 }
      ]
    },
    status: "SUBMITTED_MO",
    createdAt: "2026-06-03T09:15:00Z",
    updatedAt: "2026-06-03T11:45:00Z",
    surveyorEmail: "mo.kurniawan@banktulungagung.co.id",
    officeId: "kp1-kauman",
    scheme: "PJI",
    scores5c: {
      character: 85,
      capacity: 75,
      capital: 70,
      collateral: 50,
      condition: 80,
      qCharacter: "Karakter ulet, jujur, warga asli Kauman.",
      qCapacity: "Omzet harian bersih warung ayam lodho rata-rata Rp200.000 - Rp300.000 per hari.",
      qCapital: "Warung berdiri mandiri, barang-barang milik pribadi.",
      qCollateral: "Cover agunan BPKB motor taksiran nilai Rp14.000.000, di bawah pinjaman diajukan.",
      qCondition: "Persaingan kuliner ayam lodho tinggi, namun rasa masakan Ibu Sumiati sangat khas dan digemari."
    },
    kasubagEmail: null,
    kasubagNotes: null,
    kasubagApprovedAmount: null,
    kasubagActionAt: null,
    kabagEmail: null,
    kabagNotes: null,
    kabagApprovedAmount: null,
    kabagActionAt: null,
    ewsScore: 4,
    aiAnalysis: {
      riskAssessment: "MEDIUM",
      scoringModel: 74,
      ewsFactors: [
        "Usaha makanan harian menghasilkan arus kas masuk yang stabil & likuid",
        "Kapasitas bayar cukup memadai dibanding sisa pendapatan",
        "Peringatan (EWS): Nilai taksiran agunan BPKB Motor (IDR 14jt) lebih rendah dibanding nominal kredit yang diajukan (IDR 30jt)",
        "Rekomendasi: Turunkan plafon kredit menyesuaikan nilai cover agunan fisik, atau tambahkan agunan pendamping"
      ],
      recommendationLimit: 20000000,
      narrativeSummary: "Ibu Sumiati menjalankan Warung Ayam Lodho yang mapan di Kauman dengan arus keuangan harian sehat. Risiko utama terletak pada rasio penutupan agunan (BPKB Motor) yang berada di bawah plafon pengajuan (IDR 30 juta). Disarankan pemberian limit diperingan ke IDR 20.000.000 untuk keamanan hedging risiko.",
      businessViability: "SEHAT",
      repaymentCapacity: "SEDANG",
      capacityRatio: 45
    }
  },
  {
    id: "SRV-2026-003",
    borrowerName: "Bapak Agus Setiawan",
    nik: "3504041111820002",
    phone: "089876543210",
    address: "Kecamatan Boyolangu, Tulungagung",
    businessType: "Budidaya Ikan Gurame Kolam Terpal",
    businessAge: 3,
    requestedAmount: 40000000,
    requestedTenor: 18,
    monthlyRevenue: 35000000,
    monthlyExpenses: 29000000,
    netMonthlyIncome: 6000000,
    collateralType: "SHM",
    collateralDescription: "SHM Pekarangan No. 892/Boyolangu, luas 180m2 atas nama orang tua",
    collateralValue: 80000000,
    moNotes: "Mengusahakan budidaya patin dan gurame sebanyak 6 kolam. Omzet diperoleh per-panen setiap 6-8 bulan sekali, namun debitur memiliki pendapatan warung kelonong kecil di depan rumah untuk harian. Agunan SHM milik orang tua dan ada persetujuan ahli waris.",
    gpsLatitude: -8.0987,
    gpsLongitude: 111.9022,
    gpsAddress: "Boyolangu, Tulungagung, Jawa Timur",
    photoUrl: null,
    photoKtp: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
    photoDebitur: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400",
    surveyPhotos: {
      rumah: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400"
      ],
      usaha: [
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400",
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400",
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400",
        "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=400"
      ],
      stok: [
        "https://images.unsplash.com/photo-1520301255226-bf5f1442e1a5?w=400",
        "https://images.unsplash.com/photo-1520301255226-bf5f1442e1a5?w=400",
        "https://images.unsplash.com/photo-1520301255226-bf5f1442e1a5?w=400",
        "https://images.unsplash.com/photo-1520301255226-bf5f1442e1a5?w=400"
      ],
      agunan: [
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400"
      ]
    },
    photoCoordinates: {
      rumah: [
        { lat: -8.0987, lng: 111.9022 },
        { lat: -8.0988, lng: 111.9023 },
        { lat: -8.0986, lng: 111.9021 },
        { lat: -8.0989, lng: 111.9024 }
      ],
      usaha: [
        { lat: -8.0987, lng: 111.9022 },
        { lat: -8.0988, lng: 111.9023 },
        { lat: -8.0986, lng: 111.9021 },
        { lat: -8.0989, lng: 111.9024 }
      ],
      stok: [
        { lat: -8.0987, lng: 111.9022 },
        { lat: -8.0988, lng: 111.9023 },
        { lat: -8.0986, lng: 111.9021 },
        { lat: -8.0989, lng: 111.9024 }
      ],
      agunan: [
        { lat: -8.0987, lng: 111.9022 },
        { lat: -8.0988, lng: 111.9023 },
        { lat: -8.0986, lng: 111.9021 },
        { lat: -8.0989, lng: 111.9024 }
      ]
    },
    status: "REVIEWED_KASUBAG",
    createdAt: "2026-06-03T14:20:00Z",
    updatedAt: "2026-06-04T07:10:00Z",
    surveyorEmail: "mo.anita@banktulungagung.co.id",
    officeId: "cab-bandung",
    scheme: "PPP",
    scores5c: {
      character: 80,
      capacity: 65,
      capital: 75,
      collateral: 80,
      condition: 60,
      qCharacter: "Anggota aktif kelompok pembudidaya mina lestari Boyolangu.",
      qCapacity: "Pendapatan per panen tinggi tapi musiman (per 6-7 bulan), sela-panen didukung toko kelontong harian.",
      qCapital: "Kapasitas modal terbagi untuk bibit pakan mandiri.",
      qCollateral: "Agunan SHM milik orang tua, surat kuasa siap.",
      qCondition: "Fluktuasi pakan pelet tinggi, butuh pakan alternatif mandiri."
    },
    kasubagEmail: "kasubag.campurdarat@banktulungagung.co.id",
    kasubagNotes: "Pola pendapatan budidaya perikanan bersifat musiman. Namun didukung warung kelontong aktif harian. Agunan SHM cukup aman. Disetujui rekomendasi limit IDR 35.000.000.",
    kasubagApprovedAmount: 35000000,
    kasubagActionAt: "2026-06-04T07:10:00Z",
    kabagEmail: null,
    kabagNotes: null,
    kabagApprovedAmount: null,
    kabagActionAt: null,
    ewsScore: 6,
    aiAnalysis: {
      riskAssessment: "MEDIUM",
      scoringModel: 68,
      ewsFactors: [
        "Agunan SHM bernilai memadai meng-cover pengajuan",
        "Peringatan (EWS): Sifat pendapatan usaha musiman (per-panen gurame) rentan terhadap hambatan pasang-surut pasar atau penyakit air",
        "Peringatan (EWS): Agunan SHM terdaftar milik orang tua (buran debitur langsung), membutuhkan surat persetujuan dan verifikasi khusus seluruh ahli waris"
      ],
      recommendationLimit: 35000000,
      narrativeSummary: "Penilaian AI merekomendasikan limit moderat IDR 35 juta untuk mengantisipasi risiko siklus panen gurame demi menjaga kelancaran angsuran sela-panen. Keberadaan pendapatan harian dari toko kelontong keluarga menjadi faktor mitigasi krusial.",
      businessViability: "CUKUP",
      repaymentCapacity: "SEDANG",
      capacityRatio: 52
    }
  }
];

interface SavedState {
  surveys: CreditSurvey[];
  users: FieldUser[];
}

function loadDatabase(): SavedState {
  return { surveys: [], users: INITIAL_USERS };
}

function saveDatabase(state: SavedState) {
  // Migrated to Firestore: no-op
}

// Legacy helper function bypass - database fully provisioned via Firestore
// loadDatabase();

// Initialize GoogleGenAI client nicely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini client successfully re-instantiated server-side.");
  } catch (e) {
    console.error("Error setting up Gemini Client in revised server:", e);
  }
}

// -------------------------------------------------------------
// USER ENDPOINTS (FIRESTORE BACKED)
// -------------------------------------------------------------

// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const usersCol = collection(dbFirestore, "users");
    const snapshot = await getDocs(usersCol);
    let users = snapshot.docs.map(doc => {
      const u = doc.data() as FieldUser;
      let changed = false;
      if (!u.username) {
        u.username = u.email.split("@")[0].toLowerCase();
        changed = true;
      }
      if (!u.password) {
        u.password = "bank123";
        changed = true;
      }
      if (changed) {
        // Asynchronously update in firestore to persist compatibility fields
        setDoc(doc.ref, u).catch(err => console.error("Gagal migrasi data user:", err));
      }
      return u;
    });
    
    // Auto-seed baseline staff demo accounts if they don't exist in Firestore
    if (users.length === 0) {
      console.log("Seeding baseline users to Firestore...");
      for (const u of INITIAL_USERS) {
        await setDoc(doc(dbFirestore, "users", u.email.toLowerCase()), u);
      }
      users = INITIAL_USERS;
    }
    res.json(users);
  } catch (error) {
    console.error("Firestore error on /api/users GET:", error);
    res.status(500).json({ error: "Gagal berinteraksi dengan database Firestore" });
  }
});

// Update or Approve user status
app.post("/api/users/:email/status", async (req, res) => {
  const { email } = req.params;
  const { status } = req.body;
  
  try {
    const userDocRef = doc(dbFirestore, "users", email.toLowerCase());
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }
    
    const userData = userDoc.data() as FieldUser;
    userData.status = status;
    await setDoc(userDocRef, userData);
    res.json({ success: true, user: userData });
  } catch (error) {
    console.error("Firestore error on user status update:", error);
    res.status(500).json({ error: "Gagal menyimpan perubahan status user" });
  }
});

// User self registration
app.post("/api/register", async (req, res) => {
  const { email, name, role, nik, officeId, username, password } = req.body;
  
  if (!email || !name || !role || !nik || !officeId || !username || !password) {
    return res.status(400).json({ error: "Seluruh bidang registrasi harus diisi lengkap (Email, Nama, Role, NIK, Kantor, Username, Password)." });
  }

  const cleanUsername = username.trim().toLowerCase();

  try {
    const userDocRef = doc(dbFirestore, "users", email.toLowerCase());
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return res.status(400).json({ error: "Alamat email ini sudah terdaftar sebelumnya." });
    }

    // Check if username is already taken by querying firestore
    const usersCol = collection(dbFirestore, "users");
    const snapshot = await getDocs(usersCol);
    const existingUsers = snapshot.docs.map(doc => doc.data() as FieldUser);
    const usernameTaken = existingUsers.some(u => (u.username || "").toLowerCase() === cleanUsername);

    if (usernameTaken) {
      return res.status(400).json({ error: `Username '${username}' sudah digunakan oleh pegawai lain. Harap pilih username lain.` });
    }

    const newUser: FieldUser = {
      email: email.toLowerCase(),
      name,
      role,
      nik,
      officeId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
      username: cleanUsername,
      password: password
    };

    await setDoc(userDocRef, newUser);
    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error("Firestore error on user register:", error);
    res.status(500).json({ error: "Gagal melakukan registrasi" });
  }
});

// Reset application data (Deletes all surveys, restores baseline users)
app.post("/api/reset-data", async (req, res) => {
  try {
    // Delete all surveys (to start completely fresh without dummy surveys!)
    const surveysCol = collection(dbFirestore, "surveys");
    const surveysSnapshot = await getDocs(surveysCol);
    for (const d of surveysSnapshot.docs) {
      await deleteDoc(doc(dbFirestore, "surveys", d.id));
    }
    
    // Delete and re-seed baseline users
    const usersCol = collection(dbFirestore, "users");
    const usersSnapshot = await getDocs(usersCol);
    for (const d of usersSnapshot.docs) {
      await deleteDoc(doc(dbFirestore, "users", d.id));
    }
    
    for (const u of INITIAL_USERS) {
      await setDoc(doc(dbFirestore, "users", u.email.toLowerCase()), u);
    }
    
    res.json({ success: true, surveys: [], users: INITIAL_USERS });
  } catch (error) {
    console.error("Firestore error on database reset:", error);
    res.status(500).json({ error: "Gagal mengosongkan database" });
  }
});

// -------------------------------------------------------------
// SURVEYS ENDPOINTS (FIRESTORE BACKED)
// -------------------------------------------------------------

// Get all surveys
app.get("/api/surveys", async (req, res) => {
  try {
    const surveysCol = collection(dbFirestore, "surveys");
    const snapshot = await getDocs(surveysCol);
    const surveys = snapshot.docs.map(doc => doc.data() as CreditSurvey);
    
    // Sort descending by creation date
    surveys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(surveys);
  } catch (error) {
    console.error("Firestore error on surveys fetch:", error);
    res.status(500).json({ error: "Gagal mengambil data survei" });
  }
});

// Create or update physical credit survey
app.post("/api/surveys", async (req, res) => {
  const data = req.body as Partial<CreditSurvey>;
  const now = new Date().toISOString();
  
  if (!data.borrowerName) {
    return res.status(400).json({ error: "Nama calon debitur wajib diisi." });
  }

  try {
    let surveyId = data.id;
    let isEditing = false;
    let current: CreditSurvey | null = null;
    
    if (surveyId) {
      const surveyDocRef = doc(dbFirestore, "surveys", surveyId);
      const surveyDoc = await getDoc(surveyDocRef);
      if (surveyDoc.exists()) {
        isEditing = true;
        current = surveyDoc.data() as CreditSurvey;
      }
    }

    if (isEditing && current) {
      // Merge existing
      const revenue = data.monthlyRevenue ?? current.monthlyRevenue;
      const expense = data.monthlyExpenses ?? current.monthlyExpenses;
      const s = data.scheme ?? current.scheme;
      const rAmount = data.requestedAmount ?? current.requestedAmount;
      const rTenor = data.requestedTenor ?? current.requestedTenor;
      
      let stats = data.status ?? current.status;
      let notes = data.moNotes ?? current.moNotes;
      
      if (s === 'PAYROLL') {
        const estInstallment = rAmount / rTenor;
        const maxPayroll = revenue * 0.9;
        if (estInstallment > maxPayroll || rTenor > 120) {
          stats = 'REJECTED';
          notes = (notes ? notes.replace(/\[AUTO REJECTED - .*?\]/g, "").trim() + " \n" : "") + `[AUTO REJECTED - Angsuran Rp ${Math.round(estInstallment).toLocaleString('id-ID')} melebihi 90% gaji Rp ${Math.round(maxPayroll).toLocaleString('id-ID')} atau tenor >120 bulan]`;
        }
      }
      
      const updated: CreditSurvey = {
        ...current,
        ...data,
        status: stats,
        moNotes: notes,
        netMonthlyIncome: revenue - expense,
        updatedAt: now
      } as CreditSurvey;
      
      await setDoc(doc(dbFirestore, "surveys", surveyId!), updated);
      res.json(updated);
    } else {
      // Generate unique micro ID based on count of documents
      const surveysCol = collection(dbFirestore, "surveys");
      const snapshot = await getDocs(surveysCol);
      const count = snapshot.size;
      const newId = `SRV-2026-${String(count + 1).padStart(3, '0')}`;
      
      const revenue = data.monthlyRevenue ?? 0;
      const expense = data.monthlyExpenses ?? 0;
      const s = data.scheme || "PJI";
      const rAmount = Number(data.requestedAmount) || 0;
      const rTenor = Number(data.requestedTenor) || 12;
      
      let stats = "DRAFT";
      let notes = data.moNotes || "";
      
      if (s === 'PAYROLL') {
        const estInstallment = rAmount / rTenor;
        const maxPayroll = revenue * 0.9;
        if (estInstallment > maxPayroll || rTenor > 120) {
          stats = 'REJECTED';
          notes = (notes ? notes + " \n" : "") + `[AUTO REJECTED - Angsuran Rp ${Math.round(estInstallment).toLocaleString('id-ID')} melebihi 90% gaji Rp ${Math.round(maxPayroll).toLocaleString('id-ID')} atau tenor >120 bulan]`;
        }
      }

      const newSurvey: CreditSurvey = {
        id: newId,
        borrowerName: data.borrowerName,
        nik: data.nik || "",
        phone: data.phone || "",
        address: data.address || "",
        businessType: data.businessType || "Komersial",
        businessAge: Number(data.businessAge) || 1,
        requestedAmount: rAmount,
        requestedTenor: rTenor,
        monthlyRevenue: revenue,
        monthlyExpenses: expense,
        netMonthlyIncome: revenue - expense,
        collateralType: data.collateralType || "TANPA_AGUNAN",
        collateralDescription: data.collateralDescription || "",
        collateralValue: Number(data.collateralValue) || 0,
        collaterals: data.collaterals || [
          {
            id: `col-new-${Date.now()}`,
            type: data.collateralType || "BPKB",
            description: data.collateralDescription || "Agunan Utama",
            value: Number(data.collateralValue) || 0
          }
        ],
        slikActiveLoans: data.slikActiveLoans || [
          {
            id: `slik-new-${Date.now()}`,
            bankName: "Tidak ada / Bersih",
            plafond: 0,
            bakidebet: 0,
            monthlyInstallment: 0,
            collectibility: data.slikStatus || "KOL-1 (LANCAR)"
          }
        ],
        moNotes: notes,
        gpsLatitude: data.gpsLatitude ?? -8.1132,
        gpsLongitude: data.gpsLongitude ?? 111.9025,
        gpsAddress: data.gpsAddress || "Tulungagung, Jawa Timur",
        photoUrl: data.photoUrl || null,
        photoKtp: data.photoKtp || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
        photoDebitur: data.photoDebitur || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
        surveyPhotos: {
          rumah: data.surveyPhotos?.rumah || [
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
            "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400"
          ],
          usaha: data.surveyPhotos?.usaha || [
            "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
            "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
            "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
            "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400"
          ],
          stok: data.surveyPhotos?.stok || [
            "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
            "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
            "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
            "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400"
          ],
          agunan: data.surveyPhotos?.agunan || [
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
            "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"
          ]
        },
        photoCoordinates: data.photoCoordinates || {
          rumah: [null, null, null, null],
          usaha: [null, null, null, null],
          stok: [null, null, null, null],
          agunan: [null, null, null, null]
        },
        status: stats as any,
        createdAt: now,
        updatedAt: now,
        surveyorEmail: data.surveyorEmail || "mo.kurniawan@banktulungagung.co.id",
        officeId: data.officeId || "kp1-kauman",
        scheme: s as any,
        scores5c: {
          character: data.scores5c?.character ?? 70,
          capacity: data.scores5c?.capacity ?? 70,
          capital: data.scores5c?.capital ?? 70,
          collateral: data.scores5c?.collateral ?? 70,
          condition: data.scores5c?.condition ?? 70,
          qCharacter: data.scores5c?.qCharacter || "",
          qCapacity: data.scores5c?.qCapacity || "",
          qCapital: data.scores5c?.qCapital || "",
          qCollateral: data.scores5c?.qCollateral || "",
          qCondition: data.scores5c?.qCondition || ""
        },
        kasubagEmail: null,
        kasubagNotes: null,
        kasubagApprovedAmount: null,
        kasubagActionAt: null,
        kabagEmail: null,
        kabagNotes: null,
        kabagApprovedAmount: null,
        kabagActionAt: null,
        ewsScore: 3,
        aiAnalysis: null
      };
      
      await setDoc(doc(dbFirestore, "surveys", newId), newSurvey);
      res.status(201).json(newSurvey);
    }
  } catch (error) {
    console.error("Firestore error on survey create/update:", error);
    res.status(500).json({ error: "Gagal menyimpan survei ke database" });
  }
});

// Delete target survey
app.delete("/api/surveys/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const surveyDocRef = doc(dbFirestore, "surveys", id);
    const surveyDoc = await getDoc(surveyDocRef);
    if (!surveyDoc.exists()) {
      return res.status(404).json({ error: "Survei tidak ditemukan" });
    }
    await deleteDoc(surveyDocRef);
    res.json({ success: true });
  } catch (error) {
    console.error("Firestore error on survey delete:", error);
    res.status(500).json({ error: "Gagal menghapus survei dari database" });
  }
});

// Kasubag Review (Tier 1 Approval)
app.post("/api/surveys/:id/kasubag-review", async (req, res) => {
  const { id } = req.params;
  const { notes, approvedAmount, kasubagEmail } = req.body;
  
  try {
    const surveyDocRef = doc(dbFirestore, "surveys", id);
    const surveyDoc = await getDoc(surveyDocRef);
    if (!surveyDoc.exists()) return res.status(404).json({ error: "Survei tidak ditemukan" });
    
    const current = surveyDoc.data() as CreditSurvey;
    current.status = "REVIEWED_KASUBAG";
    current.kasubagNotes = notes;
    current.kasubagApprovedAmount = Number(approvedAmount) || current.requestedAmount;
    current.kasubagEmail = kasubagEmail || "kasubag.kp1@banktulungagung.co.id";
    current.kasubagActionAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();
    
    await setDoc(surveyDocRef, current);
    res.json(current);
  } catch (error) {
    console.error("Firestore error on Kasubag review:", error);
    res.status(500).json({ error: "Gagal menyimpan peninjauan Kasubag" });
  }
});

// Kabag Review (Tier 2 Approved/Rejected)
app.post("/api/surveys/:id/kabag-review", async (req, res) => {
  const { id } = req.params;
  const { decision, notes, approvedAmount, kabagEmail } = req.body; // decision: APPROVED or REJECTED
  
  try {
    const surveyDocRef = doc(dbFirestore, "surveys", id);
    const surveyDoc = await getDoc(surveyDocRef);
    if (!surveyDoc.exists()) return res.status(404).json({ error: "Survei tidak ditemukan" });
    
    const current = surveyDoc.data() as CreditSurvey;
    if (decision !== "APPROVED" && decision !== "REJECTED") {
      return res.status(400).json({ error: "Keputusan harus APPROVED atau REJECTED" });
    }
    
    current.status = decision;
    current.kabagNotes = notes;
    current.kabagApprovedAmount = decision === "APPROVED" ? (Number(approvedAmount) || current.kasubagApprovedAmount || current.requestedAmount) : 0;
    current.kabagEmail = kabagEmail || "kabag.kredit1@banktulungagung.co.id";
    current.kabagActionAt = new Date().toISOString();
    current.updatedAt = new Date().toISOString();
    
    await setDoc(surveyDocRef, current);
    res.json(current);
  } catch (error) {
    console.error("Firestore error on Kabag review:", error);
    res.status(500).json({ error: "Gagal menyimpan keputusan Kabag" });
  }
});

// Gemini AI analysis endpoint
app.post("/api/surveys/:id/analyze", async (req, res) => {
  const { id } = req.params;
  
  try {
    const surveyDocRef = doc(dbFirestore, "surveys", id);
    const surveyDoc = await getDoc(surveyDocRef);
    if (!surveyDoc.exists()) return res.status(404).json({ error: "Survei tidak ditemukan" });
    
    const survey = surveyDoc.data() as CreditSurvey;
  
  const prompt = `Lakukan evaluasi kelayakan risiko survei kredit mikro perbankan menggunakan prinsip 5C (Character, Capacity, Capital, Collateral, Condition) untuk nasabah Tulungagung:
- Nama Calon Debitur: ${survey.borrowerName}
- NIK: ${survey.nik}
- Sektor Usaha: ${survey.businessType}
- Lama Usaha: ${survey.businessAge} tahun
- Skema Analisa: ${survey.scheme === "PJI" ? "Perdagangan, Jasa, Industri" : "Pertanian, Peternakan, Perikanan"}
- Skor 5C Manual (MO): Character=${survey.scores5c.character}, Capacity=${survey.scores5c.capacity}, Capital=${survey.scores5c.capital}, Collateral=${survey.scores5c.collateral}, Condition=${survey.scores5c.condition}
  * Catatan 5C: 
    * Karakter: ${survey.scores5c.qCharacter}
    * Kapasitas: ${survey.scores5c.qCapacity}
    * Permodalan: ${survey.scores5c.qCapital}
    * Agunan: ${survey.scores5c.qCollateral}
    * Kondisi: ${survey.scores5c.qCondition}
- Nominal Kredit yang Diajukan: Rp${survey.requestedAmount.toLocaleString('id-ID')}
- Tenor yang Diajukan: ${survey.requestedTenor} bulan
- Omzet/Pendapatan Bulanan: Rp${survey.monthlyRevenue.toLocaleString('id-ID')}
- Total Biaya Operasional + Hidup per Bulan: Rp${survey.monthlyExpenses.toLocaleString('id-ID')}
- Estimasi Pendapatan Sisa: Rp${survey.netMonthlyIncome.toLocaleString('id-ID')}
- Taksiran Pinjaman Fisik: Rp${survey.collateralValue.toLocaleString('id-ID')} (${survey.collateralType} - ${survey.collateralDescription})
- Catatan MO: "${survey.moNotes}"

Berikan keluaran terstruktur dengan format JSON yang berisi objek analisis kredit perbankan berisikan:
1. riskAssessment ('LOW', 'MEDIUM', atau 'HIGH') berdasarkan rasio penutupan agunan, kapasitas sisa pendapatan dibanding potensi angsuran, serta faktor umur usaha.
2. scoringModel (nilai bilangan bulat 0-100 sebagai credit score).
3. ewsFactors (daftar string berisi 3-4 poin peringatan/kekuatan spesifik usaha).
4. recommendationLimit (nominal rekomendasi plafon kredit disetujui dalam Rupiah / integer).
5. narrativeSummary (ringkasan naratif mendalam Bahasa Indonesia mencakup penaksiran model 5C yaitu Character, Capacity, Capital, Collateral, Condition).
6. businessViability ('SEHAT', 'CUKUP', atau 'RENTAN').
7. repaymentCapacity ('KUAT', 'SEDANG', 'LEMAH').
8. capacityRatio (persentase perkiraan angsuran terhadap pendapatan bersih).`;

  let finalAnalysis: AIAnalysis;

  if (ai) {
    try {
      console.log(`Calling Gemini API for credit analysis (5C logic) on: ${survey.borrowerName}`);
      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Anda adalah Credit Risk Analyst Senior di PT BPR Bank Tulungagung Perseroda. Analisis Anda harus realistis, berpegang pada prinsip kehati-hatian perbankan (prudential banking), dan menggunakan Bahasa Indonesia baku yang profesional.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskAssessment: {
                type: Type.STRING,
                description: "Pilihan: 'LOW', 'MEDIUM', atau 'HIGH'."
              },
              scoringModel: {
                type: Type.INTEGER,
                description: "Skor kredit 0 sampai 100."
              },
              ewsFactors: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array berisi 3-5 faktor risiko, kekuatan, atau EWS."
              },
              recommendationLimit: {
                type: Type.INTEGER,
                description: "Plafon rekomendasi dalam Rupiah."
              },
              narrativeSummary: {
                type: Type.STRING,
                description: "Laporan analisis narasi formal model 5C."
              },
              businessViability: {
                type: Type.STRING,
                description: "Kategori: 'SEHAT', 'CUKUP', 'RENTAN'."
              },
              repaymentCapacity: {
                type: Type.STRING,
                description: "Kategori: 'KUAT', 'SEDANG', 'LEMAH'."
              },
              capacityRatio: {
                type: Type.INTEGER,
                description: "Rasio angsuran terhadap pendapatan bersih dalam persen, rentang 0-100."
              }
            },
            required: [
              "riskAssessment",
              "scoringModel",
              "ewsFactors",
              "recommendationLimit",
              "narrativeSummary",
              "businessViability",
              "repaymentCapacity",
              "capacityRatio"
            ]
          }
        }
      });

      const responseText = geminiResponse.text;
      console.log("Raw response from 5C Gemini Prompt:", responseText);
      if (responseText) {
        finalAnalysis = JSON.parse(responseText.trim()) as AIAnalysis;
      } else {
        throw new Error("Empty text from 5C Gemini");
      }
    } catch (e) {
      console.error("Gemini critical error. Falling back to local rules engine...", e);
      finalAnalysis = runManual5cSimulation(survey);
    }
  } else {
    finalAnalysis = runManual5cSimulation(survey);
  }

  // Update records
  survey.aiAnalysis = finalAnalysis;
  let ewsIdx = 2;
  if (finalAnalysis.riskAssessment === "HIGH") {
    ewsIdx = 8;
  } else if (finalAnalysis.riskAssessment === "MEDIUM") {
    ewsIdx = 5;
  }
  
  const colCove = survey.collateralValue / survey.requestedAmount;
  if (colCove < 1.0) ewsIdx += 2;
  if (survey.businessAge < 2) ewsIdx += 1;
  
  survey.ewsScore = Math.min(10, Math.max(1, ewsIdx));
  
  await setDoc(surveyDocRef, survey);
  res.json(survey);
  } catch (error) {
    console.error("Firestore error on /api/surveys/:id/analyze:", error);
    res.status(500).json({ error: "Gagal memproses analisa kredit" });
  }
});

function runManual5cSimulation(survey: CreditSurvey): AIAnalysis {
  const isPayroll = survey.scheme === "PAYROLL";
  const netIncome = Math.max(1000000, survey.monthlyRevenue - (isPayroll ? 0 : survey.monthlyExpenses));
  const estInstallment = survey.requestedAmount / survey.requestedTenor;
  
  // For payroll DSR, ratio is installment / (90% of salary)
  const maxPayrollInstallment = survey.monthlyRevenue * 0.9;
  const ratio = isPayroll
    ? Math.round((estInstallment / maxPayrollInstallment) * 100)
    : Math.round((estInstallment / netIncome) * 100);
  
  let riskAssessment: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
  let scoringModel = Math.round((survey.scores5c.character + survey.scores5c.capacity + survey.scores5c.capital + survey.scores5c.collateral + survey.scores5c.condition) / 5);
  let businessViability: 'SEHAT' | 'CUKUP' | 'RENTAN' = 'SEHAT';
  let repaymentCapacity: 'KUAT' | 'SEDANG' | 'LEMAH' = 'KUAT';
  
  const factors: string[] = [];

  if (isPayroll) {
    if (survey.requestedTenor > 120) {
      riskAssessment = 'HIGH';
      repaymentCapacity = 'LEMAH';
      factors.push(`EWS Alert: Jangka waktu (${survey.requestedTenor} bulan) melebihi batas maksimal Payroll (120 bulan).`);
    }
    
    if (estInstallment > maxPayrollInstallment) {
      riskAssessment = 'HIGH';
      repaymentCapacity = 'LEMAH';
      factors.push(`REJECTED: Angsuran bulanan (Rp ${Math.round(estInstallment).toLocaleString('id-ID')}) melebihi 90% gaji (Rp ${Math.round(maxPayrollInstallment).toLocaleString('id-ID')}).`);
      scoringModel = Math.min(scoringModel, 40);
    } else {
      factors.push(`Angsuran bulanan aman di bawah 90% gaji (${ratio}% DSR).`);
    }
    
    // For regular checks:
    if (survey.collateralType !== 'SK_ASLI') {
      factors.push(`Peringatan: Kredit Payroll mewajibkan agunan berupa SK Asli Kerja.`);
    } else {
      factors.push(`Agunan SK Asli terverifikasi.`);
    }
    businessViability = 'SEHAT';
  } else {
    if (ratio > 50) {
      riskAssessment = 'HIGH';
      repaymentCapacity = 'LEMAH';
      factors.push(`EWS Alert: Rasio angsuran (${ratio}%) melebihi kapasitas aman bulanan (max 40%).`);
    } else if (ratio > 35) {
      riskAssessment = 'MEDIUM';
      repaymentCapacity = 'SEDANG';
      factors.push(`Rasio angsuran agak menekan sisa kas per bulan (${ratio}%).`);
    } else {
      factors.push(`Kapasitas angsuran ideal (${ratio}%) terhadap sisa pendapatan kas.`);
    }

    if (survey.businessAge < 2) {
      businessViability = 'RENTAN';
      factors.push(`EWS Alert: Usaha berumur baru ${survey.businessAge} tahun memiliki kerentanan siklus mikro.`);
    } else {
      factors.push(`Usaha sudah berjalan lebih dari 2 tahun, menunjukkan kelayakan stabilitas.`);
    }

    if (survey.collateralValue / survey.requestedAmount < 1.0) {
      factors.push(`EWS Warning: Nilai taksiran agunan tidak menutup penuh jumlah plafon pengajuan.`);
    } else {
      factors.push(`Agunan fisik menutup pengajuan dengan rasio kecukupan ${Math.round((survey.collateralValue / survey.requestedAmount) * 100)}%.`);
    }
  }

  // Generate quantitative recommendation limit
  let recommendationLimit = 0;
  if (isPayroll) {
    if (estInstallment <= maxPayrollInstallment && survey.requestedTenor <= 120) {
      recommendationLimit = survey.requestedAmount;
    } else {
      recommendationLimit = 0;
    }
  } else {
    recommendationLimit = Math.min(survey.requestedAmount, Math.round((netIncome * 0.4 * survey.requestedTenor) / 1000000) * 1000000);
  }

  const narrativeSummary = isPayroll
    ? `Hasil Keputusan Analitik 5C BPR Bank Tulungagung - KREDIT PAYROLL: Calon debitur ${survey.borrowerName} dinilai dengan skema khusus Payroll. Angsuran bulanan estimasi Rp${Math.round(estInstallment).toLocaleString('id-ID')} dengan limit 90% Gaji Rp${Math.round(maxPayrollInstallment).toLocaleString('id-ID')}. Status rekomendasi: ${recommendationLimit > 0 ? "DISETUJUI (Memenuhi Syarat)" : "DITOLAK (Angsuran melebihi 90% Gaji atau tenor >120 bulan)"}.`
    : `Hasil Keputusan Analitik 5C BPR Bank Tulungagung: Berdasarkan matriks evaluasi manual ${survey.scheme === "PJI" ? "Ritel/Kompleks" : "Pertanian/Musiman"} dengan rata-rata skor ${scoringModel}/100, calon debitur ${survey.borrowerName} berada pada level risiko ${riskAssessment}. Karakter dinilai ${survey.scores5c.character >= 80 ? "SANGAT BAIK" : "CUKUP"}. Kapasitas angsuran tercukupi dengan estimasi sisa pendapatan sela-biaya sebesar Rp${netIncome.toLocaleString('id-ID')}.`;

  return {
    riskAssessment,
    scoringModel,
    ewsFactors: factors,
    recommendationLimit: recommendationLimit || survey.requestedAmount,
    narrativeSummary,
    businessViability,
    repaymentCapacity,
    capacityRatio: ratio
  };
}


// Host Vite or Static production server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production bundles.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BPR Bank Tulungagung - Credit system engine initialized on http://localhost:${PORT}`);
  });
}

startServer();
