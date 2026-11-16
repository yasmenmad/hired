import React from 'react';
export default function Modal({ title, subtitle, children, footer, onClose }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <div style={{fontFamily:'var(--serif)',fontSize:21,fontWeight:800,letterSpacing:-.3,color:'var(--ink)'}}>{title}</div>
            {subtitle&&<div style={{fontSize:12.5,color:'var(--muted)',marginTop:3}}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{width:30,height:30,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:8,border:'1px solid var(--faint)',background:'none',cursor:'pointer',color:'var(--muted)',flexShrink:0,marginLeft:12,transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.background='var(--faint)';e.currentTarget.style.color='var(--ink)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--muted)';}}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{fontSize:13.5,color:'var(--ink)',lineHeight:1.6}}>{children}</div>
        {footer&&<div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:22,paddingTop:18,borderTop:'1px solid var(--faint)'}}>{footer}</div>}
      </div>
    </div>
  );
}
