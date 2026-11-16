import React from 'react';
export default function Toast({ msg, visible }) {
  return (
    <div id="toast" style={{
      position:'fixed',bottom:24,right:24,zIndex:9999,
      background:'var(--p800)',color:'#fff',
      padding:'11px 20px',borderRadius:50,
      fontSize:13,fontWeight:600,letterSpacing:.1,
      transform:visible?'translateY(0)':'translateY(10px)',
      opacity:visible?1:0,
      transition:'all .22s cubic-bezier(.34,1.56,.64,1)',
      pointerEvents:visible?'auto':'none',
      fontFamily:'var(--sans)',
    }}>{msg}</div>
  );
}
