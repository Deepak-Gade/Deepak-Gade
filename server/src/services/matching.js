import { parseList, publicTutor } from '../utils/values.js'

const includesIgnoreCase = (values, target) => values.some((value) => value.toLowerCase() === target.toLowerCase())

export function scoreTutor(profile, requirement) {
  const classes = parseList(profile.classes)
  const subjects = parseList(profile.subjects)
  const modes = parseList(profile.teachingMode)
  const locations = parseList(profile.locations)
  const requestedSubjects = parseList(requirement.subjects)
  const requestedModes = requirement.teachingMode === 'Both' ? ['Online', 'Offline'] : [requirement.teachingMode]
  const classMatch = includesIgnoreCase(classes, requirement.className)
  const subjectMatch = requestedSubjects.some((subject) => includesIgnoreCase(subjects, subject))
  const modeMatch = modes.includes('Both') || requestedModes.some((mode) => modes.includes(mode))
  const canMatchOnline = requestedModes.includes('Online') && (modes.includes('Online') || modes.includes('Both'))
  const locationText = `${requirement.location || ''} ${requirement.pincode || ''}`.trim().toLowerCase()
  const locationMatch = !locationText || canMatchOnline || locations.some((location) => {
    const normalizedLocation = location.toLowerCase()
    return normalizedLocation.includes(locationText) || locationText.includes(normalizedLocation)
  })
  const budgetMatch = requirement.budget == null || profile.fees <= requirement.budget
  const experienceWeight = Math.min(Math.max(profile.experience || 0, 0), 10)
  const matchedCriteria = []
  let score = 0
  const add = (matched, weight, criterion) => {
    if (!matched) return
    score += weight
    matchedCriteria.push({ criterion, weight })
  }

  add(classMatch, 25, 'Class')
  add(subjectMatch, 25, 'Subject')
  add(modeMatch, 15, 'Teaching mode')
  add(locationMatch, 15, 'Location')
  add(budgetMatch, 10, 'Budget')
  if (experienceWeight > 0) {
    score += experienceWeight
    matchedCriteria.push({ criterion: 'Experience', weight: experienceWeight })
  }

  return {
    tutor: publicTutor(profile),
    matchPercentage: Math.round(score),
    matchedCriteria,
  }
}
