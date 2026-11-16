import React, { useState, useEffect } from 'react';
import './index.css';
import LandingPage from './presentation/pages/LandingPage';
import SignInPage  from './presentation/pages/SignInPage';
import AppShell   from './presentation/pages/AppShell';
import Toast      from './presentation/components/common/Toast';
import useToast   from './presentation/hooks/useToast';
import { auth }   from './infrastructure/api/apiClient';

export default function App() {
  const [page,  setPage]  = useState('landing');
  const [user,  setUser]  = useState(null);
  const { msg, visible, toast } = useToast();

  // Restore session on load
  useEffect(() => {
    const stored = auth.getUser();
    const token  = auth.getToken();
    if (stored && token) {
      setUser(stored);
      setPage('app');
    }
  }, []);

  function handleSignIn(userData) {
    setUser(userData);
    setPage('app');
  }

  function handleExit() {
    auth.logout();
    setUser(null);
    setPage('landing');
  }

  return (
    <>
      {page==='landing' && <LandingPage onSignIn={()=>setPage('signin')}/>}
      {page==='signin'  && <SignInPage  onSignIn={handleSignIn} onBack={()=>setPage('landing')}/>}
      {page==='app'     && <AppShell onExit={handleExit} toast={toast} user={user} setUser={setUser}/>}
      <Toast msg={msg} visible={visible}/>
    </>
  );
}
