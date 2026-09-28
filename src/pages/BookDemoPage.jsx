import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Check, Clock3, MapPin, Video } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Button, Input, Select, Textarea } from '../components/UI.jsx'
import { api, mapTutor } from '../services/api.js'

const minimumDate = new Date().toISOString().slice(0, 10)
const timeSlots = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '4:00 PM', '5:30 PM', '7:00 PM']

export default function BookDemoPage() {
  const { id } = useParams()
  const [tutor, setTutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mode, setMode] = useState('Online')
  const [details, setDetails] = useState({ className: '', subject: '', date: '', time: '', location: '', notes: '' })
  const update = (key, value) => setDetails((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    let active = true
    api.get(`/tutors/${encodeURIComponent(id)}`).then((result) => { if (active) { const mapped = mapTutor(result); setTutor(mapped); setMode(mapped.mode.includes('Online') || mapped.mode.includes('Both') ? 'Online' : 'Offline') } }).catch((requestError) => { if (active) setError(requestError.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  if (loading) return <section className="booking-page"><div className="container"><p>Loading tutor information…</p></div></section>
  if (!tutor) return <section className="booking-page"><div className="container"><p role="alert" className="inline-notice">{error||'Tutor profile not found.'}</p><Button as={Link} to="/tutors">Browse tutors</Button></div></section>
  if (tutor && !tutor.verified) return <section className="booking-page"><div className="container"><p className="inline-notice">This tutor is awaiting verification. Demo requests are available after approval.</p><Button as={Link} to={`/tutors/${tutor.id}`}>Back to tutor profile</Button></div></section>
  if (submitted) return <section className="success-page"><div className="success-card"><span className="success-mark"><Check size={30}/></span><div className="eyebrow">YOU’RE ONE STEP CLOSER</div><h1>Demo Request Sent</h1><p>Your request has been shared with <strong>{tutor.name}</strong>. They’ll review your preferred time and confirm the demo class soon.</p><div className="success-summary"><img src={tutor.profilePhoto} alt=""/><span><strong>{tutor.name}</strong><small>{details.subject || tutor.subjects[0]} · {details.className || 'Class to be confirmed'}</small></span><BadgeCheck size={18}/></div><div className="success-actions"><Button as={Link} to="/dashboard/student">Go to my dashboard <ArrowRight size={16}/></Button><Link to="/tutors">Explore more tutors</Link></div></div></section>

  return <section className="booking-page"><div className="container">
    <Link className="back-link" to={`/tutors/${tutor.id}`}><ArrowLeft size={15}/>Back to {tutor.name}’s profile</Link>
    <div className="booking-layout"><main><div className="eyebrow">A FIRST HELLO</div><h1>Book a <span>demo class.</span></h1><p className="booking-intro">A short introduction is a great way to see if the tutor is the right fit.</p>
      <form className="booking-form" onSubmit={async(event)=>{event.preventDefault();setError('');setBusy(true);try{await api.post('/demo-requests',{tutorId:tutor.id,className:details.className,subject:details.subject,mode,preferredDate:details.date,preferredTime:details.time,location:details.location,notes:details.notes});setSubmitted(true)}catch(requestError){setError(requestError.message)}finally{setBusy(false)}}}>
        <h2>Tell us about the lesson</h2>
        <div className="form-row"><Select label="Student / class" name="className" value={details.className} onChange={(event)=>update('className',event.target.value)} required><option value="">Select class</option>{Array.from({length:12},(_,index)=><option key={index}>Class {index+1}</option>)}</Select><Select label="Subject" name="subject" value={details.subject} onChange={(event)=>update('subject',event.target.value)} required><option value="">Choose subject</option>{tutor.subjects.map((subject)=><option key={subject}>{subject}</option>)}</Select></div>
        <div className="field"><span className="field-label">Teaching mode <i>*</i></span><div className="mode-choice-row">{tutor.mode.flatMap((option)=>option==='Both'?['Online','Offline']:[option]).map((option)=><button type="button" key={option} onClick={()=>setMode(option)} className={`mode-choice ${mode===option?'selected':''}`}>{option==='Online'?<Video size={17}/>:<MapPin size={17}/>} {option}</button>)}</div></div>
        <div className="form-row"><Input label="Preferred date" name="date" type="date" min={minimumDate} value={details.date} onChange={(event)=>update('date',event.target.value)} required/><Select label="Preferred time" name="time" value={details.time} onChange={(event)=>update('time',event.target.value)} required><option value="">Select a time</option>{timeSlots.map((time)=><option key={time}>{time}</option>)}</Select></div>
        {mode==='Offline'&&<Input label="Your location / pincode" name="location" placeholder="Area or pincode" value={details.location} onChange={(event)=>update('location',event.target.value)} required/>}
        <Textarea label="Anything you’d like the tutor to know? (optional)" name="notes" rows="3" placeholder="Share a learning goal or topic you’d like to cover." value={details.notes} onChange={(event)=>update('notes',event.target.value)}/>
        {error&&<p className="field-error form-message" role="alert">{error}</p>}<Button type="submit" className="full-width send-request" disabled={busy}>{busy?'Sending request…':'Send Request'} {!busy&&<ArrowRight size={17}/>}</Button>
      </form></main>
      <aside className="request-summary"><div className="eyebrow">YOUR REQUEST</div><h2>Lesson summary</h2><div className="summary-tutor"><img src={tutor.profilePhoto} alt={tutor.name}/><div><strong>{tutor.name}</strong><span><BadgeCheck size={14}/>{tutor.verified?'Verified tutor':'Tutor profile'}</span></div></div><div className="summary-line"><span><Video size={16}/>Format</span><strong>{mode}</strong></div><div className="summary-line"><span><BadgeCheck size={16}/>Subject & class</span><strong>{details.subject||'Choose subject'}{details.className?` · ${details.className}`:''}</strong></div><div className="summary-line"><span><CalendarDays size={16}/>Date</span><strong>{details.date||'Choose a date'}</strong></div><div className="summary-line"><span><Clock3 size={16}/>Time</span><strong>{details.time||'Choose a time'}</strong></div>{mode==='Offline'&&<div className="summary-line"><span><MapPin size={16}/>Location</span><strong>{details.location||'Add location'}</strong></div>}<div className="summary-total"><span>Demo class</span><strong>Free</strong></div><p className="safe-note"><BadgeCheck size={14}/>No payment needed. The tutor will confirm your request.</p></aside>
    </div>
  </div></section>
}

