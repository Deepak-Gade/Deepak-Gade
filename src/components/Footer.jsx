import { BookOpen, Globe, Mail, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const currentYear = new Date().getFullYear()

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Link className="brand" to="/"><span className="brand-icon"><BookOpen size={19} /></span><span>Tutor<span>Link</span></span></Link>
          <p>Right Tutor. Brighter Future.</p>
        </div>
        <div className="footer-col"><h3>Explore</h3><Link to="/tutors">Find a Tutor</Link><Link to="/#how-it-works">How It Works</Link><Link to="/register/tutor">Become a Tutor</Link></div>
        <div className="footer-col"><h3>Get started</h3><Link to="/register/student">For Students</Link><Link to="/register/tutor">For Tutors</Link><Link to="/login">Login</Link></div>
        <div className="footer-col footer-contact"><h3>Stay connected</h3><p>Better learning is one good connection away.</p><div className="social-links"><a href="mailto:hello@tutorlink.example" aria-label="Email TutorLink"><Mail size={17} /></a><a href="https://www.google.com" aria-label="Website"><Globe size={17} /></a><a href="/tutors" aria-label="Tutor community"><Users size={17} /></a></div></div>
      </div>
      <div className="container footer-legal"><span>© {currentYear} TutorLink</span><span>Made for brighter futures.</span></div>
    </footer>
  )
}
