import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/utils/prisma.js'

const encode = (value) => JSON.stringify(value)
const tutors = [
  { name:'Maya Sharma',email:'maya@tutorlink.com',qualification:'M.Sc. Mathematics, Delhi University',experience:8,classes:['Class 8','Class 9','Class 10','Class 11'],subjects:['Mathematics','Physics'],teachingMode:['Online','Offline'],locations:['South Delhi'],fees:2200,availableTimings:['Weekday evenings','Saturday mornings'],about:'I believe every student can feel at home with mathematics. My lessons turn big concepts into small, clear wins.',profilePhoto:'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=500&q=85',isVerified:true },
  { name:'Arjun Mehta',email:'arjun@tutorlink.com',qualification:'B.Tech, IIT Delhi · JEE Mentor',experience:6,classes:['Class 10','Class 11','Class 12','JEE'],subjects:['Physics','Mathematics'],teachingMode:['Online'],locations:['Gurugram'],fees:2800,availableTimings:['Weekday evenings','Sunday afternoons'],about:'I help learners build strong fundamentals and exam confidence with interactive sessions and real-world examples.',profilePhoto:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=85',isVerified:true },
  { name:'Sana Khan',email:'sana@tutorlink.com',qualification:'M.A. English Literature, JNU',experience:7,classes:['Class 6','Class 7','Class 8','Class 9','Class 10'],subjects:['English','Writing','Communication'],teachingMode:['Online','Offline'],locations:['Noida'],fees:1800,availableTimings:['Weekday mornings','Saturday afternoons'],about:'Making language feel expressive and achievable is my favourite thing. We focus on confidence and comprehension.',profilePhoto:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=85',isVerified:true },
  { name:'Rohan Iyer',email:'rohan@tutorlink.com',qualification:'M.Sc. Chemistry, IIT Bombay',experience:10,classes:['Class 9','Class 10','Class 11','Class 12'],subjects:['Chemistry','Science'],teachingMode:['Online','Offline'],locations:['East Delhi'],fees:2500,availableTimings:['Weekday evenings','Sunday mornings'],about:'Chemistry becomes intuitive when you can see how ideas connect. I help students build a lasting understanding.',profilePhoto:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=85',isVerified:false },
  { name:'Neha Kapoor',email:'neha@tutorlink.com',qualification:'B.Ed. · CBSE Senior Educator',experience:9,classes:['Class 6','Class 7','Class 8','Class 9','Class 10'],subjects:['Biology','Science'],teachingMode:['Online'],locations:['West Delhi'],fees:1600,availableTimings:['Weekday afternoons','Saturday mornings'],about:'I create warm, structured learning spaces where students feel comfortable being curious.',profilePhoto:'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=500&q=85',isVerified:true }
]

async function upsertUser({name,email,phone,role,passwordHash}) {
  return prisma.user.upsert({ where:{email}, create:{name,email,phone,passwordHash,role}, update:{name,phone,passwordHash,role} })
}

try {
  if (process.env.NODE_ENV === 'production') {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase()
    const password = process.env.SEED_ADMIN_PASSWORD
    if (!email || !password || password.length < 16) throw new Error('Production seed requires SEED_ADMIN_EMAIL and a SEED_ADMIN_PASSWORD of at least 16 characters.')
    const passwordHash = await bcrypt.hash(password, 12)
    await upsertUser({ name: process.env.SEED_ADMIN_NAME || 'TutorLink Admin', email, role: 'ADMIN', passwordHash })
    console.log('Production admin account provisioned from environment. No sample accounts were seeded.')
  } else {
  const [adminHash,studentHash,tutorHash]=await Promise.all(['Admin@123','Student@123','Tutor@123'].map((password)=>bcrypt.hash(password,12)))
  await upsertUser({name:'TutorLink Admin',email:'admin@tutorlink.com',phone:'9000000000',role:'ADMIN',passwordHash:adminHash})
  const studentSeeds=[
    {name:'Aarav Mehta',email:'aarav@example.com',phone:'9876500001',className:'Class 10',subjects:['Mathematics','Physics'],teachingMode:'Both',location:'South Delhi',pincode:'110016',budget:2600,preferredTimings:['Weekday evenings','Saturday mornings']},
    {name:'Isha Verma',email:'isha@example.com',phone:'9876500002',className:'Class 8',subjects:['English','Science'],teachingMode:'Online',location:'Noida',pincode:'201301',budget:2200,preferredTimings:['Weekday afternoons']},
    {name:'Kabir Shah',email:'kabir@example.com',phone:'9876500003',className:'Class 12',subjects:['Physics','Mathematics'],teachingMode:'Online',location:'Gurugram',pincode:'122001',budget:3000,preferredTimings:['Sunday afternoons']}
  ]
  const studentUsers=[]
  for(const student of studentSeeds){const user=await upsertUser({...student,role:'STUDENT',passwordHash:studentHash});studentUsers.push({user,student})}
  const tutorUsers=[]
  for(const tutor of tutors){
    const user=await upsertUser({name:tutor.name,email:tutor.email,phone:'9876510000',role:'TUTOR',passwordHash:tutorHash})
    const profileFields={qualification:tutor.qualification,experience:tutor.experience,classes:encode(tutor.classes),subjects:encode(tutor.subjects),teachingMode:encode(tutor.teachingMode),locations:encode(tutor.locations),fees:tutor.fees,availableTimings:encode(tutor.availableTimings),about:tutor.about,profilePhoto:tutor.profilePhoto}
    const profile=await prisma.tutorProfile.upsert({
      where:{userId:user.id},
      create:{userId:user.id,...profileFields,isVerified:tutor.isVerified,verificationStatus:tutor.isVerified?'VERIFIED':'PENDING'},
      update:profileFields,
    })
    tutorUsers.push({user,profile})
  }
  for(const {user,student} of studentUsers){const exists=await prisma.studentRequirement.findFirst({where:{studentId:user.id,className:student.className}});if(!exists)await prisma.studentRequirement.create({data:{studentId:user.id,className:student.className,subjects:encode(student.subjects),teachingMode:student.teachingMode,location:student.location,pincode:student.pincode,budget:student.budget,preferredTimings:encode(student.preferredTimings)}})}
  const requestCount=await prisma.demoRequest.count()
  if(requestCount===0){
    const requirementA=await prisma.studentRequirement.findFirst({where:{studentId:studentUsers[0].user.id}})
    const requirementB=await prisma.studentRequirement.findFirst({where:{studentId:studentUsers[1].user.id}})
    await prisma.demoRequest.createMany({data:[
      {studentId:studentUsers[0].user.id,tutorId:tutorUsers[0].profile.id,requirementId:requirementA.id,className:'Class 10',subject:'Mathematics',mode:'Online',preferredDate:new Date(Date.now()+86400000*2),preferredTime:'5:30 PM',location:'South Delhi',notes:'Would love to review algebra.',status:'PENDING'},
      {studentId:studentUsers[1].user.id,tutorId:tutorUsers[2].profile.id,requirementId:requirementB.id,className:'Class 8',subject:'English',mode:'Online',preferredDate:new Date(Date.now()+86400000*3),preferredTime:'4:00 PM',status:'ACCEPTED'},
      {studentId:studentUsers[2].user.id,tutorId:tutorUsers[1].profile.id,className:'Class 12',subject:'Physics',mode:'Online',preferredDate:new Date(Date.now()+86400000*4),preferredTime:'6:00 PM',status:'PENDING'}
    ]})
  }
  console.log('TutorLink development seed is ready.')
  }
} catch(error) {
  console.error('Unable to seed TutorLink development data.',error)
  process.exitCode=1
} finally {
  await prisma.$disconnect()
}
