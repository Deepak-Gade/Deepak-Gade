import { useState } from 'react'
import { ArrowRight, BookOpen, Circle } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button, Input } from '../components/UI.jsx'
import { useAuth } from '../hooks/useAuth.js'

export default function LoginPage() {
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event) {
    event.preventDefault(); setNotice(''); setBusy(true)
    const form = new FormData(event.currentTarget)
    try {
      const user = await signIn({ email: form.get('email'), password: form.get('password') })
      const home = user.role === 'ADMIN' ? '/admin' : user.role === 'TUTOR' ? '/tutor/dashboard' : '/dashboard/student'
      const returnTo = location.state?.from
      navigate(returnTo?.pathname ? `${returnTo.pathname}${returnTo.search||''}` : home, { replace: true })
    } catch (error) { setNotice(error.message) }
    finally { setBusy(false) }
  }

  return <section className="auth-page"><div className="auth-wrap login-wrap"><div className="auth-heading signup-heading"><span className="signup-icon"><BookOpen size={22}/></span><div className="eyebrow">WELCOME BACK</div><h1>Good to see you again.</h1><p>Log in to pick up where your learning journey left off.</p></div><form className="form-card signup-form" onSubmit={submit}><Input label="Email address" name="email" type="email" autoComplete="email" placeholder="you@example.com" required/><Input label="Password" name="password" type="password" autoComplete="current-password" placeholder="Your password" required/><div className="login-options"><label><input type="checkbox"/> Remember me</label><button type="button" onClick={()=>setNotice('Password recovery will be available when email services are connected.')}>Forgot password?</button></div><Button type="submit" className="full-width" disabled={busy}>{busy?'Signing in…':'Log in'} {!busy&&<ArrowRight size={16}/>}</Button>{notice&&<p role="alert" className="inline-notice">{notice}</p>}<div className="form-divider"><span/>or<span/></div><Button type="button" variant="outline" className="full-width google-button" onClick={()=>setNotice('Google sign-in is not connected. Please use your email and password.')}><Circle size={17}/>Continue with Google</Button></form><p className="auth-switch">New to TutorLink? <Link to="/register">Get started</Link></p></div></section>
}
