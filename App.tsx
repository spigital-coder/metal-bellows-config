import React, { useState, useMemo, useEffect, useRef } from 'react';
import Header from './components/Header';
import SpecsTable from './components/SpecsTable';
import Visualizer from './Visualizer';
import LoginModal from './components/LoginModal';
import AdminDashboard from './components/AdminDashboard';
import { CUFF_OPTIONS, BELLOWS_DATA } from './data';
import { BellowsPart, QuoteSubmission } from './types';
import { db } from './api/database';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    XLSX: any;
  }
}

const APPLICATION_OPTIONS = [
  "Oil & Gas",
  "Power Generation",
  "Aerospace, Space and Defense",
  "Marine Bellows and Expansion Joints",
  "Industrial and OEM",
  "Water and Wastewater",
  "Automotive",
  "Pulp and Paper",
  "Other"
];

const parseValue = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
};

const conversions = {
  length: { IN: 1, MM: 25.4, DM: 25.4, FT: 1 / 12, NB: 1 },
  pressure: { PSIG: 1, BAR: 0.0689476 }
};

function App() {
  const [bellowsList, setBellowsList] = useState<BellowsPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [selectedPartNumber, setSelectedPartNumber] = useState<string>('');
  const [diameterInput, setDiameterInput] = useState<string>('');
  const [oalInput, setOalInput] = useState<string>('');
  const [diameterUnit, setDiameterUnit] = useState<string>('IN');
  const [oalUnit, setOalUnit] = useState<string>('IN');
  const [pressure, setPressure] = useState('');
  const [pressureUnit, setPressureUnit] = useState('PSIG');
  const [temperature, setTemperature] = useState('');
  const [tempUnit, setTempUnit] = useState('°F');
  
  const prevDiameterUnit = useRef('IN');
  const prevOalUnit = useRef('IN');
  const prevPressureUnit = useRef('PSIG');
  const prevTempUnit = useRef('°F');

  const [cyclesValue, setCyclesValue] = useState('');
  const [cycleType, setCycleType] = useState('Non-concurrent');
  const [application, setApplication] = useState('');
  const [customApplication, setCustomApplication] = useState('');
  const [cuffType, setCuffType] = useState<string>(CUFF_OPTIONS[0]);

  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        const session = await db.auth.getSession();
        if (session) setIsAdmin(true);
        await refreshData();
      } catch (e) {
        setBellowsList(BELLOWS_DATA);
      } finally {
        setLoading(false);
      }
    };
    initApp();
  }, []);

  const refreshData = async () => {
    try {
      const data = await db.getAll();
      if (data && data.length > 0) setBellowsList(data);
      else setBellowsList(BELLOWS_DATA);
    } catch (e) {
      setBellowsList(BELLOWS_DATA);
    }
  };

  useEffect(() => {
    if (diameterInput) {
      const val = parseValue(diameterInput);
      const inInches = val / (conversions.length[prevDiameterUnit.current as keyof typeof conversions.length] || 1);
      const converted = inInches * (conversions.length[diameterUnit as keyof typeof conversions.length] || 1);
      setDiameterInput(converted.toFixed(diameterUnit === 'FT' ? 3 : 2));
    }
    prevDiameterUnit.current = diameterUnit;
  }, [diameterUnit]);

  useEffect(() => {
    if (oalInput) {
      const val = parseValue(oalInput);
      const inInches = val / (conversions.length[prevOalUnit.current as keyof typeof conversions.length] || 1);
      const converted = inInches * (conversions.length[oalUnit as keyof typeof conversions.length] || 1);
      setOalInput(converted.toFixed(oalUnit === 'FT' ? 3 : 2));
    }
    prevOalUnit.current = oalUnit;
  }, [oalUnit]);

  useEffect(() => {
    if (pressure) {
      const val = parseValue(pressure);
      const inPsig = val / (conversions.pressure[prevPressureUnit.current as keyof typeof conversions.pressure] || 1);
      const converted = inPsig * (conversions.pressure[pressureUnit as keyof typeof conversions.pressure] || 1);
      setPressure(converted.toFixed(2));
    }
    prevPressureUnit.current = pressureUnit;
  }, [pressureUnit]);

  useEffect(() => {
    if (temperature) {
      const val = parseValue(temperature);
      let converted: number;
      if (tempUnit === '°C' && prevTempUnit.current === '°F') {
        converted = (val - 32) * 5 / 9;
      } else if (tempUnit === '°F' && prevTempUnit.current === '°C') {
        converted = (val * 9 / 5) + 32;
      } else {
        converted = val;
      }
      setTemperature(Math.round(converted).toString());
    }
    prevTempUnit.current = tempUnit;
  }, [tempUnit]);

  const getDisplayLength = (val: number, unit: string) => {
    const factor = conversions.length[unit as keyof typeof conversions.length] || 1;
    const converted = val * factor;
    return converted.toFixed(unit === 'FT' ? 3 : 2);
  };

  const selectedPart = useMemo(() => {
    return bellowsList.find(p => p.part_number === selectedPartNumber) || null;
  }, [selectedPartNumber, bellowsList]);

  const catalogDiameters = useMemo(() => {
    const sizes = bellowsList.map(p => p.pipe_size);
    return Array.from(new Set(sizes)).sort((a: number, b: number) => a - b);
  }, [bellowsList]);

  const catalogPressures = useMemo(() => {
    const values = bellowsList.map(p => p.pressure_psig);
    const unique = Array.from(new Set(values)).filter(v => v && v !== 'NIL');
    return unique.sort();
  }, [bellowsList]);

  const catalogTemperatures = useMemo(() => {
    const values = bellowsList.map(p => p.temperature_f);
    const unique = Array.from(new Set(values)).filter(v => v && v !== 'NIL');
    return unique.sort();
  }, [bellowsList]);

  const availableOALs = useMemo(() => {
    if (!diameterInput) return [];
    const uDia = parseValue(diameterInput);
    const inInches = uDia / (conversions.length[diameterUnit as keyof typeof conversions.length] || 1);
    const filtered = bellowsList.filter(p => Math.abs(p.pipe_size - inInches) < 0.1);
    const lengths = filtered.map(p => p.overall_length_oal_in);
    return Array.from(new Set(lengths)).sort((a: number, b: number) => a - b);
  }, [bellowsList, diameterInput, diameterUnit]);

  const availablePartNumbers = useMemo(() => {
    if (!diameterInput && !oalInput && !pressure && !temperature) {
      return bellowsList;
    }
    const uDia = parseValue(diameterInput) / (conversions.length[diameterUnit as keyof typeof conversions.length] || 1);
    const uOal = parseValue(oalInput) / (conversions.length[oalUnit as keyof typeof conversions.length] || 1);

    return bellowsList
      .map(p => {
        const diaDiff = uDia > 0 ? Math.abs(p.pipe_size - uDia) / uDia : 0;
        const oalDiff = uOal > 0 ? Math.abs(p.overall_length_oal_in - uOal) / uOal : 0;
        const diaMatch = !diameterInput || diaDiff <= 0.20; 
        const oalMatch = !oalInput || oalDiff <= 0.30; 
        const pressMatch = !pressure || p.pressure_psig.toLowerCase().includes(pressure.toLowerCase());
        const tempMatch = !temperature || p.temperature_f.toLowerCase().includes(temperature.toLowerCase());

        return { 
          part: p, 
          isMatch: diaMatch && oalMatch && pressMatch && tempMatch,
          diff: diaDiff + oalDiff
        };
      })
      .filter(item => item.isMatch)
      .sort((a, b) => a.diff - b.diff)
      .map(item => item.part);
  }, [bellowsList, diameterInput, diameterUnit, oalInput, oalUnit, pressure, temperature]);

  const handleNextPart = () => {
    const currentIndex = availablePartNumbers.findIndex(p => p.part_number === selectedPartNumber);
    if (currentIndex < availablePartNumbers.length - 1) {
      handlePartNumberChange(availablePartNumbers[currentIndex + 1].part_number);
    }
  };

  const handlePrevPart = () => {
    const currentIndex = availablePartNumbers.findIndex(p => p.part_number === selectedPartNumber);
    if (currentIndex > 0) {
      handlePartNumberChange(availablePartNumbers[currentIndex - 1].part_number);
    }
  };

  const handleLogout = async () => {
    await db.auth.signOut();
    setIsAdmin(false);
    setShowDashboard(false);
  };

  useEffect(() => {
    if (selectedPart) {
      setPressure(String(selectedPart.pressure_psig));
      setCyclesValue(String(selectedPart.number_of_cycles));
      setCycleType(selectedPart.cycles_format);
      
      const pTemp = parseValue(selectedPart.temperature_f);
      if (tempUnit === '°C') {
        setTemperature(Math.round((pTemp - 32) * 5 / 9).toString());
      } else {
        setTemperature(pTemp.toString());
      }
    }
  }, [selectedPart]);

  const handlePartNumberChange = (partNum: string) => {
    if (!partNum) {
      setSelectedPartNumber('');
      return;
    }
    setSelectedPartNumber(partNum);
    const part = bellowsList.find(p => p.part_number === partNum);
    if (part) {
      setDiameterInput(getDisplayLength(part.pipe_size, diameterUnit));
      setOalInput(getDisplayLength(part.overall_length_oal_in, oalUnit));
      setPressure(part.pressure_psig);
    }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPart) {
      alert("Please select a part number from the recommendations list first.");
      return;
    }
    
    if (!contactName || !email || !companyName || !phone || !country || !city || !postalCode) {
      alert("Please complete all fields in the 'Contact Info' section before generating the report.");
      return;
    }

    setIsSubmitting(true);
    const { jsPDF } = window.jspdf;
    
    if (!jsPDF || !window.html2canvas) {
      alert("Required libraries are not loaded. Please check your internet connection.");
      setIsSubmitting(false);
      return;
    }

    // Capture visualizer first so we can potentially use it or ensure it's rendered
    const visualizerElement = document.querySelector('.visualizer-container') as HTMLElement;
    let visualizerImg = "";
    if (visualizerElement) {
      const canvas = await window.html2canvas(visualizerElement, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      });
      visualizerImg = canvas.toDataURL('image/png');
    }

    // Log to Lead Capture Database (Supabase)
    try {
      const submission: QuoteSubmission = {
        contact_name: contactName,
        company_name: companyName,
        email: email,
        phone: phone,
        street_address: `${country}, ${city}, ${postalCode}`,
        city: city,
        postal_code: postalCode,
        country: country,
        part_number: selectedPart.part_number,
        configuration_data: {
          diameter: `${diameterInput} ${diameterUnit}`,
          length: `${oalInput} ${oalUnit}`,
          pressure: `${pressure} ${pressureUnit}`,
          temp: `${temperature} ${tempUnit}`,
          cuff: cuffType,
          application: application || customApplication || 'General Industrial',
          movements: {
            axial: `${selectedPart.axial_movement_in}"`,
            lateral: `${selectedPart.lateral_movement_in}"`,
            angular: `${selectedPart.angular_movement_deg}°`
          }
        }
      };

      const dbRes = await db.submissions.create(submission);
      if (!dbRes.success) {
        console.error("CRM Database sync failed:", dbRes.error);
      } else {
        console.log("Lead successfully captured in CRM.");
      }
    } catch (dbErr) {
      console.error("Submission error:", dbErr);
    }

    // Generate PDF for User
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const bsRed = [200, 10, 55];
    const bsDark = [65, 64, 66];

    try {
      const logoUrl = "https://www.bellows-systems.com/wp-content/uploads/2024/05/BSI-black-Logo.webp";
      const loadImg = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "Anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = url;
        });
      };

      const logoImg = await loadImg(logoUrl);
      if (logoImg) doc.addImage(logoImg, 'WEBP', 15, 10, 45, 10);
      else {
        doc.setFontSize(14);
        doc.setTextColor(bsRed[0], bsRed[1], bsRed[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('BELLOWS SYSTEMS', 15, 17);
      }
      
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.setFont('helvetica', 'bold');
      doc.text('ENGINEERING QUOTATION REPORT', 195, 17, { align: 'right' });
      doc.setDrawColor(bsRed[0], bsRed[1], bsRed[2]);
      doc.setLineWidth(0.8);
      doc.line(15, 24, 195, 24);

      doc.setFontSize(10);
      doc.setTextColor(bsRed[0], bsRed[1], bsRed[2]);
      doc.text('PROJECT OVERVIEW', 15, 34);
      doc.setTextColor(bsDark[0], bsDark[1], bsDark[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      let leftY = 42;
      doc.text(`Contact: ${contactName}`, 15, leftY);
      doc.text(`Company: ${companyName}`, 15, leftY + 5);
      doc.text(`Email: ${email}`, 15, leftY + 10);
      doc.text(`Phone: ${phone}`, 15, leftY + 15);
      doc.text(`Location: ${city}, ${country} ${postalCode}`, 15, leftY + 20);

      doc.text(`Part Number:`, 100, leftY);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedPart.part_number, 125, leftY);
      doc.setFont('helvetica', 'normal');
      doc.text(`Application:`, 100, leftY + 5);
      doc.text(application || customApplication || 'General Industrial', 125, leftY + 5);
      doc.text(`End Config:`, 100, leftY + 10);
      doc.text(cuffType, 125, leftY + 10);

      if (visualizerImg) {
        doc.addImage(visualizerImg, 'PNG', 15, 75, 180, 80);
      }

      doc.setFontSize(10);
      doc.setTextColor(bsRed[0], bsRed[1], bsRed[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('TECHNICAL SPECIFICATIONS', 15, 168);

      const specs = [
        { l: "Nominal Size", v: `${selectedPart.pipe_size}"` },
        { l: "Overall Length (OAL)", v: `${selectedPart.overall_length_oal_in}"` },
        { l: "Bellows ID / OD", v: `${selectedPart.bellows_id_in}" / ${selectedPart.bellows_od_in}"` },
        { l: "Number of Plys", v: selectedPart.number_of_plys || "Single" },
        { l: "Design Pressure", v: selectedPart.pressure_psig },
        { l: "Design Temp", v: selectedPart.temperature_f },
        { l: "Material / Grade", v: `${selectedPart.bellows_material} ${selectedPart.bellows_material_grade}` },
        { l: "Cycles Required", v: `${selectedPart.number_of_cycles} (${selectedPart.cycles_format})` },
        { l: "Axial Movement / Rate", v: `${selectedPart.axial_movement_in}" @ ${selectedPart.axial_spring_rate_lbf_in} lb/in` },
        { l: "Lateral Movement / Rate", v: `${selectedPart.lateral_movement_in}" @ ${selectedPart.lateral_spring_rate_lbf_in} lb/in` },
        { l: "Angular Movement / Rate", v: `${selectedPart.angular_movement_deg}° @ ${selectedPart.angular_spring_rate_ft_lbs_deg} ft-lb/deg` },
      ];

      let tableY = 175;
      specs.forEach((spec, i) => {
        const rowY = tableY + (i * 7);
        if (i % 2 === 0) {
          doc.setFillColor(250);
          doc.rect(15, rowY - 5, 180, 7, 'F');
        }
        doc.setTextColor(100);
        doc.setFont('helvetica', 'bold').setFontSize(8);
        doc.text(spec.l.toUpperCase(), 18, rowY);
        doc.setTextColor(bsDark[0], bsDark[1], bsDark[2]);
        doc.setFont('helvetica', 'normal').text(String(spec.v), 100, rowY);
      });

      doc.setDrawColor(bsRed[0], bsRed[1], bsRed[2]).setLineWidth(0.3).line(15, 275, 195, 275);
      doc.setFontSize(7).setTextColor(150).text('Bellows Systems, Inc. | www.bellows-systems.com | Generated via Digital Configurator', 15, 280);
      
      doc.save(`BSI_Report_${selectedPart.part_number}.pdf`);
    } catch (e) {
      console.error("PDF generation failed:", e);
      alert("Failed to generate PDF. Check browser settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const labelStyle = "block text-sm font-semibold text-[#414042] mb-1.5";
  const subLabelStyle = "text-[10px] text-gray-400 block mb-1 uppercase tracking-tight font-bold";
  const inputStyle = "block w-full px-3 py-2.5 text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-bsRed focus:border-bsRed rounded border bg-white text-[#414042] transition-shadow";
  const hybridInputStyle = "block w-full px-4 py-3 text-sm border-gray-300 focus:outline-none focus:ring-1 focus:ring-bsRed focus:border-bsRed rounded-l border bg-white text-[#414042] font-medium";
  const selectAddonStyle = "bg-gray-50 border border-gray-300 border-l-0 px-2 py-2.5 text-xs font-semibold text-gray-500 rounded-r focus:outline-none focus:border-bsRed";

  if (showDashboard && isAdmin) {
    return <AdminDashboard onClose={() => setShowDashboard(false)} onDataChange={refreshData} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white font-poppins text-bsDark overflow-x-hidden">
      <Header isAdmin={isAdmin} onLoginClick={() => setShowLogin(true)} onLogout={handleLogout} onDashboardClick={() => setShowDashboard(true)} />
      
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl md:text-4xl font-black text-bsDark leading-tight">Bellows Configurator</h2>
            <p className="mt-3 text-base md:text-lg text-gray-500 max-w-3xl">Professional engineering tool for configuring metal bellows with real-time unit conversion.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="lg:col-span-5 space-y-8 min-w-0">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-bsRed text-white flex items-center justify-center font-bold mr-3 text-sm">1</div>
                  <h3 className="text-lg font-semibold text-bsDark">Primary Configuration</h3>
              </div>
              <div className="space-y-6">
                <div>
                    <label className={labelStyle}>Nominal Diameter</label>
                    <div className="flex">
                      <input list="dia-list" type="text" value={diameterInput} onChange={(e) => setDiameterInput(e.target.value)} className={hybridInputStyle} placeholder="Enter value..." />
                      <datalist id="dia-list">
                        {catalogDiameters.map((size) => <option key={size} value={getDisplayLength(size, diameterUnit)} />)}
                      </datalist>
                      <select value={diameterUnit} onChange={(e) => setDiameterUnit(e.target.value)} className={selectAddonStyle}><option value="IN">IN</option><option value="MM">MM</option><option value="FT">FT</option></select>
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Overall Length</label>
                    <div className="flex">
                      <input list="oal-list" type="text" value={oalInput} onChange={(e) => setOalInput(e.target.value)} className={hybridInputStyle} placeholder="Enter value..." />
                      <datalist id="oal-list">
                        {availableOALs.map((len) => <option key={len} value={getDisplayLength(len, oalUnit)} />)}
                      </datalist>
                      <select value={oalUnit} onChange={(e) => setOalUnit(e.target.value)} className={selectAddonStyle}><option value="IN">IN</option><option value="MM">MM</option><option value="FT">FT</option></select>
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Design Pressure</label>
                    <div className="flex">
                      <input list="press-list" type="text" value={pressure} onChange={(e) => setPressure(e.target.value)} className={hybridInputStyle} placeholder="Enter value..." />
                      <datalist id="press-list">
                        {catalogPressures.map(p => <option key={p} value={p} />)}
                      </datalist>
                      <select value={pressureUnit} onChange={(e) => setPressureUnit(e.target.value)} className={selectAddonStyle}><option value="PSIG">PSIG</option><option value="BAR">BAR</option></select>
                    </div>
                </div>
                <div>
                    <label className={labelStyle}>Design Temperature</label>
                    <div className="flex">
                      <input list="temp-list" type="text" value={temperature} onChange={(e) => setTemperature(e.target.value)} className={hybridInputStyle} placeholder="Enter value..." />
                      <datalist id="temp-list">
                        {catalogTemperatures.map(t => <option key={t} value={t} />)}
                      </datalist>
                      <select value={tempUnit} onChange={(e) => setTempUnit(e.target.value)} className={selectAddonStyle}><option value="°F">°F</option><option value="°C">°C</option></select>
                    </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-bsRed text-white flex items-center justify-center font-bold mr-3 text-sm">2</div>
                  <h3 className="text-lg font-semibold text-bsDark">Design Specification</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-bsDark mb-3 uppercase tracking-wide border-b border-gray-100 pb-1">End Configuration</h4>
                  <select value={cuffType} onChange={(e) => setCuffType(e.target.value)} className={inputStyle}>
                    {CUFF_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className={subLabelStyle}>Cycles</label><input type="text" value={cyclesValue} onChange={(e) => setCyclesValue(e.target.value)} className={inputStyle} placeholder="0" /></div>
                  <div><label className={subLabelStyle}>Format</label><select value={cycleType} onChange={(e) => setCycleType(e.target.value)} className={inputStyle}><option value="Non-concurrent">Non-concurrent</option><option value="Concurrent">Concurrent</option></select></div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-bsRed text-white flex items-center justify-center font-bold mr-3 text-sm">3</div>
                  <h3 className="text-lg font-semibold text-bsDark">Application</h3>
              </div>
              <select value={application} onChange={(e) => setApplication(e.target.value)} className={inputStyle}>
                <option value="">-- Select --</option>
                {APPLICATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center mb-6">
                  <div className="w-8 h-8 rounded-full bg-bsRed text-white flex items-center justify-center font-bold mr-3 text-sm">4</div>
                  <h3 className="text-lg font-semibold text-bsDark">Contact Info</h3>
              </div>
              <div className="space-y-4">
                <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className={inputStyle} placeholder="Full Name *" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} placeholder="Email *" />
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={inputStyle} placeholder="Company *" />
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputStyle} placeholder="Phone *" />
                <div className="grid grid-cols-3 gap-2">
                   <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className={inputStyle} placeholder="Country *" />
                   <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputStyle} placeholder="City *" />
                   <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputStyle} placeholder="Zip *" />
                </div>
              </div>
            </div>

            <button disabled={isSubmitting} className={`w-full py-4 px-6 rounded shadow-sm text-base font-bold text-white flex items-center justify-center gap-3 transition-all ${!isSubmitting ? 'bg-bsRed hover:bg-[#a0082c]' : 'bg-gray-300'}`} onClick={handleDownloadPDF}>
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    PROCESSING...
                  </>
                ) : 'DOWNLOAD PDF REPORT'}
            </button>
          </div>

          <div className="lg:col-span-7 space-y-8 flex flex-col h-full min-w-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-bsDark uppercase tracking-wide">Catalog Recommendations</label>
                    <span className="text-[11px] font-black text-bsRed bg-red-50 px-3 py-1 rounded-full">{availablePartNumbers.length} Found</span>
                </div>
                <select value={selectedPartNumber} onChange={(e) => handlePartNumberChange(e.target.value)} className={`${inputStyle} h-14 font-black text-lg border-2 border-gray-100 shadow-inner`}>
                    <option value="">-- Select Part Number --</option>
                    {availablePartNumbers.map((part) => <option key={part.part_number} value={part.part_number}>{part.part_number}</option>)}
                </select>
                <div className="mt-4 flex items-center justify-between gap-4">
                   <button onClick={handlePrevPart} className="flex-1 py-3 border border-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-50">PREV</button>
                   <button onClick={handleNextPart} className="flex-1 py-3 border border-bsRed/10 rounded-xl text-xs font-bold text-bsRed hover:bg-red-50">NEXT</button>
                </div>
            </div>

            <SpecsTable part={selectedPart} cuffType={cuffType} application={application === 'Other' ? customApplication : application} />
            <div className="visualizer-container mt-auto">
              <Visualizer part={selectedPart} cuffType={cuffType} />
            </div>
          </div>
        </div>
      </main>

      {showLogin && <LoginModal onLogin={(success) => success && (setIsAdmin(true), setShowLogin(false))} onClose={() => setShowLogin(false)} />}
    </div>
  );
}

export default App;