// app/admin/people/agents/page.tsx
'use client'
import { useEffect, useState, Suspense } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import AdminPeopleTabs from '@/components/AdminPeopleTabs'
import CreateProfessionalModal from '@/components/CreateProfessionalModal'
import InviteModal from '@/components/InviteModal'
import { db } from '@/lib/firebaseClient'
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { FiUserPlus, FiCheck, FiX, FiEdit, FiTrash2, FiMail } from 'react-icons/fi'
import AdminUserDetailsModal from '@/components/AdminUserDetailsModal'
import toast from 'react-hot-toast'
import { useSearchParams } from 'next/navigation'

function AgentsInner() {
  const [agents, setAgents] = useState<any[]>([])
  // app/admin/people/agents/page.tsx
  import { redirect } from 'next/navigation'

  export default function PeopleAgentsPage() {
    redirect('/admin/people?tab=agents')
  }
    load()
