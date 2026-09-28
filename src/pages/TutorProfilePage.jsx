import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BadgeCheck, BookOpen, CalendarDays, Clock3, Heart, MapPin, MessageCircle, MonitorPlay, ShieldCheck, Star } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Badge, Button, EmptyState, LoadingState, Modal, Rating } from '../components/UI.jsx'
import { api, mapTutor } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.js'

export default function TutorProfilePage() {
  const { id } = useParams()
  const [tutor, setTutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [savedForUserId, setSavedForUserId] = useState(null)
  const [contactOpen, setContactOpen] = useState(false)
  const [saveError, setSaveError] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    let active = true
    api.get(`/tutors/${encodeURIComponent(id)}`).then((result) => { if (active) { setTutor(mapTutor(result)); setLoadError('') } }).catch((error) => { if (active) setLoadError(error.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    let active = true
    if (!user || user.role !== 'STUDENT' || !tutor) return () => { active = false }
    api.get('/saved-tutors').then((items) => { if (active) setSavedForUserId(items.some((item) => item.tutor.id === tutor.id) ? user.id : null) }).catch(() => {})
    return () => { active = false }
  }, [user, tutor])

  async function toggleSaved() {
    setSaveError('')
    if (!user) { setSaveError('Log in as a student to save this tutor.'); return }
    if (user.role !== 'STUDENT') { setSaveError('Saved tutors are available on student accounts.'); return }
    try {
      if (saved) { await api.delete(`/saved-tutors/${encodeURIComponent(tutor.id)}`); setSavedForUserId(null) }
      else { await api.post(`/saved-tutors/${encodeURIComponent(tutor.id)}`); setSavedForUserId(user.id) }
    } catch (error) { setSaveError(error.message) }
  }

  const saved = Boolean(user && savedForUserId === user.id)
  if (loading && !tutor && !loadError) return <section className="profile-page"><div className="container"><LoadingState label="Loading tutor profile…"/></div></section>
  if (loadError || !tutor) return <section className="profile-page"><div className="container"><EmptyState title="Tutor profile unavailable" description={loadError||'Try browsing the full tutor directory.'} action={<Button as={Link} to="/tutors">Browse tutors</Button>} /></div></section>

  return <section className="profile-page"><div className="container">
    <Link className="back-link profile-back" to="/tutors"><ArrowLeft size={15}/>Back to tutors</Link>
    <div className="profile-layout"><main className="profile-main">
      <section className="profile-hero-card"><div className="profile-photo"><img src={tutor.profilePhoto} alt={tutor.name}/><span className="profile-online"><span/>Available for demos</span></div><div className="profile-identity"><div className="eyebrow">TUTOR PROFILE</div><h1>{tutor.name} {tutor.verified?<span className="verify-label"><BadgeCheck size={20}/> Verified</span>:<Badge tone={tutor.verificationStatus==="PENDING"?"amber":"blue"}>{tutor.verificationStatus==="PENDING"?"Pending verification":"Unverified"}</Badge>}</h1><p className="profile-qualification">{tutor.qualification}</p><div className="profile-rating"><Rating value={tutor.rating} count={tutor.reviews}/><span>·</span><span>{tutor.experience} years teaching</span></div><div className="profile-chips"><Badge tone="purple">{tutor.experience}+ years experience</Badge><Badge>{tutor.mode.join(' & ')}</Badge></div></div><button className={`profile-save ${saved?'is-saved':''}`} aria-label={saved?'Unsave tutor':'Save tutor'} disabled={!tutor.verified} onClick={toggleSaved}><Heart size={18} fill={saved?'currentColor':'none'}/></button></section>{saveError&&<p role="alert" className="inline-notice">{saveError}</p>}
      <section className="profile-section"><div className="eyebrow">A LITTLE ABOUT ME</div><h2>Helping learners find their confidence.</h2><p>{tutor.about}</p></section>
      <section className="profile-section"><div className="eyebrow">WHAT I CAN HELP WITH</div><h2>Subjects & classes</h2><div className="profile-detail-grid"><div><h3><BookOpen size={16}/> Subjects</h3><div className="tag-row">{tutor.subjects.map((subject)=><Badge key={subject}>{subject}</Badge>)}</div></div><div><h3><Star size={16}/> Classes</h3><div className="tag-row">{tutor.classes.map((className)=><Badge key={className}>{className}</Badge>)}</div></div></div></section>
      <section className="profile-section"><div className="eyebrow">LESSONS THAT WORK FOR YOU</div><h2>Flexible ways to learn</h2><div className="profile-detail-grid"><div><h3><MonitorPlay size={16}/> Teaching mode</h3><p>{tutor.mode.join(' or ')} sessions available</p></div><div><h3><MapPin size={16}/> Location</h3><p>{tutor.location}{tutor.mode.includes('Offline')?' · In-person lessons available':''}</p></div></div></section>
      <section className="profile-section"><div className="eyebrow">WHEN I'M AVAILABLE</div><h2>Find a time that fits</h2><div className="availability-pills">{tutor.availability.map((time)=><span key={time}><Clock3 size={14}/>{time}</span>)}</div></section>
    </main><aside className="profile-sidebar"><div className="booking-card"><div className="booking-card-top"><BadgeCheck size={17}/><span>{tutor.verified?'VERIFIED TUTOR':tutor.verificationStatus==='PENDING'?'PENDING VERIFICATION':'UNVERIFIED TUTOR'}</span></div><div className="fee-display"><strong>₹{tutor.fee.toLocaleString('en-IN')}</strong><span>/ month</span></div><p className="fee-note">Flexible lesson plans to suit your goals</p><div className="booking-info"><span><Rating value={tutor.rating}/></span><span><MapPin size={15}/>{tutor.location}</span><span><CalendarDays size={15}/>Demo classes available</span></div><Button as={Link} to={tutor.verified?`/tutors/${tutor.id}/book-demo`:"#"} className="full-width" disabled={!tutor.verified}>{tutor.verified?<>Book a Demo <ArrowRight size={16}/></>:"Demo requests open after verification"}</Button><Button variant="outline" className="full-width message-btn" onClick={()=>setContactOpen(true)}><MessageCircle size={16}/>Contact tutor</Button><p className="safe-note"><ShieldCheck size={14}/>No commitment. Meet your tutor first.</p></div></aside></div>
    <Modal open={contactOpen} onClose={()=>setContactOpen(false)} title={`Contact ${tutor.name}`}><p className="modal-copy">Tutor messaging will be available when TutorLink’s account services are connected. You can request a free demo class to start the conversation.</p><Button as={Link} to={`/tutors/${tutor.id}/book-demo`} className="full-width" onClick={()=>setContactOpen(false)}>Request a demo <ArrowRight size={16}/></Button></Modal>
  </div></section>
}
