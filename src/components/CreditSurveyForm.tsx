/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CreditSurvey, Scoring5C, SurveyScheme, UserSession, CollateralItem, SlikActiveLoan } from "../types";
import { Navigation, Camera, Save, MapPin, CheckSquare, Layers, Image, Info } from "lucide-react";

interface CreditSurveyFormProps {
  currentSession: UserSession;
  onSurveySaved: () => void;
  surveyToEdit?: CreditSurvey | null;
  onCancel: () => void;
}

const TEMPLATE_PHOTOS = {
  rumah: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400",
  usaha: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400",
  stok: "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
  agunan: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400",
  ktp: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?w=400",
  debitur: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
};

export default function CreditSurveyForm({
  currentSession,
  onSurveySaved,
  surveyToEdit,
  onCancel
}: CreditSurveyFormProps) {
  const [borrowerName, setBorrowerName] = useState("");
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessAge, setBusinessAge] = useState<number>(3);
  const [requestedAmount, setRequestedAmount] = useState<number>(25000000);
  const [requestedTenor, setRequestedTenor] = useState<number>(12);
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000000);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number>(9000000);
  const [collateralType, setCollateralType] = useState<'SHM' | 'BPKB' | 'LOS_PASAR' | 'TANPA_AGUNAN'>("BPKB");
  const [collateralDescription, setCollateralDescription] = useState("");
  const [collateralValue, setCollateralValue] = useState<number>(15000000);
  const [moNotes, setMoNotes] = useState("");

  // Geotagging
  const [gpsLatitude, setGpsLatitude] = useState<number>(-8.1132);
  const [gpsLongitude, setGpsLongitude] = useState<number>(111.9025);
  const [gpsAddress, setGpsAddress] = useState("Tulungagung, Jawa Timur");
  const [geoLoading, setGeoLoading] = useState(false);

  // Scheme
  const [scheme, setScheme] = useState<SurveyScheme>("PJI");

  // 5C Scoring & Qualitative details
  const [scores, setScores] = useState<Scoring5C>({
    character: 80,
    capacity: 75,
    capital: 70,
    collateral: 70,
    condition: 75,
    qCharacter: "",
    qCapacity: "",
    qCapital: "",
    qCollateral: "",
    qCondition: ""
  });

  // Photo URLs (base64 or placeholders)
  const [photoKtp, setPhotoKtp] = useState<string | null>(null);
  const [photoDebitur, setPhotoDebitur] = useState<string | null>(null);
  const [photosRumah, setPhotosRumah] = useState<(string | null)[]>([null, null, null, null]);
  const [photosUsaha, setPhotosUsaha] = useState<(string | null)[]>([null, null, null, null]);
  const [photosStok, setPhotosStok] = useState<(string | null)[]>([null, null, null, null]);
  const [photosAgunan, setPhotosAgunan] = useState<(string | null)[]>([null, null, null, null]);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // States to track auto-saved draft status
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  // New states for dynamic sector analysis, SLIK, and photo coords
  const [slikStatus, setSlikStatus] = useState("KOL-1 (LANCAR)");
  const [sectorType, setSectorType] = useState<'UMUM' | 'PERIKANAN' | 'PERTANIAN' | 'PETERNAKAN' | 'PAYROLL'>("UMUM");

  const [collaterals, setCollaterals] = useState<CollateralItem[]>([
    {
      id: "col-default-1",
      type: "BPKB",
      description: "Agunan Utama",
      value: 15000000
    }
  ]);

  const [slikActiveLoans, setSlikActiveLoans] = useState<SlikActiveLoan[]>([]);
  
  // Perikanan
  const [sectorFishCount, setSectorFishCount] = useState<number>(0);
  const [sectorFishWeight, setSectorFishWeight] = useState<number>(0);
  const [sectorFishPrice, setSectorFishPrice] = useState<number>(0);

  // Pertanian
  const [sectorLandSize, setSectorLandSize] = useState<number>(0);
  const [sectorYield, setSectorYield] = useState<number>(0);
  const [sectorCropPrice, setSectorCropPrice] = useState<number>(0);

  // Peternakan
  const [sectorLivestockCount, setSectorLivestockCount] = useState<number>(0);
  const [sectorLivestockPrice, setSectorLivestockPrice] = useState<number>(0);

  // Payroll
  const [sectorPayrollBaseSalary, setSectorPayrollBaseSalary] = useState<number>(0);
  const [sectorPayrollAllowances, setSectorPayrollAllowances] = useState<number>(0);
  const [sectorPayrollDeductions, setSectorPayrollDeductions] = useState<number>(0);

  // Individual photo coordinates for up to 4 photos per category
  const [photosCoords, setPhotosCoords] = useState<{
    rumah: ({ lat: number; lng: number } | null)[];
    usaha: ({ lat: number; lng: number } | null)[];
    stok: ({ lat: number; lng: number } | null)[];
    agunan: ({ lat: number; lng: number } | null)[];
  }>({
    rumah: [null, null, null, null],
    usaha: [null, null, null, null],
    stok: [null, null, null, null],
    agunan: [null, null, null, null]
  });

  // Load defaults or restore draft if edit mode / create mode
  useEffect(() => {
    if (surveyToEdit) {
      setBorrowerName(surveyToEdit.borrowerName);
      setNik(surveyToEdit.nik);
      setPhone(surveyToEdit.phone);
      setAddress(surveyToEdit.address);
      setBusinessType(surveyToEdit.businessType);
      setBusinessAge(surveyToEdit.businessAge);
      setRequestedAmount(surveyToEdit.requestedAmount);
      setRequestedTenor(surveyToEdit.requestedTenor);
      setMonthlyRevenue(surveyToEdit.monthlyRevenue);
      setMonthlyExpenses(surveyToEdit.monthlyExpenses);
      setCollateralType(surveyToEdit.collateralType);
      setCollateralDescription(surveyToEdit.collateralDescription);
      setCollateralValue(surveyToEdit.collateralValue);
      setMoNotes(surveyToEdit.moNotes);
      setGpsLatitude(surveyToEdit.gpsLatitude);
      setGpsLongitude(surveyToEdit.gpsLongitude);
      setGpsAddress(surveyToEdit.gpsAddress);
      setScheme(surveyToEdit.scheme);
      setScores(surveyToEdit.scores5c);
      
      setPhotoKtp(surveyToEdit.photoKtp || null);
      setPhotoDebitur(surveyToEdit.photoDebitur || null);

      if (surveyToEdit.surveyPhotos) {
        setPhotosRumah(surveyToEdit.surveyPhotos.rumah && Array.isArray(surveyToEdit.surveyPhotos.rumah) ? [...surveyToEdit.surveyPhotos.rumah] : [surveyToEdit.surveyPhotos.rumah || null, null, null, null]);
        setPhotosUsaha(surveyToEdit.surveyPhotos.usaha && Array.isArray(surveyToEdit.surveyPhotos.usaha) ? [...surveyToEdit.surveyPhotos.usaha] : [surveyToEdit.surveyPhotos.usaha || null, null, null, null]);
        setPhotosStok(surveyToEdit.surveyPhotos.stok && Array.isArray(surveyToEdit.surveyPhotos.stok) ? [...surveyToEdit.surveyPhotos.stok] : [surveyToEdit.surveyPhotos.stok || null, null, null, null]);
        setPhotosAgunan(surveyToEdit.surveyPhotos.agunan && Array.isArray(surveyToEdit.surveyPhotos.agunan) ? [...surveyToEdit.surveyPhotos.agunan] : [surveyToEdit.surveyPhotos.agunan || null, null, null, null]);
      } else {
        setPhotosRumah([null, null, null, null]);
        setPhotosUsaha([null, null, null, null]);
        setPhotosStok([null, null, null, null]);
        setPhotosAgunan([null, null, null, null]);
      }

      setSlikStatus(surveyToEdit.slikStatus || "KOL-1 (LANCAR)");
      if (surveyToEdit.collaterals && surveyToEdit.collaterals.length > 0) {
        setCollaterals(surveyToEdit.collaterals);
      } else {
        setCollaterals([
          {
            id: `col-${Date.now()}`,
            type: surveyToEdit.collateralType || "BPKB",
            description: surveyToEdit.collateralDescription || "Agunan Utama",
            value: surveyToEdit.collateralValue || 0
          }
        ]);
      }
      if (surveyToEdit.slikActiveLoans) {
        setSlikActiveLoans(surveyToEdit.slikActiveLoans);
      } else {
        setSlikActiveLoans([]);
      }
      setSectorType(surveyToEdit.sectorType || "UMUM");
      setSectorFishCount(surveyToEdit.sectorDetails?.fishCount || 0);
      setSectorFishWeight(surveyToEdit.sectorDetails?.fishWeightPerUnit || 0);
      setSectorFishPrice(surveyToEdit.sectorDetails?.fishPricePerKg || 0);
      setSectorLandSize(surveyToEdit.sectorDetails?.landSize || 0);
      setSectorYield(surveyToEdit.sectorDetails?.yieldPerUnit || 0);
      setSectorCropPrice(surveyToEdit.sectorDetails?.pricePerKg || 0);
      setSectorLivestockCount(surveyToEdit.sectorDetails?.livestockCount || 0);
      setSectorLivestockPrice(surveyToEdit.sectorDetails?.livestockPrice || 0);
      setSectorPayrollBaseSalary(surveyToEdit.sectorDetails?.payrollBaseSalary || 0);
      setSectorPayrollAllowances(surveyToEdit.sectorDetails?.payrollAllowances || 0);
      setSectorPayrollDeductions(surveyToEdit.sectorDetails?.payrollDeductions || 0);
      
      if (surveyToEdit.photoCoordinates) {
        setPhotosCoords({
          rumah: surveyToEdit.photoCoordinates.rumah && Array.isArray(surveyToEdit.photoCoordinates.rumah) ? [...surveyToEdit.photoCoordinates.rumah] : [surveyToEdit.photoCoordinates.rumah || null, null, null, null],
          usaha: surveyToEdit.photoCoordinates.usaha && Array.isArray(surveyToEdit.photoCoordinates.usaha) ? [...surveyToEdit.photoCoordinates.usaha] : [surveyToEdit.photoCoordinates.usaha || null, null, null, null],
          stok: surveyToEdit.photoCoordinates.stok && Array.isArray(surveyToEdit.photoCoordinates.stok) ? [...surveyToEdit.photoCoordinates.stok] : [surveyToEdit.photoCoordinates.stok || null, null, null, null],
          agunan: surveyToEdit.photoCoordinates.agunan && Array.isArray(surveyToEdit.photoCoordinates.agunan) ? [...surveyToEdit.photoCoordinates.agunan] : [surveyToEdit.photoCoordinates.agunan || null, null, null, null]
        });
      } else {
        setPhotosCoords({
          rumah: [null, null, null, null],
          usaha: [null, null, null, null],
          stok: [null, null, null, null],
          agunan: [null, null, null, null]
        });
      }
      setHasDraft(false);
      setDraftSavedAt(null);
    } else {
      // Create mode - check if pre-existing draft exists in local storage
      const saved = localStorage.getItem("bpr_survey_form_draft");
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          
          // Let's determine if the draft has any significant content to prevent restoring an empty draft
          const hasContent = !!(draft.borrowerName || draft.nik || draft.phone || draft.address || draft.businessType || draft.moNotes || draft.photoKtp || draft.photoDebitur || (draft.slikActiveLoans && draft.slikActiveLoans.length > 0) || (draft.collaterals && draft.collaterals.length > 1));
          
          if (hasContent) {
            setBorrowerName(draft.borrowerName || "");
            setNik(draft.nik || "");
            setPhone(draft.phone || "");
            setAddress(draft.address || "");
            setBusinessType(draft.businessType || "");
            setBusinessAge(draft.businessAge ?? 3);
            setRequestedAmount(draft.requestedAmount ?? 25000000);
            setRequestedTenor(draft.requestedTenor ?? 12);
            setMonthlyRevenue(draft.monthlyRevenue ?? 15000000);
            setMonthlyExpenses(draft.monthlyExpenses ?? 9000000);
            setCollateralType(draft.collateralType || "BPKB");
            setCollateralDescription(draft.collateralDescription || "");
            setCollateralValue(draft.collateralValue ?? 15000000);
            setMoNotes(draft.moNotes || "");
            setGpsLatitude(draft.gpsLatitude ?? -8.1132);
            setGpsLongitude(draft.gpsLongitude ?? 111.9025);
            setGpsAddress(draft.gpsAddress || "Kecamatan Boyolangu, Tulungagung");
            setScheme(draft.scheme || "PJI");
            
            if (draft.scores) {
              setScores(draft.scores);
            }
            
            setPhotoKtp(draft.photoKtp || null);
            setPhotoDebitur(draft.photoDebitur || null);

            setPhotosRumah(draft.photosRumah || [null, null, null, null]);
            setPhotosUsaha(draft.photosUsaha || [null, null, null, null]);
            setPhotosStok(draft.photosStok || [null, null, null, null]);
            setPhotosAgunan(draft.photosAgunan || [null, null, null, null]);

            setSlikStatus(draft.slikStatus || "KOL-1 (LANCAR)");
            setSectorType(draft.sectorType || "UMUM");
            
            if (draft.collaterals) {
              setCollaterals(draft.collaterals);
            }
            if (draft.slikActiveLoans) {
              setSlikActiveLoans(draft.slikActiveLoans);
            }
            
            setSectorFishCount(draft.sectorFishCount || 0);
            setSectorFishWeight(draft.sectorFishWeight || 0);
            setSectorFishPrice(draft.sectorFishPrice || 0);
            setSectorLandSize(draft.sectorLandSize || 0);
            setSectorYield(draft.sectorYield || 0);
            setSectorCropPrice(draft.sectorCropPrice || 0);
            setSectorLivestockCount(draft.sectorLivestockCount || 0);
            setSectorLivestockPrice(draft.sectorLivestockPrice || 0);
            setSectorPayrollBaseSalary(draft.sectorPayrollBaseSalary || 0);
            setSectorPayrollAllowances(draft.sectorPayrollAllowances || 0);
            setSectorPayrollDeductions(draft.sectorPayrollDeductions || 0);

            if (draft.photosCoords) {
              setPhotosCoords(draft.photosCoords);
            }

            setHasDraft(true);
            setDraftSavedAt(draft.savedAt ? new Date(draft.savedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : null);
          } else {
            resetToEmptyForm();
          }
        } catch (e) {
          console.error("Gagal membaca draf", e);
          resetToEmptyForm();
        }
      } else {
        resetToEmptyForm();
      }
    }
  }, [surveyToEdit]);

  // Periodic Auto-save effect
  useEffect(() => {
    // Only save when we are NOT editing an existing survey
    if (surveyToEdit) return;

    // Detect if we actually have anything filled so we don't spam empty items
    const hasAnyContent = !!(borrowerName || nik || phone || address || businessType || moNotes || photoKtp || photoDebitur || slikActiveLoans.length > 0 || collaterals.length > 1 || collaterals.some(c => c.description || c.value !== 15000000));
    
    if (!hasAnyContent) {
      // If it became totally empty, remove the item
      localStorage.removeItem("bpr_survey_form_draft");
      setHasDraft(false);
      setDraftSavedAt(null);
      return;
    }

    const draft = {
      borrowerName,
      nik,
      phone,
      address,
      businessType,
      businessAge,
      requestedAmount,
      requestedTenor,
      monthlyRevenue,
      monthlyExpenses,
      collateralType,
      collateralDescription,
      collateralValue,
      moNotes,
      gpsLatitude,
      gpsLongitude,
      gpsAddress,
      scheme,
      scores,
      photoKtp,
      photoDebitur,
      photosRumah,
      photosUsaha,
      photosStok,
      photosAgunan,
      slikStatus,
      sectorType,
      collaterals,
      slikActiveLoans,
      sectorFishCount,
      sectorFishWeight,
      sectorFishPrice,
      sectorLandSize,
      sectorYield,
      sectorCropPrice,
      sectorLivestockCount,
      sectorLivestockPrice,
      sectorPayrollBaseSalary,
      sectorPayrollAllowances,
      sectorPayrollDeductions,
      photosCoords,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem("bpr_survey_form_draft", JSON.stringify(draft));
    setHasDraft(true);
    setDraftSavedAt(new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
  }, [
    surveyToEdit,
    borrowerName,
    nik,
    phone,
    address,
    businessType,
    businessAge,
    requestedAmount,
    requestedTenor,
    monthlyRevenue,
    monthlyExpenses,
    collateralType,
    collateralDescription,
    collateralValue,
    moNotes,
    gpsLatitude,
    gpsLongitude,
    gpsAddress,
    scheme,
    scores,
    photoKtp,
    photoDebitur,
    photosRumah,
    photosUsaha,
    photosStok,
    photosAgunan,
    slikStatus,
    sectorType,
    collaterals,
    slikActiveLoans,
    sectorFishCount,
    sectorFishWeight,
    sectorFishPrice,
    sectorLandSize,
    sectorYield,
    sectorCropPrice,
    sectorLivestockCount,
    sectorLivestockPrice,
    sectorPayrollBaseSalary,
    sectorPayrollAllowances,
    sectorPayrollDeductions,
    photosCoords
  ]);

  const handleClearDraft = () => {
    if (confirm("Konfirmasi Hapus Draf: Apakah Anda yakin ingin menghapus draf pengisian saat ini dan memulai kembali dengan formulir kosong?")) {
      localStorage.removeItem("bpr_survey_form_draft");
      setHasDraft(false);
      setDraftSavedAt(null);
      resetToEmptyForm();
    }
  };

  const resetToEmptyForm = () => {
    setBorrowerName("");
    setNik("");
    setPhone("");
    setAddress("");
    setBusinessType("");
    setBusinessAge(3);
    setRequestedAmount(25000000);
    setRequestedTenor(12);
    setMonthlyRevenue(15000000);
    setMonthlyExpenses(9000000);
    setCollateralType("BPKB");
    setCollateralDescription("");
    setCollateralValue(15000000);
    setMoNotes("");
    setGpsLatitude(-8.1132);
    setGpsLongitude(111.9025);
    setGpsAddress("Kecamatan Boyolangu, Tulungagung");
    setScheme("PJI");
    setCollaterals([
      {
        id: "col-default-1",
        type: "BPKB",
        description: "Agunan Utama",
        value: 15000000
      }
    ]);
    setSlikActiveLoans([]);
    setScores({
      character: 75,
      capacity: 70,
      capital: 70,
      collateral: 70,
      condition: 70,
      qCharacter: "",
      qCapacity: "",
      qCapital: "",
      qCollateral: "",
      qCondition: ""
    });
    setPhotoKtp(null);
    setPhotoDebitur(null);
    setPhotosRumah([null, null, null, null]);
    setPhotosUsaha([null, null, null, null]);
    setPhotosStok([null, null, null, null]);
    setPhotosAgunan([null, null, null, null]);

    setSlikStatus("KOL-1 (LANCAR)");
    setSectorType("UMUM");
    setSectorFishCount(0);
    setSectorFishWeight(0);
    setSectorFishPrice(0);
    setSectorLandSize(0);
    setSectorYield(0);
    setSectorCropPrice(0);
    setSectorLivestockCount(0);
    setSectorLivestockPrice(0);
    setSectorPayrollBaseSalary(0);
    setSectorPayrollAllowances(0);
    setSectorPayrollDeductions(0);
    setPhotosCoords({
      rumah: [null, null, null, null],
      usaha: [null, null, null, null],
      stok: [null, null, null, null],
      agunan: [null, null, null, null]
    });
  };

  const captureGPS = () => {
    setGeoLoading(true);
    if (!navigator.geolocation) {
      setGpsAddress("Geolocation tidak didukung browser ini.");
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLatitude(Number(pos.coords.latitude.toFixed(6)));
        setGpsLongitude(Number(pos.coords.longitude.toFixed(6)));
        
        // Simulating sub-districts coordinates around Tulungagung for premium look
        const latsStr = pos.coords.latitude.toFixed(4);
        setGpsAddress(`Lokasi Koordinat Terdeteksi [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`);
        setGeoLoading(false);
      },
      (error) => {
        // Fallback simulated locations around Tulungagung regions
        const mockTulungagungGPS = [
          { name: "Kauman, Kab. Tulungagung", lat: -8.0642, long: 111.8711 },
          { name: "Campurdarat, Kab. Tulungagung", lat: -8.1724, long: 111.8791 },
          { name: "Ngunut, Kab. Tulungagung", lat: -8.0673, long: 111.9965 },
          { name: "Boyolangu, Kab. Tulungagung", lat: -8.0987, long: 111.9022 }
        ];
        const randomLoc = mockTulungagungGPS[Math.floor(Math.random() * mockTulungagungGPS.length)];
        
        setGpsLatitude(randomLoc.lat);
        setGpsLongitude(randomLoc.long);
        setGpsAddress(`Verified • ${randomLoc.name} (Simulasi Lokasi Lapangan)`);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Convert files to base64 beautifully & capture GPS coordinates for each photo
  const handlePhotoUploadAt = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "rumah" | "usaha" | "stok" | "agunan",
    index: number
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (field === "rumah") {
          setPhotosRumah(prev => {
            const copy = [...prev];
            copy[index] = base64;
            return copy;
          });
        }
        if (field === "usaha") {
          setPhotosUsaha(prev => {
            const copy = [...prev];
            copy[index] = base64;
            return copy;
          });
        }
        if (field === "stok") {
          setPhotosStok(prev => {
            const copy = [...prev];
            copy[index] = base64;
            return copy;
          });
        }
        if (field === "agunan") {
          setPhotosAgunan(prev => {
            const copy = [...prev];
            copy[index] = base64;
            return copy;
          });
        }
      };
      reader.readAsDataURL(file);

      // Enforce capture and capture GPS coordinates uniquely for this photo
      const saveCoord = (lat: number, lng: number) => {
        setPhotosCoords(prev => {
          const list = [...(prev[field] || [null, null, null, null])];
          list[index] = { lat, lng };
          return { ...prev, [field]: list };
        });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            saveCoord(lat, lng);
          },
          () => {
            const offsetLat = (Math.random() - 0.5) * 0.0015;
            const offsetLng = (Math.random() - 0.5) * 0.0015;
            const lat = Number((gpsLatitude + offsetLat).toFixed(6));
            const lng = Number((gpsLongitude + offsetLng).toFixed(6));
            saveCoord(lat, lng);
          },
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        const offsetLat = (Math.random() - 0.5) * 0.0015;
        const offsetLng = (Math.random() - 0.5) * 0.0015;
        saveCoord(
          Number((gpsLatitude + offsetLat).toFixed(6)),
          Number((gpsLongitude + offsetLng).toFixed(6))
        );
      }
    }
  };

  const handleGeneralPhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "ktp" | "debitur"
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (type === "ktp") setPhotoKtp(base64);
        if (type === "debitur") setPhotoDebitur(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoFillSamplePhotos = () => {
    setPhotoKtp(TEMPLATE_PHOTOS.ktp);
    setPhotoDebitur(TEMPLATE_PHOTOS.debitur);
    setPhotosRumah([
      TEMPLATE_PHOTOS.rumah,
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400",
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400"
    ]);
    setPhotosUsaha([
      TEMPLATE_PHOTOS.usaha,
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400",
      "https://images.unsplash.com/photo-1581094288338-2314dddb7eed?w=400",
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400"
    ]);
    setPhotosStok([
      TEMPLATE_PHOTOS.stok,
      "https://images.unsplash.com/photo-1553413719-8758737371b2?w=400",
      "https://images.unsplash.com/photo-1493934558415-9d19f0b2b4d2?w=400",
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400"
    ]);
    setPhotosAgunan([
      TEMPLATE_PHOTOS.agunan,
      "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=400",
      "https://images.unsplash.com/photo-1512403754473-278556139b6a?w=400",
      "https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=400"
    ]);

    setPhotosCoords({
      rumah: [
        { lat: -8.1132, lng: 111.9025 },
        { lat: -8.1133, lng: 111.9026 },
        { lat: -8.1131, lng: 111.9024 },
        { lat: -8.1134, lng: 111.9027 }
      ],
      usaha: [
        { lat: -8.1145, lng: 111.9038 },
        { lat: -8.1146, lng: 111.9039 },
        { lat: -8.1144, lng: 111.9037 },
        { lat: -8.1147, lng: 111.9040 }
      ],
      stok: [
        { lat: -8.1129, lng: 111.9012 },
        { lat: -8.1130, lng: 111.9013 },
        { lat: -8.1128, lng: 111.9011 },
        { lat: -8.1131, lng: 111.9014 }
      ],
      agunan: [
        { lat: -8.1150, lng: 111.9045 },
        { lat: -8.1151, lng: 111.9046 },
        { lat: -8.1149, lng: 111.9044 },
        { lat: -8.1152, lng: 111.9047 }
      ]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    if (!borrowerName || !nik || !phone || !businessType) {
      setFormError("Silakan isi nama nasabah, NIK, nomor telepon, dan komoditas usaha.");
      setIsSaving(false);
      return;
    }

    const firstCol = collaterals[0] || { type: "TANPA_AGUNAN", description: "", value: 0 };

    const payload: Partial<CreditSurvey> = {
      id: surveyToEdit?.id || undefined,
      borrowerName,
      nik,
      phone,
      address,
      businessType,
      businessAge: Number(businessAge),
      requestedAmount: Number(requestedAmount),
      requestedTenor: Number(requestedTenor),
      monthlyRevenue: Number(monthlyRevenue),
      monthlyExpenses: Number(monthlyExpenses),
      collateralType: firstCol.type as any,
      collateralDescription: firstCol.description,
      collateralValue: Number(firstCol.value),
      collaterals,
      slikActiveLoans,
      moNotes,
      gpsLatitude,
      gpsLongitude,
      gpsAddress,
      surveyorEmail: currentSession.email,
      officeId: currentSession.officeId,
      scheme,
      scores5c: scores,
      slikStatus,
      sectorType,
      sectorDetails: {
        fishCount: Number(sectorFishCount || 0),
        fishWeightPerUnit: Number(sectorFishWeight || 0),
        fishPricePerKg: Number(sectorFishPrice || 0),
        landSize: Number(sectorLandSize || 0),
        yieldPerUnit: Number(sectorYield || 0),
        pricePerKg: Number(sectorCropPrice || 0),
        livestockCount: Number(sectorLivestockCount || 0),
        livestockPrice: Number(sectorLivestockPrice || 0),
        payrollBaseSalary: Number(sectorPayrollBaseSalary || 0),
        payrollAllowances: Number(sectorPayrollAllowances || 0),
        payrollDeductions: Number(sectorPayrollDeductions || 0)
      },
      photoKtp: photoKtp || TEMPLATE_PHOTOS.ktp,
      photoDebitur: photoDebitur || TEMPLATE_PHOTOS.debitur,
      photoCoordinates: photosCoords,
      surveyPhotos: {
        rumah: photosRumah.map((url, i) => url || TEMPLATE_PHOTOS.rumah),
        usaha: photosUsaha.map((url, i) => url || TEMPLATE_PHOTOS.usaha),
        stok: photosStok.map((url, i) => url || TEMPLATE_PHOTOS.stok),
        agunan: photosAgunan.map((url, i) => url || TEMPLATE_PHOTOS.agunan)
      }
    };

    try {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json();
        setFormError(errData.error || "Gagal menyimpan pengajuan survey.");
      } else {
        localStorage.removeItem("bpr_survey_form_draft");
        onSurveySaved();
      }
    } catch (err) {
      setFormError("Koneksi gagal saat berkomunikasi dengan server.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleScoreChange = (attribute: keyof Scoring5C, value: number) => {
    setScores(prev => ({
      ...prev,
      [attribute]: value
    }));
  };

  const handleQChange = (attribute: keyof Scoring5C, text: string) => {
    setScores(prev => ({
      ...prev,
      [attribute]: text
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {surveyToEdit ? `Ubah Data Survey: ${surveyToEdit.id}` : "Registrasi & Hasil Analisis Survey Baru"}
          </h2>
          <p className="text-xs text-slate-500">Isi lengkap rincian formulir lapangan sesuai standar BPR Bank Tulungagung</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? "Menyimpan..." : "Simpan DRAFT / SUBMIT"}
          </button>
        </div>
      </div>

      {hasDraft && !surveyToEdit && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center justify-between text-xs shadow-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>
              💾 <strong>Draf Pengisian Otomatis:</strong> Data formulir terakhir Anda dipulihkan otomatis (terakhir disimpan pukul {draftSavedAt || "hari ini"}).
            </span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold px-2.5 py-1 rounded-lg border border-amber-300 transition"
          >
            Hapus Draf
          </button>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-semibold">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Section 1: Customer Info & GPS Geotagging */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Informasi Umum Calon Debitur & Pengajuan
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Nama Calon Debitur (Sesuai KTP)</label>
                <input
                  type="text"
                  required
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                  placeholder="Contoh: Haji Slamet Raharjo"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">NIK (KTP)</label>
                <input
                  type="text"
                  required
                  maxLength={16}
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                  placeholder="3504XXXXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Nomor Handphone / WhatsApp</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                  placeholder="0812XXXXXXXX"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Alamat Domisili Lengkap</label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                  placeholder="Nama jalan, RT/RW, Kecamatan..."
                />
              </div>

              {/* LAMPIRAN BERKAS UTAMA: FOTO KTP & FOTO CALON DEBITUR */}
              <div className="col-span-2 grid grid-cols-2 gap-3 pt-1">
                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-indigo-700">Foto KTP Calon Debitur</label>
                  <div className="relative h-28 bg-white border border-dashed border-slate-200 rounded-lg flex flex-col justify-center items-center overflow-hidden group">
                    {photoKtp ? (
                      <>
                        <img src={photoKtp} alt="KTP" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                          <label className="cursor-pointer bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded">Ganti Foto KTP</label>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 block font-medium">Buka Kamera / Pilih Berkas KTP</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleGeneralPhotoUpload(e, "ktp")}
                    />
                  </div>
                </div>

                <div className="border border-slate-100 rounded-lg p-2.5 bg-slate-50/50">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 text-indigo-700">Foto Calon Debitur</label>
                  <div className="relative h-28 bg-white border border-dashed border-slate-200 rounded-lg flex flex-col justify-center items-center overflow-hidden group">
                    {photoDebitur ? (
                      <>
                        <img src={photoDebitur} alt="Debitur" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                          <label className="cursor-pointer bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded">Ganti Foto Diri</label>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-2">
                        <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                        <span className="text-[10px] text-slate-400 block font-medium">Ambil Selfie / Pilih Berkas Diri</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleGeneralPhotoUpload(e, "debitur")}
                    />
                  </div>
                </div>
              </div>

            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-3 pt-1">
              {/* Sektor Analisis select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Skema Sektor Analisis</label>
                <select
                  value={sectorType}
                  onChange={(e) => setSectorType(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55 font-semibold text-slate-700"
                >
                  <option value="UMUM">UMUM (Perdagangan/Jasa/Industri)</option>
                  <option value="PERIKANAN">PERIKANAN (Budidaya/Tangkap)</option>
                  <option value="PERTANIAN">PERTANIAN (Padi/Sawah/Sektor Hijau)</option>
                  <option value="PETERNAKAN">PETERNAKAN (Sapi/Kambing/Unggas)</option>
                  <option value="PAYROLL">PAYROLL (Gaji PNS/Karyawan/BUMN)</option>
                </select>
              </div>

              {/* SLIK Status input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Riwayat SLIK Calon Debitur</label>
                <select
                  value={slikStatus}
                  onChange={(e) => setSlikStatus(e.target.value)}
                  className="w-full text-xs font-semibold border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55 text-indigo-700"
                >
                  <option value="KOL-1 (LANCAR)">KOL-1 (Lancar dan Prima)</option>
                  <option value="KOL-2 (DALAM PERHATIAN KHUSUS)">KOL-2 (Dalam Perhatian Khusus [DPK])</option>
                  <option value="KOL-3 (KURANG LANCAR)">KOL-3 (Kurang Lancar)</option>
                  <option value="KOL-4 (DIRAGUKAN)">KOL-4 (Diragukan)</option>
                  <option value="KOL-5 (MACET)">KOL-5 (Macet Akut)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Komoditas / Jabatan Pekerjaan</label>
                <input
                  type="text"
                  required
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                  placeholder={scheme === "PAYROLL" ? "Contoh: PNS Pemkab, Guru Sertifikasi" : "Contoh: Budidaya Gurame, Warung Lodho"}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider mb-1">Lama Usaha / Masa Kerja (Tahun)</label>
                <input
                  type="number"
                  required
                  value={businessAge}
                  onChange={(e) => setBusinessAge(Number(e.target.value) || 1)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                  min="0"
                />
              </div>

              {/* DETAILED ACTIVE LOANS (MULTI-COLUMN SLIK LOGS) */}
              <div className="col-span-2 bg-indigo-50/10 border border-slate-200 p-4 rounded-lg space-y-3 mt-1 shadow-sm">
                <div className="flex justify-between items-center border-b border-indigo-100/50 pb-2">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      Daftar Pinjaman Aktif di Bank/BPR/LJK Lain (SLIK Detail)
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Isi daftar kewajiban bulanan aktif di lembaga jasa keuangan lain (lebih dari 1 pinjaman)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSlikActiveLoans([
                        ...slikActiveLoans,
                        {
                          id: `slik-${Date.now()}-${slikActiveLoans.length}`,
                          bankName: "",
                          plafond: 0,
                          bakidebet: 0,
                          monthlyInstallment: 0,
                          collectibility: "KOL-1",
                        },
                      ]);
                    }}
                    className="text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition"
                  >
                    + Tambah Pinjaman LJK
                  </button>
                </div>

                {slikActiveLoans.length === 0 ? (
                  <p className="text-[10px] text-slate-400 italic text-center py-2.5">
                    Tidak ada pinjaman luar yang dicatatkan (bila ada, jalankan '+ Tambah Pinjaman LJK').
                  </p>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {slikActiveLoans.map((loan, lIdx) => (
                      <div key={loan.id} className="grid grid-cols-12 gap-2 bg-white p-2.5 rounded border border-slate-200 relative items-end">
                        <div className="col-span-12 flex justify-between items-center text-[9px] font-bold text-slate-500 border-b border-dashed border-slate-100 pb-1">
                          <span>Pinjaman Aktif #{lIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSlikActiveLoans(slikActiveLoans.filter(l => l.id !== loan.id));
                            }}
                            className="text-red-500 hover:text-red-700 text-[9px] font-bold"
                          >
                            Hapus
                          </button>
                        </div>
                        <div className="col-span-4">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Lembaga Pemberi Kredit (LJK)</label>
                          <input
                            type="text"
                            required
                            value={loan.bankName}
                            onChange={(e) => {
                              const updated = [...slikActiveLoans];
                              updated[lIdx].bankName = e.target.value;
                              setSlikActiveLoans(updated);
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-slate-50"
                            placeholder="Contoh: Bank Jatim, BRI, Mandiri"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Plafond (Rp)</label>
                          <input
                            type="number"
                            required
                            value={loan.plafond || ""}
                            onChange={(e) => {
                              const updated = [...slikActiveLoans];
                              updated[lIdx].plafond = Number(e.target.value) || 0;
                              setSlikActiveLoans(updated);
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-slate-55 font-semibold"
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Baki Debet (Rp)</label>
                          <input
                            type="number"
                            required
                            value={loan.bakidebet || ""}
                            onChange={(e) => {
                              const updated = [...slikActiveLoans];
                              updated[lIdx].bakidebet = Number(e.target.value) || 0;
                              setSlikActiveLoans(updated);
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-slate-55"
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Angsuran (Rp)</label>
                          <input
                            type="number"
                            required
                            value={loan.monthlyInstallment || ""}
                            onChange={(e) => {
                              const updated = [...slikActiveLoans];
                              updated[lIdx].monthlyInstallment = Number(e.target.value) || 0;
                              setSlikActiveLoans(updated);
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-slate-55 text-indigo-700 font-bold"
                            placeholder="0"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[8px] font-bold text-slate-500 uppercase mb-0.5">Kolektibilitas</label>
                          <select
                            value={loan.collectibility}
                            onChange={(e) => {
                              const updated = [...slikActiveLoans];
                              updated[lIdx].collectibility = e.target.value;
                              setSlikActiveLoans(updated);
                            }}
                            className="w-full text-[10px] border border-slate-200 rounded px-1 py-1 bg-slate-55 text-indigo-600 font-bold"
                          >
                            <option value="KOL-1">KOL-1</option>
                            <option value="KOL-2">KOL-2</option>
                            <option value="KOL-3">KOL-3</option>
                            <option value="KOL-4">KOL-4</option>
                            <option value="KOL-5">KOL-5</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* DYNAMIC SECTOR ANALYSIS PANEL */}
              {sectorType !== "UMUM" && (
                <div className="col-span-2 bg-slate-50 border border-slate-200/80 p-3.5 rounded-lg space-y-3.5 mt-1 transition-all">
                  <span className="block text-[10px] font-bold text-indigo-850 uppercase tracking-widest">
                    ⚡ Sub-Kalkulus Pendapatan Sektor {sectorType}
                  </span>

                  {sectorType === "PERIKANAN" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Banyak Ikan (ekor)</label>
                          <input
                            type="number"
                            value={sectorFishCount || ""}
                            onChange={(e) => setSectorFishCount(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 1000"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Berat/Ekor (Kg)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={sectorFishWeight || ""}
                            onChange={(e) => setSectorFishWeight(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Otomatis Terkonversi (Kg)</label>
                          <div className="w-full text-xs border border-slate-100 rounded px-2 py-1 bg-slate-100/50 font-bold font-mono">
                            {(sectorFishCount * sectorFishWeight).toFixed(1)} Kg
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Harga Ikan per Kg (Rp)</label>
                          <input
                            type="number"
                            value={sectorFishPrice || ""}
                            onChange={(e) => setSectorFishPrice(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 24000"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Estimasi Pendapatan Panen</label>
                          <div className="w-full text-xs border border-indigo-100 rounded px-2 py-1 bg-indigo-50/50 font-bold text-indigo-700 font-mono">
                            Rp {(sectorFishCount * sectorFishWeight * sectorFishPrice).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMonthlyRevenue(sectorFishCount * sectorFishWeight * sectorFishPrice)}
                        className="w-full py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded transition border border-indigo-200 flex justify-center items-center gap-1"
                      >
                        Salin Rp {(sectorFishCount * sectorFishWeight * sectorFishPrice).toLocaleString("id-ID")} ke Kolom Omzet Bulanan
                      </button>
                    </div>
                  )}

                  {sectorType === "PERTANIAN" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Luas Lahan (m²)</label>
                          <input
                            type="number"
                            value={sectorLandSize || ""}
                            onChange={(e) => setSectorLandSize(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 2000"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Hasil (Kg / m²)</label>
                          <input
                            type="number"
                            step="0.05"
                            value={sectorYield || ""}
                            onChange={(e) => setSectorYield(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 0.8"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Hasil Panen (Kg)</label>
                          <div className="w-full text-xs border border-slate-100 rounded px-2 py-1 bg-slate-100/50 font-bold font-mono">
                            {(sectorLandSize * sectorYield).toFixed(1)} Kg
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Harga Komoditas per Kg (Rp)</label>
                          <input
                            type="number"
                            value={sectorCropPrice || ""}
                            onChange={(e) => setSectorCropPrice(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 6500"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Estimasi Pendapatan Hijau</label>
                          <div className="w-full text-xs border border-indigo-100 rounded px-2 py-1 bg-indigo-50/50 font-bold text-indigo-700 font-mono">
                            Rp {(sectorLandSize * sectorYield * sectorCropPrice).toLocaleString("id-ID")}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMonthlyRevenue(sectorLandSize * sectorYield * sectorCropPrice)}
                        className="w-full py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded transition border border-indigo-200 flex justify-center items-center gap-1"
                      >
                        Salin Rp {(sectorLandSize * sectorYield * sectorCropPrice).toLocaleString("id-ID")} ke Kolom Omzet Bulanan
                      </button>
                    </div>
                  )}

                  {sectorType === "PETERNAKAN" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Jumlah Ternak/Hewan (ekor)</label>
                          <input
                            type="number"
                            value={sectorLivestockCount || ""}
                            onChange={(e) => setSectorLivestockCount(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 8"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Taksiran Nilai per Ekor (Rp)</label>
                          <input
                            type="number"
                            value={sectorLivestockPrice || ""}
                            onChange={(e) => setSectorLivestockPrice(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 15000000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Estimasi Nilai Total Ternak</label>
                        <div className="w-full text-xs border border-indigo-100 rounded px-2 py-1 bg-indigo-50/50 font-bold text-indigo-700 font-mono">
                          Rp {(sectorLivestockCount * sectorLivestockPrice).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setMonthlyRevenue(Math.round((sectorLivestockCount * sectorLivestockPrice) / 12))}
                        className="w-full py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded transition border border-indigo-200 flex justify-center items-center gap-1"
                      >
                        Terapkan Setara Bulanan (Total/12) Rp {Math.round((sectorLivestockCount * sectorLivestockPrice) / 12).toLocaleString("id-ID")} ke Kolom Omzet
                      </button>
                    </div>
                  )}

                  {sectorType === "PAYROLL" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Gaji Pokok / Bulan (Rp)</label>
                          <input
                            type="number"
                            value={sectorPayrollBaseSalary || ""}
                            onChange={(e) => setSectorPayrollBaseSalary(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white font-semibold"
                            placeholder="Contoh: 5000000"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Tunjangan Rutin (Rp)</label>
                          <input
                            type="number"
                            value={sectorPayrollAllowances || ""}
                            onChange={(e) => setSectorPayrollAllowances(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                            placeholder="Contoh: 1500000"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Potongan Gaji (Rp)</label>
                          <input
                            type="number"
                            value={sectorPayrollDeductions || ""}
                            onChange={(e) => setSectorPayrollDeductions(Number(e.target.value) || 0)}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white text-rose-600"
                            placeholder="Contoh: 500000"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-medium text-slate-500 mb-0.5">Estimasi Pendapatan Bersih (Take Home Pay)</label>
                        <div className="w-full text-xs border border-indigo-100 rounded px-2 py-1 bg-indigo-50/50 font-bold text-indigo-700 font-mono">
                          Rp {Math.max(0, sectorPayrollBaseSalary + sectorPayrollAllowances - sectorPayrollDeductions).toLocaleString("id-ID")}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const income = Math.max(0, sectorPayrollBaseSalary + sectorPayrollAllowances - sectorPayrollDeductions);
                          setMonthlyRevenue(income);
                          setMonthlyExpenses(0); // expenses of life are already offset by high DSR (Debt Service Ratio) allowance (typically 90%)
                        }}
                        className="w-full py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded transition border border-indigo-200 flex justify-center items-center gap-1"
                      >
                        Salin Rp {Math.max(0, sectorPayrollBaseSalary + sectorPayrollAllowances - sectorPayrollDeductions).toLocaleString("id-ID")} ke Kolom Omzet/Pendapatan Bersih
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Plafon Kredit Diajukan (Rp)</label>
                <input
                  type="number"
                  required
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(Number(e.target.value) || 0)}
                  className="w-full text-xs font-bold border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55 text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Tenor Pengajuan (Bulan)</label>
                <input
                  type="number"
                  required
                  value={requestedTenor}
                  onChange={(e) => setRequestedTenor(Number(e.target.value) || 12)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Omzet/Pendapatan Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55 text-emerald-800 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-505 uppercase tracking-wider mb-1">Operasional & Biaya Hidup (Rp)</label>
                <input
                  type="number"
                  required
                  value={monthlyExpenses}
                  onChange={(e) => setMonthlyExpenses(Number(e.target.value) || 0)}
                  className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-slate-55"
                />
              </div>

              <div className="col-span-2 bg-indigo-50/45 p-2.5 rounded border border-indigo-100/50 flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Sisa Pendapatan Bersih (Net Income):</span>
                <span className="font-bold text-indigo-700">Rp {(monthlyRevenue - monthlyExpenses).toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>

          {/* Collateral Details (Multi-Collateral Supported) */}
          <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                Definisi & Nilai Taksiran Agunan Jaminan (Mendukung Multi-Agunan)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setCollaterals([
                    ...collaterals,
                    {
                      id: `col-${Date.now()}-${collaterals.length}`,
                      type: scheme === "PAYROLL" ? "SK_ASLI" : "BPKB",
                      description: "",
                      value: 0,
                    },
                  ]);
                }}
                className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1 rounded transition"
              >
                + Tambah Jaminan Baru
              </button>
            </div>

            <div className="space-y-4">
              {collaterals.map((col, idx) => (
                <div key={col.id} className="p-3 bg-slate-50/50 rounded-lg border border-slate-200 relative space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">Agunan Fisik #{idx + 1}</span>
                    {collaterals.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setCollaterals(collaterals.filter((item) => item.id !== col.id));
                        }}
                        className="text-[10px] text-red-500 hover:text-red-700 font-semibold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Jenis Agunan Fisik</label>
                      <select
                        value={col.type}
                        onChange={(e) => {
                          const updated = [...collaterals];
                          updated[idx].type = e.target.value as any;
                          setCollaterals(updated);
                          if (idx === 0) setCollateralType(e.target.value as any);
                        }}
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white font-semibold text-slate-700"
                      >
                        <option value="SHM">Sertifikat Hak Milik (SHM/Tanah)</option>
                        <option value="BPKB">BPKB Kendaraan Motor / Mobil</option>
                        <option value="LOS_PASAR">Izin Los / Pasar Rakyat</option>
                        <option value="SK_ASLI">SK Asli Surat Keputusan Kerja (Payroll)</option>
                        <option value="TANPA_AGUNAN">Tanpa Agunan (Kredit Murni)</option>
                        <option value="LAINNYA">Lain-lain / Dokumen Berharga</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Nilai Pasar Taksiran Agunan (Rp)</label>
                      <input
                        type="number"
                        value={col.value || ""}
                        onChange={(e) => {
                          const updated = [...collaterals];
                          updated[idx].value = Number(e.target.value) || 0;
                          setCollaterals(updated);
                          if (idx === 0) setCollateralValue(Number(e.target.value) || 0);
                        }}
                        className="w-full text-xs font-bold border border-slate-200 rounded px-2 py-1.5 bg-white text-emerald-700"
                        placeholder="0"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Deskripsi Detail Agunan</label>
                      <input
                        type="text"
                        value={col.description}
                        onChange={(e) => {
                          const updated = [...collaterals];
                          updated[idx].description = e.target.value;
                          setCollaterals(updated);
                          if (idx === 0) setCollateralDescription(e.target.value);
                        }}
                        className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 bg-white"
                        placeholder="Masukkan nomor SHM/BPKB, atas nama siapa, masa berlaku SK, dll."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GPS Geotagging API simulation */}
          <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Koordinat Geotagging Lapangan
              </h3>
              <button
                type="button"
                onClick={captureGPS}
                disabled={geoLoading}
                className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-2 py-1 flex items-center gap-1 font-bold hover:bg-indigo-100 transition"
              >
                <MapPin className="w-3 h-3" />
                {geoLoading ? "Mengunci..." : "Kunci Geotagging GPS"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-slate-600 font-mono">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Latitude</span>
                <span className="font-semibold text-slate-800">{gpsLatitude}° S</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block font-sans">Longitude</span>
                <span className="font-semibold text-slate-800">{gpsLongitude}° E</span>
              </div>
              <div className="col-span-2 pt-1 font-sans">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Alamat Terverifikasi GPS</span>
                <div className="bg-slate-50 border border-slate-100 rounded p-2 italic font-medium text-[11px] text-slate-700 mt-0.5">
                  {gpsAddress}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: 5C Detailed Matrix & Photos upload */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Matriks Skoring Kelayakan 5C
              </h3>
              <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setScheme("PJI")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    scheme === "PJI" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  PJI (Komersil)
                </button>
                <button
                  type="button"
                  onClick={() => setScheme("PPP")}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    scheme === "PPP" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  PPP (Pertanian)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setScheme("PAYROLL");
                    // Automatically add or select SK_ASLI collateral
                    const hasSkAsli = collaterals.some(c => c.type === "SK_ASLI");
                    if (!hasSkAsli) {
                      setCollaterals([
                        {
                          id: `col-pr-${Date.now()}`,
                          type: "SK_ASLI",
                          description: "SK Asli Kerja Pegawai",
                          value: 0
                        }
                      ]);
                      setCollateralType("SK_ASLI");
                      setCollateralDescription("SK Asli Kerja Pegawai");
                      setCollateralValue(0);
                    }
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition ${
                    scheme === "PAYROLL" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Payroll
                </button>
              </div>
            </div>

            <div className="text-[10px] bg-indigo-50/40 text-indigo-950 px-3 py-2 rounded border border-indigo-100/50 flex gap-2">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <p>
                {scheme === "PAYROLL"
                  ? "Kredit Payroll: Maksimal angsuran 90% gaji (DSR), mengabaikan biaya hidup & SLIK bank lain. Tenor maks 120 bulan. Agunan wajib berupa SK Asli Kerja."
                  : scheme === "PJI"
                  ? "Sektor Perdagangan/Jasa/Industri: Fokus utama pada kecepatan turnover kas, reputasi supplier, dan likuiditas jaminan."
                  : "Sektor Pertanian/Peternakan/Perikanan: Fokus pada kerentanan irigasi, siklus panen musiman, fluktuasi harga komoditas."}
              </p>
            </div>

            {/* 5C SLIDERS & CUSTOM CHECK LISTS */}
            <div className="space-y-4">
              
              {/* CHARACTER */}
              <div className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">1. Character (Karakter)</span>
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 rounded px-1.5">{scores.character}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.character}
                  onChange={(e) => handleScoreChange("character", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Analisis Kualitatif Karakter</label>
                  <input
                    type="text"
                    value={scores.qCharacter}
                    onChange={(e) => handleQChange("qCharacter", e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
                    placeholder={
                      scheme === "PJI"
                        ? "SLIK checking lancar, terpercaya di lingkungan pasar"
                        : "Anggota aktif kelompok tani, jaminan persetujuan kades"
                    }
                  />
                </div>
              </div>

              {/* CAPACITY */}
              <div className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">2. Capacity (Kapasitas Angsuran)</span>
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 rounded px-1.5">{scores.capacity}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.capacity}
                  onChange={(e) => handleScoreChange("capacity", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Analisis Kualitatif Kapasitas</label>
                  <input
                    type="text"
                    value={scores.qCapacity}
                    onChange={(e) => handleQChange("qCapacity", e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
                    placeholder={
                      scheme === "PJI"
                        ? "Pembukuan kas harian lengkap, omzet stabil rutin"
                        : "Siklus panen terekam baik, ada cadangan kelontong harian"
                    }
                  />
                </div>
              </div>

              {/* CAPITAL */}
              <div className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">3. Capital (Permodalan Usaha)</span>
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 rounded px-1.5">{scores.capital}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.capital}
                  onChange={(e) => handleScoreChange("capital", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Analisis Kualitatif Modal</label>
                  <input
                    type="text"
                    value={scores.qCapital}
                    onChange={(e) => handleQChange("qCapital", e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
                    placeholder={
                      scheme === "PJI"
                        ? "Modal sendiri 60% untuk barang dagangan"
                        : "Kepemilikan lahan sendiri, bibit dibeli tunai"
                    }
                  />
                </div>
              </div>

              {/* COLLATERAL */}
              <div className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">4. Collateral (Jaminan Fisik)</span>
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 rounded px-1.5">{scores.collateral}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.collateral}
                  onChange={(e) => handleScoreChange("collateral", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Analisis Kualitatif Agunan</label>
                  <input
                    type="text"
                    value={scores.qCollateral}
                    onChange={(e) => handleQChange("qCollateral", e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
                    placeholder={
                      scheme === "PJI"
                        ? "Jaminan BPKB motor terawat, nilai taksir di atas Rp10jt"
                        : "SHM atas nama orang tua kandung dengan surat persetujuan lengkap"
                    }
                  />
                </div>
              </div>

              {/* CONDITION */}
              <div className="border border-slate-100 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">5. Condition (Kondisi Makro Sektor)</span>
                  <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 rounded px-1.5">{scores.condition}/100</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={scores.condition}
                  onChange={(e) => handleScoreChange("condition", Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Analisis Kualitatif Kondisi Pasar</label>
                  <input
                    type="text"
                    value={scores.qCondition}
                    onChange={(e) => handleQChange("qCondition", e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50"
                    placeholder={
                      scheme === "PJI"
                        ? "Lokasi ramai dekat pusat keramaian Tulungagung"
                        : "Fluktuasi pakan teratasi dengan suplier pakan alternatif"
                    }
                  />
                </div>
              </div>

            </div>
          </div>

          {/* 4 Mandatory Photos Upload Frame */}
          <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-slate-100 pb-2.5 gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  Upload Foto Lapangan (Minimal 4 Per Kategori)
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Ambil gambar langsung melalui HP atau upload berkas surveyor lengkap koordinat GPS</p>
              </div>
              <button
                type="button"
                onClick={autoFillSamplePhotos}
                className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 py-1.5 flex items-center gap-1 hover:bg-indigo-100 transition self-start sm:self-auto"
              >
                <Layers className="w-3 h-3" />
                Gunakan Preset 16 Foto HP
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Kategori 1: Rumah Tinggal (4 Foto) */}
              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">1. Rumah Tinggal Calon Debitur</span>
                  <span className="text-[9px] font-bold bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded-full">
                    {photosRumah.filter(Boolean).length}/4 Foto
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {photosRumah.map((photo, i) => {
                    const coord = photosCoords.rumah?.[i];
                    const inputId = `upload-rumah-${i}`;
                    return (
                      <div key={i} className="relative aspect-square sm:aspect-video bg-white border border-dashed border-slate-250 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Rumah ${i+1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                              <span className="text-[8px] text-white font-bold uppercase tracking-wider">Rumah {i+1}</span>
                              <label htmlFor={inputId} className="cursor-pointer bg-white text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                Ganti
                              </label>
                            </div>
                            {coord && (
                              <div className="absolute bottom-1 left-1 right-1 text-[7px] font-mono text-emerald-800 bg-white/90 border border-emerald-100 px-1 py-0.5 rounded shadow-sm flex items-center justify-center gap-0.5 truncate">
                                <MapPin className="w-2 h-2 text-emerald-600 flex-shrink-0" />
                                <span>GPS Ok</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <label htmlFor={inputId} className="cursor-pointer text-center p-1 w-full h-full flex flex-col items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            <span className="text-[8px] text-slate-400 font-bold block">Foto {i+1}</span>
                            <span className="text-[7px] text-slate-300 block">Wajib</span>
                          </label>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id={inputId}
                          className="hidden"
                          onChange={(e) => handlePhotoUploadAt(e, "rumah", i)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kategori 2: Tempat Usaha (4 Foto) */}
              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">2. Tempat Usaha Calon Debitur</span>
                  <span className="text-[9px] font-bold bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded-full">
                    {photosUsaha.filter(Boolean).length}/4 Foto
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {photosUsaha.map((photo, i) => {
                    const coord = photosCoords.usaha?.[i];
                    const inputId = `upload-usaha-${i}`;
                    return (
                      <div key={i} className="relative aspect-square sm:aspect-video bg-white border border-dashed border-slate-250 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Usaha ${i+1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                              <span className="text-[8px] text-white font-bold uppercase tracking-wider">Usaha {i+1}</span>
                              <label htmlFor={inputId} className="cursor-pointer bg-white text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                Ganti
                              </label>
                            </div>
                            {coord && (
                              <div className="absolute bottom-1 left-1 right-1 text-[7px] font-mono text-emerald-800 bg-white/90 border border-emerald-100 px-1 py-0.5 rounded shadow-sm flex items-center justify-center gap-0.5 truncate">
                                <MapPin className="w-2 h-2 text-emerald-600 flex-shrink-0" />
                                <span>GPS Ok</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <label htmlFor={inputId} className="cursor-pointer text-center p-1 w-full h-full flex flex-col items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            <span className="text-[8px] text-slate-400 font-bold block">Foto {i+1}</span>
                            <span className="text-[7px] text-slate-300 block">Wajib</span>
                          </label>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id={inputId}
                          className="hidden"
                          onChange={(e) => handlePhotoUploadAt(e, "usaha", i)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kategori 3: Stok Barang (4 Foto) */}
              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">3. Stok Dagang / Persediaan / Hasil Panen</span>
                  <span className="text-[9px] font-bold bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded-full">
                    {photosStok.filter(Boolean).length}/4 Foto
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {photosStok.map((photo, i) => {
                    const coord = photosCoords.stok?.[i];
                    const inputId = `upload-stok-${i}`;
                    return (
                      <div key={i} className="relative aspect-square sm:aspect-video bg-white border border-dashed border-slate-250 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Stok ${i+1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                              <span className="text-[8px] text-white font-bold uppercase tracking-wider">Stok {i+1}</span>
                              <label htmlFor={inputId} className="cursor-pointer bg-white text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                Ganti
                              </label>
                            </div>
                            {coord && (
                              <div className="absolute bottom-1 left-1 right-1 text-[7px] font-mono text-emerald-800 bg-white/90 border border-emerald-100 px-1 py-0.5 rounded shadow-sm flex items-center justify-center gap-0.5 truncate">
                                <MapPin className="w-2 h-2 text-emerald-600 flex-shrink-0" />
                                <span>GPS Ok</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <label htmlFor={inputId} className="cursor-pointer text-center p-1 w-full h-full flex flex-col items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            <span className="text-[8px] text-slate-400 font-bold block">Foto {i+1}</span>
                            <span className="text-[7px] text-slate-300 block">Wajib</span>
                          </label>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id={inputId}
                          className="hidden"
                          onChange={(e) => handlePhotoUploadAt(e, "stok", i)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kategori 4: Jaminan / Agunan (4 Foto) */}
              <div className="border border-slate-150 rounded-xl p-3.5 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-1">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">4. Agunan / Jaminan Fisik Kredit</span>
                  <span className="text-[9px] font-bold bg-indigo-55 text-indigo-700 px-2 py-0.5 rounded-full">
                    {photosAgunan.filter(Boolean).length}/4 Foto
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {photosAgunan.map((photo, i) => {
                    const coord = photosCoords.agunan?.[i];
                    const inputId = `upload-agunan-${i}`;
                    return (
                      <div key={i} className="relative aspect-square sm:aspect-video bg-white border border-dashed border-slate-250 rounded-lg flex flex-col items-center justify-center overflow-hidden group">
                        {photo ? (
                          <>
                            <img src={photo} alt={`Agunan ${i+1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1">
                              <span className="text-[8px] text-white font-bold uppercase tracking-wider">Agunan {i+1}</span>
                              <label htmlFor={inputId} className="cursor-pointer bg-white text-slate-800 text-[8px] font-bold px-1.5 py-0.5 rounded shadow">
                                Ganti
                              </label>
                            </div>
                            {coord && (
                              <div className="absolute bottom-1 left-1 right-1 text-[7px] font-mono text-emerald-800 bg-white/90 border border-emerald-100 px-1 py-0.5 rounded shadow-sm flex items-center justify-center gap-0.5 truncate">
                                <MapPin className="w-2 h-2 text-emerald-600 flex-shrink-0" />
                                <span>GPS Ok</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <label htmlFor={inputId} className="cursor-pointer text-center p-1 w-full h-full flex flex-col items-center justify-center">
                            <Camera className="w-3.5 h-3.5 text-slate-400 mx-auto mb-0.5" />
                            <span className="text-[8px] text-slate-400 font-bold block">Foto {i+1}</span>
                            <span className="text-[7px] text-slate-300 block">Wajib</span>
                          </label>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          id={inputId}
                          className="hidden"
                          onChange={(e) => handlePhotoUploadAt(e, "agunan", i)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Qualitative MO Notes */}
          <div className="bg-white rounded-xl border border-slate-250 p-5 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">
              Catatan & Opini Kelayakan Marketing Officer (MO)
            </h3>
            <textarea
              rows={3}
              required
              value={moNotes}
              onChange={(e) => setMoNotes(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded px-2.5 py-2 bg-slate-55 mb-2"
              placeholder="Berikan ringkasan kesimpulan Anda sebagai petugas survey lapangan mengenai karakter, agunan, prospek komoditas..."
            />
          </div>
        </div>

      </div>
    </form>
  );
}
