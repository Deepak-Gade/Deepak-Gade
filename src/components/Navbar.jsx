import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth.js'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const close = () => setOpen(false)
  const workspace = user?.role === 'ADMIN' ? '/admin' : user?.role === 'TUTOR' ? '/tutor/dashboard' : '/dashboard/student'
  const logout = () => { signOut(); close(); navigate('/') }

  return <header className="site-header"><nav className="container navbar" aria-label="Main navigation">
    <Link className="brand" to="/" onClick={close}><span className="brand-icon"><BookOpen size={20}/></span><span>Tutor<span>Link</span></span></Link>
    <button className="mobile-menu" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button>
    <div className={`nav-content ${open?'nav-content-open':''}`}><div className="nav-primary"><NavLink to="/tutors" onClick={close}>Find Tutors</NavLink><Link to="/#how-it-works" onClick={close}>How It Works</Link><NavLink to={user?.role==='TUTOR'?'/tutor/profile':'/register/tutor'} onClick={close}>Become a Tutor</NavLink></div><div className="nav-cta">{user?<><Link className="nav-login" to={workspace} onClick={close}>{user.name.split(' ')[0]} · Workspace</Link><button className="nav-logout" onClick={logout}>Log out</button></>:<><Link className="nav-login" to="/login" onClick={close}>Login</Link><Link className="btn btn-primary nav-start" to="/register" onClick={close}>Get Started</Link></>}</div></div>
  </nav></header>
}
