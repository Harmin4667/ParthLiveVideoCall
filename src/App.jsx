import React, { useEffect, useState } from 'react';
import { Link, Route, Routes, useParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useTracks, VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function Admin() {
  const [pin,setPin] = useState('');
  const [title,setTitle] = useState('Parth Live Room');
  const [password,setPassword] = useState('');
  const [room,setRoom] = useState(null);
  const [error,setError] = useState('');
  async function createRoom(e) {
    e.preventDefault(); setError(''); setRoom(null);
    try {
      const r = await fetch(`${API}/api/rooms`, {method:'POST',headers:{'Content-Type':'application/json','x-admin-pin':pin},body:JSON.stringify({title,password})});
      const data = await r.json(); if(!r.ok) throw new Error(data.error || 'Room બનાવી શકાયો નથી');
      setRoom(data);
    } catch(err) { setError(err.message); }
  }
  const origin = window.location.origin;
  return <main className="shell">
    <header><div className="brandMark">P</div><div><h1>Parth Live Video Call</h1><p>Admin Control Panel</p></div></header>
    <section className="panel">
      <h2>નવો Live Room બનાવો</h2>
      <form onSubmit={createRoom} className="form">
        <label>Admin PIN<input type="password" value={pin} onChange={e=>setPin(e.target.value)} required placeholder="તમારો Admin PIN"/></label>
        <label>Room Name<input value={title} onChange={e=>setTitle(e.target.value)} required/></label>
        <label>Room Password<input type="password" minLength="4" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="ઓછામાં ઓછા 4 અક્ષર"/></label>
        <button>Create Room</button>
      </form>
      {error && <p className="error">{error}</p>}
      {room && <div className="result">
        <h3>Room તૈયાર છે ✓</h3><p><b>Room ID:</b> {room.roomId}</p>
        <p><b>Guest URL:</b><br/><a href={room.guestUrl}>{room.guestUrl}</a></p>
        <button onClick={()=>navigator.clipboard.writeText(room.guestUrl)}>Guest URL Copy</button>
        <p className="hint">Guest ને URL સાથે તમે બનાવેલો Room Password અલગથી મોકલો.</p>
        <h3>OBS / vMix Output</h3>
        <p>Guest જોડાયા પછી દરેક Guest માટે અલગ Output URL બનાવો:</p>
        <code>{origin}/output/{room.roomId}</code>
        <button className="secondary" onClick={()=>navigator.clipboard.writeText(`${origin}/output/${room.roomId}`)}>Output URL Copy</button>
      </div>}
    </section>
    <p className="foot">Local MVP • WebRTC via LiveKit • Maximum 4 guest workflow</p>
  </main>;
}

function Join() {
  const { roomId } = useParams();
  const [name,setName] = useState('Guest');
  const [password,setPassword] = useState('');
  const [session,setSession] = useState(null);
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  async function join(e) {
    e.preventDefault(); setBusy(true); setError('');
    try {
      const r = await fetch(`${API}/api/token`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId,password,name})});
      const data = await r.json(); if(!r.ok) throw new Error(data.error || 'Join નિષ્ફળ');
      setSession(data);
    } catch(err) { setError(err.message); } finally { setBusy(false); }
  }
  if(session) return <div className="callPage"><div className="callTop"><b>Parth Live • {name}</b><span>Connected room: {roomId}</span></div>
    <LiveKitRoom token={session.token} serverUrl={session.serverUrl} connect={true} video={true} audio={true} onDisconnected={()=>setSession(null)} data-lk-theme="default">
      <VideoConference />
    </LiveKitRoom>
  </div>;
  return <main className="shell narrow"><header><div className="brandMark">P</div><div><h1>Join Parth Live</h1><p>Room: {roomId}</p></div></header>
    <section className="panel"><h2>Video Call માં જોડાઓ</h2><form className="form" onSubmit={join}>
      <label>તમારું નામ<input value={name} onChange={e=>setName(e.target.value)} required/></label>
      <label>Room Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      <button disabled={busy}>{busy?'Connecting...':'Join Video Call'}</button>
    </form>{error && <p className="error">{error}</p>}<p className="hint">Camera અને Microphone permission Allow કરો.</p></section>
  </main>;
}

function OutputVideo() {
  const { roomId } = useParams();
  const [identity,setIdentity] = useState(new URLSearchParams(location.search).get('identity') || '');
  const [session,setSession] = useState(null);
  const [error,setError] = useState('');
  const [password,setPassword] = useState('');
  const [name,setName] = useState('OBS Guest');
  async function connect(e) {
    e.preventDefault(); setError('');
    try {
      const r=await fetch(`${API}/api/token`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomId,password,name,identity:identity || 'obs-output'})});
      const d=await r.json(); if(!r.ok) throw new Error(d.error || 'Connect failed'); setSession(d);
    } catch(err){setError(err.message);}
  }
  if(!session) return <main className="shell narrow"><section className="panel"><h2>OBS / vMix Output Connect</h2><p>Room: {roomId}</p><form className="form" onSubmit={connect}>
    <label>Room Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
    <label>Output identity (optional)<input value={identity} onChange={e=>setIdentity(e.target.value)} placeholder="guest-output"/></label>
    <button>Connect Output</button></form>{error&&<p className="error">{error}</p>}</section></main>;
  return <LiveKitRoom token={session.token} serverUrl={session.serverUrl} connect={true} video={false} audio={false} data-lk-theme="default">
    <div className="output"><OutputTrack /></div>
  </LiveKitRoom>;
}
function OutputTrack() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true });
  return <div className="outputGrid">{tracks.filter(t=>t.publication && t.participant.identity !== 'obs-output').map(t=><div className="outputTile" key={`${t.participant.identity}-${t.publication.trackSid}`}><VideoTrack trackRef={t}/><span>{t.participant.name || t.participant.identity}</span></div>)}</div>;
}
function NotFound(){return <main className="shell"><h2>Page not found</h2><Link to="/">Home</Link></main>}

export default function App(){
 return <Routes><Route path="/" element={<Admin/>}/><Route path="/join/:roomId" element={<Join/>}/><Route path="/output/:roomId" element={<OutputVideo/>}/><Route path="*" element={<NotFound/>}/></Routes>;
}
