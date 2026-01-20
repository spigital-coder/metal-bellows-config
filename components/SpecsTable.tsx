import React from 'react';
import { BellowsPart } from '../types';

interface SpecsTableProps {
  part: BellowsPart | null;
  cuffType?: string;
  application?: string;
}

const SpecsTable: React.FC<SpecsTableProps> = ({ part, cuffType, application }) => {
  const getRows = () => {
    if (!part) return [];
    return [
      { label: "Part Number", value: part.part_number },
      { label: "Nominal Size (Pipe)", value: `${part.pipe_size}"` },
      { label: "Bellows ID", value: `${part.bellows_id_in}"` },
      { label: "Bellows OD", value: `${part.bellows_od_in}"` },
      { label: "Overall Length (OAL)", value: `${part.overall_length_oal_in}"` },
      { label: "Number of Plys", value: part.number_of_plys || "Single Ply" },
      { label: "Live Length", value: `${part.live_length_ll_in}"` },
      { label: "Bellows Material", value: `${part.bellows_material} ${part.bellows_material_grade}` },
      { label: "Weld Neck Detail", value: `${part.weld_neck_material} ${part.weld_neck_grade}` },
      { label: "Design Pressure", value: part.pressure_psig },
      { label: "Design Temperature", value: part.temperature_f },
      { label: "Required Cycles", value: `${part.number_of_cycles} (${part.cycles_format})` },
      { label: "End Configuration", value: cuffType || "Standard I Cuff" },
      { label: "Selected Application", value: application || "Industrial/General" },
      { label: "Axial Movement", value: `${part.axial_movement_in}"` },
      { label: "Axial Spring Rate", value: `${part.axial_spring_rate_lbf_in} lbf/in` },
      { label: "Lateral Movement", value: `${part.lateral_movement_in}"` },
      { label: "Lateral Spring Rate", value: `${part.lateral_spring_rate_lbf_in} lbf/in` },
      { label: "Angular Movement", value: `${part.angular_movement_deg}°` },
      { label: "Angular Spring Rate", value: `${part.angular_spring_rate_ft_lbs_deg} ft-lbs/deg` },
      { label: "Max Allowable Pressure", value: `${part.max_allowable_pressure_psig} psig` },
    ];
  };

  const rows = getRows();

  return (
    <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-200">
      <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-sm font-black text-bsDark uppercase tracking-wider">Technical Specification Data</h3>
        {!part && <span className="text-[10px] font-bold text-bsRed bg-red-50 px-2 py-1 rounded">No Part Selected</span>}
      </div>
      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-100">
          <tbody className="bg-white divide-y divide-gray-50 text-sm">
            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-3 font-bold text-gray-500 text-[11px] uppercase tracking-tight w-1/2 border-r border-gray-50">{row.label}</td>
                  <td className="px-6 py-3 text-bsDark font-black">{row.value}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center opacity-40">
                    <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Initialize Configuration to Generate Specs</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SpecsTable;