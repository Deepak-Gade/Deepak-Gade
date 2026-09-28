import { useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Circle, GraduationCap } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components/UI.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function SignupPage({ role }) {
  const isTutor = role === 'tutor'
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    const form = new FormData(event.currentTarget)
    if (form.get('password') !== form.get('confirmPassword')) { setError('Your passwords don’t match yet.'); return }
    setBusy(true)
    try {
      await signUp({ name: form.get('name'), email: form.get('email'), phone: form.get('phone'), password: form.get('password'), role: isTutor ? 'TUTOR' : 'STUDENT' })
      navigate(isTutor ? '/tutor/profile' : '/requirements')
    } catch (requestError) { setError(requestError.message) }
    finally { setBusy(false) }
  }

  return <section className="auth-page"><div className="auth-wrap signup-wrap"><Link className="back-link" to="/register"><ArrowLeft size={15}/>Back to role selection</Link>
    <div className="auth-heading signup-heading"><span className="signup-icon">{isTutor?<GraduationCap size={22}/>:<BookOpen size={22}/>}</span><div className="eyebrow">{isTutor?'TUTOR SIGN UP':'STUDENT & PARENT SIGN UP'}</div><h1>{isTutor?'Let’s get to know you.':'Your learning journey starts here.'}</h1><p>{isTutor?'Create your account and share your teaching experience.':'Create an account to find a tutor who feels like the right fit.'}</p></div>
    <form className="form-card signup-form" onSubmit={submit}><Input name="name" label="Full name" placeholder="e.g. Priya Sharma" autoComplete="name" required/><div className="form-row"><Input name="email" label="Email address" type="email" placeholder="you@example.com" autoComplete="email" required/><Input name="phone" label="Phone number" type="tel" placeholder="+91 98765 43210" autoComplete="tel" pattern="[+0-9 ()-]{8,}" required/></div><div className="form-row"><Input name="password" label="Password" type="password" placeholder="At least 8 characters" minLength={8} autoComplete="new-password" required/><Input name="confirmPassword" label="Confirm password" type="password" placeholder="Enter it again" minLength={8} autoComplete="new-password" required/></div>{error&&<p className="field-error form-message" role="alert">{error}</p>}<Button type="submit" className="full-width" disabled={busy}>{busy?'Creating your account…':`Create ${isTutor?'tutor':'student'} account`} {!busy&&<ArrowRight size={16}/>}</Button><div className="form-divider"><span/>or<span/></div><Button type="button" variant="outline" className="full-width google-button" onClick={()=>setError('Google sign-in is not connected in this version. Use your email to create an account.')}><Circle size={17}/>Continue with Google</Button><p className="terms-note">By continuing, you agree to TutorLink’s <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a>.</p></form>
    <p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p>
  </div></section>
}
