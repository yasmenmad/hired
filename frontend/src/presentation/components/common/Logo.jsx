import React from 'react';
const COLORS=['#FF6B35','#10A37F','#5E6AD2','#1a1a1a','#F24E1E','#635BFF','#7C3AED','#059669','#D97706'];
export default function Logo({ name, size=44, radius=12, style={} }) {
  const bg   = COLORS[name.charCodeAt(0) % COLORS.length];
  const text = name.slice(0,2).toUpperCase();
  return (
    <div style={{width:size,height:size,borderRadius:radius,background:bg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-display)',fontSize:Math.round(size*.3),fontWeight:800,color:'#fff',flexShrink:0,...style}}>
      {text}
    </div>
  );
}
