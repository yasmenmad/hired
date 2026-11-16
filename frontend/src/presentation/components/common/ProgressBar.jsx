import React from 'react';
export default function ProgressBar({ value=0, color }) {
  return (
    <div style={{width:'100%',height:6,background:'var(--faint2)',borderRadius:50,overflow:'hidden'}}>
      <div style={{height:'100%',width:`${Math.min(value,100)}%`,borderRadius:50,transition:'width .6s cubic-bezier(.4,0,.2,1)',background:color||'linear-gradient(90deg,var(--p400),var(--p600))'}}/>
    </div>
  );
}
