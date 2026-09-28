import { ArrowLeft, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/UI.jsx'

export default function PlaceholderPage({ title, description }) {
  return <section className="not-found-page"><span className="not-found-icon"><BookOpen size={25}/></span><div className="eyebrow">TUTORLINK</div><h1>{title}</h1><p>{description}</p><Button as={Link} to="/"><ArrowLeft size={15}/>Back to home</Button></section>
}
