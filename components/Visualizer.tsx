import React from 'react';
import { BellowsPart, CuffEndType } from '../types';

interface VisualizerProps {
  part: BellowsPart | null;
  cuffType: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ part, cuffType }) => {
  const viewWidth = 800;
  const viewHeight = 600;
  
  const centerX = viewWidth / 2;
  const centerY = viewHeight / 2;

  // Geometry Setup for Render SVG
  const numConvolutions = 7;
  const bellowsWidth = 420;
  const innerRadius = 100; 
  const convHeight = 50;
  const outerRadius = innerRadius + convHeight;
  
  const convWidth = bellowsWidth / numConvolutions;
  const startX = centerX - (bellowsWidth / 2);
  const endX = centerX + (bellowsWidth / 2);
  const cuffLength = 80;

  const isUCuff = cuffType.includes("U CUFF") || cuffType === CuffEndType.U_CUFF;

  const renderBellowsBody = () => {
    if (!part) return null;

    const segments = [];
    for (let i = 0; i < numConvolutions; i++) {
      const xStart = startX + i * convWidth;
      const xMid = xStart + convWidth / 2;
      const xEnd = xStart + convWidth;

      segments.push(
        <g key={`segment-${i}`}>
          {/* Internal Body Shading */}
          <rect 
            x={xStart} 
            y={centerY - innerRadius} 
            width={convWidth} 
            height={innerRadius * 2} 
            fill="url(#bodyShading)" 
          />
          {/* Top Convolution */}
          <path
            d={`M ${xStart} ${centerY - innerRadius} 
               C ${xStart} ${centerY - outerRadius - 12}, ${xEnd} ${centerY - outerRadius - 12}, ${xEnd} ${centerY - innerRadius}`}
            fill="url(#metalGradientTop)"
            stroke="#1a1a1a"
            strokeWidth="1.2"
          />
          {/* Highlight on top */}
          <path
            d={`M ${xStart + 6} ${centerY - outerRadius + 4} Q ${xMid} ${centerY - outerRadius - 3}, ${xEnd - 6} ${centerY - outerRadius + 4}`}
            fill="none"
            stroke="white"
            strokeWidth="3"
            opacity="0.4"
            strokeLinecap="round"
          />
          {/* Bottom Convolution */}
          <path
            d={`M ${xStart} ${centerY + innerRadius} 
               C ${xStart} ${centerY + outerRadius + 12}, ${xEnd} ${centerY + outerRadius + 12}, ${xEnd} ${centerY + innerRadius}`}
            fill="url(#metalGradientBottom)"
            stroke="#1a1a1a"
            strokeWidth="1.2"
          />
        </g>
      );
    }

    return (
      <g>
        {segments}
        {renderCuffs()}
        {renderEngineeringAnnotations()}
      </g>
    );
  };

  const renderCuffs = () => {
    const isNone = cuffType.includes("WITHOUT") || cuffType.includes("TRUNCATED");
    if (isNone) return null;

    const cuffY = isUCuff ? centerY - outerRadius : centerY - innerRadius;
    const cuffH = isUCuff ? outerRadius * 2 : innerRadius * 2;

    return (
      <g>
        <rect 
          x={startX - cuffLength} 
          y={cuffY} 
          width={cuffLength} 
          height={cuffH} 
          fill="url(#bodyShading)" 
          stroke="#1a1a1a" 
          strokeWidth="1.5"
        />
        <rect 
          x={endX} 
          y={cuffY} 
          width={cuffLength} 
          height={cuffH} 
          fill="url(#bodyShading)" 
          stroke="#1a1a1a" 
          strokeWidth="1.5"
        />
      </g>
    );
  };

  const renderEngineeringAnnotations = () => {
    if (!part) return null;
    const labelColor = "#414042";
    const dimLineColor = "#9ca3af";
    const accentColor = "#C80A37";

    return (
      <g className="annotations text-[10px] font-bold uppercase tracking-tighter" style={{ pointerEvents: 'none' }}>
        
        {/* Mean Diameter Annotation */}
        <line x1={startX - 120} y1={centerY - innerRadius} x2={startX - 120} y2={centerY + innerRadius} stroke={accentColor} strokeWidth="1" strokeDasharray="4,2" />
        <path d={`M ${startX - 120} ${centerY - innerRadius} l -3 8 m 3 -8 l 3 8`} fill="none" stroke={accentColor} strokeWidth="1" />
        <path d={`M ${startX - 120} ${centerY + innerRadius} l -3 -8 m 3 8 l 3 -8`} fill="none" stroke={accentColor} strokeWidth="1" />
        <text x={startX - 125} y={centerY} fill={accentColor} textAnchor="end" dominantBaseline="middle" transform={`rotate(-90, ${startX - 125}, ${centerY})`}>
          MEAN DIA: {((part.bellows_id_in + part.bellows_od_in)/2).toFixed(3)}"
        </text>

        {/* Bellows OD Label */}
        <line x1={centerX - 50} y1={centerY - outerRadius} x2={centerX + 50} y2={centerY - outerRadius} stroke={dimLineColor} strokeWidth="0.5" strokeDasharray="2,2" />
        <text x={centerX} y={centerY - outerRadius - 10} fill={labelColor} textAnchor="middle">OD: {part.bellows_od_in}"</text>

        {/* Bellows ID Label */}
        <line x1={centerX - 30} y1={centerY - innerRadius} x2={centerX + 30} y2={centerY - innerRadius} stroke={dimLineColor} strokeWidth="0.5" strokeDasharray="2,2" />
        <text x={centerX} y={centerY - innerRadius + 15} fill={labelColor} textAnchor="middle">ID: {part.bellows_id_in}"</text>

        {/* Overall Length OAL */}
        <line x1={startX - cuffLength} y1={centerY + outerRadius + 40} x2={endX + cuffLength} y2={centerY + outerRadius + 40} stroke={labelColor} strokeWidth="1" />
        <circle cx={startX - cuffLength} cy={centerY + outerRadius + 40} r="2" fill={labelColor} />
        <circle cx={endX + cuffLength} cy={centerY + outerRadius + 40} r="2" fill={labelColor} />
        <text x={centerX} y={centerY + outerRadius + 55} fill={labelColor} textAnchor="middle">OAL: {part.overall_length_oal_in}"</text>

        {/* Tangent (Cuff) Label */}
        <line x1={startX - cuffLength} y1={centerY + outerRadius + 20} x2={startX} y2={centerY + outerRadius + 20} stroke={dimLineColor} strokeWidth="1" />
        <text x={startX - cuffLength/2} y={centerY + outerRadius + 32} fill={labelColor} textAnchor="middle" fontSize="8">TANGENT</text>

        {/* Crest & Root Callouts */}
        <path d={`M ${startX + convWidth/2} ${centerY - outerRadius - 5} l 10 -25 l 15 0`} fill="none" stroke={dimLineColor} strokeWidth="0.5" />
        <text x={startX + convWidth/2 + 28} y={centerY - outerRadius - 30} fill={labelColor} textAnchor="start">CREST</text>

        <path d={`M ${startX + convWidth} ${centerY - innerRadius} l 5 -15 l 15 0`} fill="none" stroke={dimLineColor} strokeWidth="0.5" />
        <text x={startX + convWidth + 22} y={centerY - innerRadius - 15} fill={labelColor} textAnchor="start">ROOT</text>

        {/* Pitch Label */}
        <line x1={startX + convWidth} y1={centerY - outerRadius - 40} x2={startX + convWidth*2} y2={centerY - outerRadius - 40} stroke={dimLineColor} strokeWidth="1" />
        <text x={startX + convWidth * 1.5} y={centerY - outerRadius - 45} fill={labelColor} textAnchor="middle" fontSize="8">PITCH</text>

        {/* Convolution Callout */}
        <path d={`M ${startX + convWidth/2} ${centerY - outerRadius/2} l -60 -40`} fill="none" stroke={dimLineColor} strokeWidth="0.5" />
        <text x={startX - 65} y={centerY - outerRadius/2 - 40} fill={labelColor} textAnchor="end">CONVOLUTION DEPTH: {( (part.bellows_od_in - part.bellows_id_in)/2 ).toFixed(3)}"</text>
      </g>
    );
  };

  return (
    <div className="visualizer-container w-full h-[600px] bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center p-8 relative overflow-hidden shadow-sm transition-all duration-500">
      {!part ? (
         <div className="text-center opacity-30 scale-90">
            <div className="w-24 h-24 mx-auto bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            </div>
            <p className="text-gray-600 font-black tracking-[0.2em] text-[10px] uppercase">Initialize Step 1 to load Viewport</p>
         </div>
      ) : (
        <div className="w-full h-full flex flex-col">
          <svg 
              width="100%" 
              height="100%" 
              viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
              preserveAspectRatio="xMidYMid meet"
              className="animate-in fade-in duration-500"
          >
              <defs>
                  <linearGradient id="metalGradientTop" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#414a4c" />
                      <stop offset="20%" stopColor="#d1d5db" />
                      <stop offset="50%" stopColor="#f3f4f6" />
                      <stop offset="80%" stopColor="#9ca3af" />
                      <stop offset="100%" stopColor="#111827" />
                  </linearGradient>
                  <linearGradient id="metalGradientBottom" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#111827" />
                      <stop offset="20%" stopColor="#d1d5db" />
                      <stop offset="50%" stopColor="#f3f4f6" />
                      <stop offset="80%" stopColor="#9ca3af" />
                      <stop offset="100%" stopColor="#414a4c" />
                  </linearGradient>
                  <linearGradient id="bodyShading" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#1a202c" />
                      <stop offset="10%" stopColor="#e2e8f0" />
                      <stop offset="35%" stopColor="#94a3b8" />
                      <stop offset="50%" stopColor="#f1f5f9" />
                      <stop offset="65%" stopColor="#94a3b8" />
                      <stop offset="90%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#1a202c" />
                  </linearGradient>
              </defs>
              {renderBellowsBody()}
          </svg>
          <div className="absolute top-6 right-6 text-right">
              <div className="text-xs font-black text-bsDark opacity-40 uppercase tracking-widest">Technical Schematic - BSI Rev.A</div>
              <div className="text-[10px] font-bold text-gray-400">PART NO: {part.part_number}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visualizer;
