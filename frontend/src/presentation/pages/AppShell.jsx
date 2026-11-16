import React, { useState, useEffect } from 'react';
import AppNav        from '../components/layout/AppNav';
import JobsPage      from './JobsPage';
import CVPage        from './CVPage';
import KanbanPage    from './KanbanPage';
import MapPage       from './MapPage';
import InterviewPage from './InterviewPage';
import ChatPage      from './ChatPage';
import TestPage      from './TestPage';
import SalaryPage    from './SalaryPage';
import ProfilePage   from './ProfilePage';
import AdminPage     from './AdminPage';

export default function AppShell({ onExit, toast, user, setUser }) {
  const isAdmin = user?.is_admin || false;
  const [tab,  setTab]  = useState(isAdmin ? 'admin' : 'jobs');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    return () => document.body.classList.remove('dark');
  }, [dark]);

  const page = () => {
    if (isAdmin) return <AdminPage toast={toast} onExit={onExit}/>;
    switch(tab) {
      case 'jobs':      return <JobsPage      toast={toast} user={user}/>;
      case 'cv':        return <CVPage        toast={toast} user={user}/>;
      case 'tracker':   return <KanbanPage    toast={toast} user={user}/>;
      case 'map':       return <MapPage       toast={toast}/>;
      case 'interview': return <InterviewPage toast={toast} user={user}/>;
      case 'chat':      return <ChatPage      toast={toast} user={user}/>;
      case 'test':      return <TestPage      toast={toast}/>;
      case 'salary':    return <SalaryPage    toast={toast} user={user}/>;
      case 'profile':   return <ProfilePage   toast={toast} user={user} setUser={setUser}/>;
      default:          return <JobsPage      toast={toast} user={user}/>;
    }
  };

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',overflow:'hidden',position:'fixed',inset:0,background:'var(--bg)'}}>
      <AppNav
        activeTab={isAdmin?'admin':tab}
        onTabChange={isAdmin?()=>{}:setTab}
        onExit={onExit}
        isAdmin={isAdmin}
        userName={user?.name||'User'}
        dark={dark}
        onToggleDark={()=>setDark(d=>!d)}
      />
      <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column'}}>
        {page()}
      </div>
    </div>
  );
}
