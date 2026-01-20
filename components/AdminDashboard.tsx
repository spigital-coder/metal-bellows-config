import React, { useState, useEffect, useRef } from 'react';
import { BellowsPart, QuoteSubmission } from '../types';
import { BELLOWS_DATA } from '../data';
import { db, supabase } from '../api/database';

interface AdminDashboardProps {
  onDataChange: () => void;
  onClose: () => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onDataChange, onClose, onLogout }) => {
  const [data, setData] = useState<BellowsPart[]>([]);
  const [submissions, setSubmissions] = useState<QuoteSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPart, setEditingPart] = useState<BellowsPart | null>(null);
  const [editingSubmission, setEditingSubmission] = useState<QuoteSubmission | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<QuoteSubmission | null>(null);
  const [activeTab, setActiveTab] = useState<'inventory' | 'crm' | 'status'>('inventory');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [crmError, setCrmError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadSubmissions();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const catalog = await db.getAll();
    setData(catalog);
    setLoading(false);
  };

  const loadSubmissions = async () => {
    const { data, error } = await db.submissions.getAll();
    if (error) setCrmError(error.message);
    else { setCrmError(null); setSubmissions(data); }
  };

  const handleUpdateSubmission = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSubmission?.id) return;
    const formData = new FormData(e.currentTarget);
    const updated: Partial<QuoteSubmission> = {
      contact_name: formData.get('contact_name') as string,
      company_name: formData.get('company_name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      street_address: formData.get('street_address') as string,
      city: formData.get('city') as string,
      postal_code: formData.get('postal_code') as string,
      country: formData.get('country') as string,
    };

    const res = await db.submissions.update(editingSubmission.id, updated);
    if (res.success) {
      setSuccessMsg("Lead updated successfully.");
      setEditingSubmission(null);
      await loadSubmissions();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else alert(res.error);
  };

  const downloadLeadPDF = async (sub: QuoteSubmission) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const config = sub.configuration_data;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Bellows Systems', 15, 18);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text('ADMIN CRM REPORT', 195, 18, { align: 'right' });
    doc.line(15, 25, 195, 25);

    let y = 40;
    doc.setTextColor(0, 0, 0);
    doc.text(`Lead ID: ${sub.id}`, 20, y);
    y += 10;
    doc.text(`Customer: ${sub.contact_name}`, 20, y);
    doc.text(`Company: ${sub.company_name}`, 105, y);
    y += 8;
    doc.text(`Email: ${sub.email}`, 20, y);
    doc.text(`Phone: ${sub.phone}`, 105, y);
    y += 8;
    doc.text(`Address: ${sub.street_address}, ${sub.city}, ${sub.postal_code}, ${sub.country}`, 20, y);

    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICAL CONFIGURATION', 20, y);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Part: ${sub.part_number}`, 20, y);
    doc.text(`Size: ${config.diameter} x ${config.length}`, 20, y + 8);
    doc.text(`App: ${config.application}`, 20, y + 16);
    doc.text(`Pressure: ${config.pressure}`, 105, y);
    doc.text(`Temp: ${config.temp}`, 105, y + 8);

    doc.save(`CRM_Lead_${sub.id?.slice(0, 8)}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col animate-in slide-in-from-right duration-300">
      <header className="bg-white border-b border-gray-100 px-8 py-6 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-10">
          <h2 className="text-2xl font-black text-bsDark tracking-tight">Admin Console</h2>
          <nav className="flex gap-1 bg-gray-100 p-1 rounded-xl">
             <button onClick={() => setActiveTab('inventory')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'inventory' ? 'bg-white shadow-sm text-bsRed' : 'text-gray-500'}`}>Inventory</button>
             <button onClick={() => setActiveTab('crm')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'crm' ? 'bg-white shadow-sm text-bsRed' : 'text-gray-500'}`}>Leads CRM</button>
             <button onClick={() => setActiveTab('status')} className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'status' ? 'bg-white shadow-sm text-bsRed' : 'text-gray-500'}`}>Infrastructure Fix</button>
          </nav>
        </div>
        <div className="flex gap-4"><button onClick={onClose} className="px-6 py-3 border-2 border-gray-100 text-gray-600 rounded-xl text-sm font-bold">Exit</button><button onClick={onLogout} className="px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold">Logout</button></div>
      </header>
      
      <main className="flex-grow overflow-hidden flex flex-col bg-gray-50/30 relative p-8">
        {successMsg && <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] bg-green-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] animate-in slide-in-from-top-4">{successMsg}</div>}

        {activeTab === 'crm' ? (
          <div className="flex-grow flex flex-col overflow-hidden">
             <div className="mb-6 flex justify-between items-center"><h3 className="text-xl font-black text-bsDark">Lead Capture Database</h3><span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{submissions.length} Total Leads</span></div>
             <div className="flex-grow bg-white border border-gray-100 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                <div className="overflow-auto custom-scrollbar">
                   <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-white border-b border-gray-100 font-black text-[10px] text-gray-400 uppercase tracking-widest">
                        <tr><th className="px-8 py-6">Date</th><th className="px-8 py-6">Customer</th><th className="px-8 py-6">Part</th><th className="px-8 py-6 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm">
                        {submissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-gray-50 group">
                            <td className="px-8 py-6 text-gray-400 font-bold">{new Date(sub.created_at || '').toLocaleDateString()}</td>
                            <td className="px-8 py-6"><div className="font-black text-bsDark">{sub.contact_name}</div><div className="text-[10px] text-gray-400">{sub.company_name} | {sub.email}</div></td>
                            <td className="px-8 py-6 font-black text-bsRed">{sub.part_number}</td>
                            <td className="px-8 py-6 text-right space-x-2">
                               <button onClick={() => downloadLeadPDF(sub)} className="p-2 text-gray-400 hover:text-bsDark" title="Download PDF"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg></button>
                               <button onClick={() => setEditingSubmission(sub)} className="text-[10px] font-black uppercase tracking-widest text-bsDark border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">Edit</button>
                               <button onClick={() => setSelectedSubmission(sub)} className="text-[10px] font-black uppercase tracking-widest text-bsRed border border-bsRed/20 px-4 py-2 rounded-lg hover:bg-bsRed hover:text-white transition-all">Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        ) : activeTab === 'status' ? (
           <div className="p-8 max-w-4xl mx-auto space-y-10">
              <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-xl">
                 <h3 className="text-2xl font-black text-bsDark mb-8">SQL Infrastructure Sync</h3>
                 <pre className="bg-[#414042] text-green-400 p-6 rounded-xl text-[10px] font-mono h-[350px] overflow-auto">
{`/* RUN THIS IN SUPABASE SQL EDITOR */
CREATE TABLE IF NOT EXISTS quote_submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT now(),
  contact_name text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text,
  street_address text,
  city text,
  postal_code text,
  country text,
  part_number text,
  image_url text,
  configuration_data jsonb NOT NULL
);

ALTER TABLE quote_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Insert" ON quote_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admin Full Access" ON quote_submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);`}
                 </pre>
              </div>
           </div>
        ) : (
          <div className="flex-grow flex items-center justify-center text-gray-300 font-black uppercase text-xs tracking-[0.5em]">Inventory Manager Active</div>
        )}
      </main>

      {editingSubmission && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4">
           <form onSubmit={handleUpdateSubmission} className="bg-white rounded-2xl w-full max-w-xl p-10 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-bsDark mb-8">Edit Lead Info</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Name</label><input name="contact_name" defaultValue={editingSubmission.contact_name} className="w-full border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Company</label><input name="company_name" defaultValue={editingSubmission.company_name} className="w-full border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Email</label><input name="email" defaultValue={editingSubmission.email} className="w-full border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Phone</label><input name="phone" defaultValue={editingSubmission.phone} className="w-full border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400">Street</label><input name="street_address" defaultValue={editingSubmission.street_address} className="w-full border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" /></div>
              <div className="grid grid-cols-3 gap-2">
                 <input name="city" placeholder="City" defaultValue={editingSubmission.city} className="border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" />
                 <input name="postal_code" placeholder="Zip" defaultValue={editingSubmission.postal_code} className="border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" />
                 <input name="country" placeholder="Country" defaultValue={editingSubmission.country} className="border-2 border-gray-100 px-4 py-3 rounded-xl outline-none focus:border-bsRed" />
              </div>
              <div className="flex gap-4 pt-6">
                 <button type="submit" className="flex-grow bg-bsDark text-white py-4 rounded-xl font-black uppercase text-[10px]">Update Lead</button>
                 <button type="button" onClick={() => setEditingSubmission(null)} className="px-10 text-gray-400 font-bold">Cancel</button>
              </div>
           </form>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/70 backdrop-blur-md p-4">
           <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl relative">
              <button onClick={() => setSelectedSubmission(null)} className="absolute top-6 right-6 text-gray-400 hover:text-bsRed"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
              <h3 className="text-2xl font-black text-bsDark mb-8">Technical Snapshot</h3>
              <div className="grid grid-cols-2 gap-8 mb-8">
                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-bsRed uppercase tracking-widest">Client</h4>
                    <p className="text-sm"><b>Name:</b> {selectedSubmission.contact_name}</p>
                    <p className="text-sm"><b>Location:</b> {selectedSubmission.city}, {selectedSubmission.country}</p>
                 </div>
                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-bsRed uppercase tracking-widest">Bellows</h4>
                    <p className="text-sm"><b>Part:</b> {selectedSubmission.part_number}</p>
                    <p className="text-sm"><b>Dimensions:</b> {selectedSubmission.configuration_data.diameter} x {selectedSubmission.configuration_data.length}</p>
                 </div>
              </div>
              <button onClick={() => downloadLeadPDF(selectedSubmission)} className="w-full bg-bsRed text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px]">Download Lead Report</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;