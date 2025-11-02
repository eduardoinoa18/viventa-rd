/**
 * Firestore service layer for CRUD operations
 */

import { db } from './firebaseClient'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'

// ===== PROPERTIES =====

export interface Property {
  id?: string
  title: string
  description: string
  publicRemarks?: string // Public-facing description for buyers/renters
  professionalRemarks?: string // Private notes for agents/brokers only
  price: number
  location: string
  city?: string
  neighborhood?: string
  lat?: number
  lng?: number
  bedrooms: number
  bathrooms: number
  area: number
  propertyType: 'apartment' | 'house' | 'condo' | 'land' | 'commercial'
  listingType: 'sale' | 'rent'
  images: string[]
  agentId: string
  agentName: string
  status: 'active' | 'pending' | 'sold' | 'draft'
  featured?: boolean
  createdAt?: any
  updatedAt?: any
}

export async function createProperty(data: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'properties'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function getProperty(id: string): Promise<Property | null> {
  const snap = await getDoc(doc(db, 'properties', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Property
}

export async function updateProperty(id: string, data: Partial<Property>) {
  await updateDoc(doc(db, 'properties', id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteProperty(id: string) {
  await deleteDoc(doc(db, 'properties', id))
}

export async function getPropertiesByAgent(agentId: string): Promise<Property[]> {
  const q = query(
    collection(db, 'properties'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Property))
}

export async function getAllProperties(maxResults = 100): Promise<Property[]> {
  const q = query(
    collection(db, 'properties'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(maxResults)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Property))
}

// ===== LEADS =====

export interface Lead {
  id?: string
  name: string
  email: string
  phone: string
  message?: string
  propertyId?: string
  propertyTitle?: string
  agentId: string
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
  source: 'website' | 'referral' | 'social' | 'other'
  createdAt?: any
  updatedAt?: any
}

export async function createLead(data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'leads'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function getLead(id: string): Promise<Lead | null> {
  const snap = await getDoc(doc(db, 'leads', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Lead
}

export async function updateLead(id: string, data: Partial<Lead>) {
  await updateDoc(doc(db, 'leads', id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteLead(id: string) {
  await deleteDoc(doc(db, 'leads', id))
}

export async function getLeadsByAgent(agentId: string): Promise<Lead[]> {
  const q = query(
    collection(db, 'leads'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Lead))
}

// ===== MESSAGES =====

export interface Message {
  id?: string
  conversationId: string
  senderId: string
  senderName: string
  receiverId: string
  receiverName: string
  content: string
  read: boolean
  createdAt?: any
}

export async function sendMessage(data: Omit<Message, 'id' | 'createdAt'>) {
  const docRef = await addDoc(collection(db, 'messages'), {
    ...data,
    createdAt: serverTimestamp()
  })
  return docRef.id
}

export async function getMessage(id: string): Promise<Message | null> {
  const snap = await getDoc(doc(db, 'messages', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Message
}

export async function markMessageAsRead(id: string) {
  await updateDoc(doc(db, 'messages', id), { read: true })
}

export async function getMessagesByConversation(conversationId: string): Promise<Message[]> {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'asc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Message))
}

export async function getConversationsForUser(userId: string): Promise<any[]> {
  // Get all messages where user is sender or receiver
  const q1 = query(
    collection(db, 'messages'),
    where('senderId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const q2 = query(
    collection(db, 'messages'),
    where('receiverId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  
  const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)])
  
  // Combine and deduplicate by conversationId
  const conversations = new Map()
  
  for (const doc of [...snap1.docs, ...snap2.docs]) {
    const msg = { id: doc.id, ...doc.data() } as Message
    const convId = msg.conversationId
    
    if (!conversations.has(convId) || 
        (msg.createdAt && conversations.get(convId).createdAt < msg.createdAt)) {
      conversations.set(convId, msg)
    }
  }
  
  return Array.from(conversations.values()).sort((a, b) => {
    const timeA = a.createdAt?.toMillis?.() || 0
    const timeB = b.createdAt?.toMillis?.() || 0
    return timeB - timeA
  })
}

// ===== CLIENTS (extended user profiles) =====

export interface Client {
  id?: string
  name: string
  email: string
  phone?: string
  agentId: string
  status: 'active' | 'inactive'
  notes?: string
  createdAt?: any
  updatedAt?: any
}

export async function createClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'clients'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}

export async function getClient(id: string): Promise<Client | null> {
  const snap = await getDoc(doc(db, 'clients', id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Client
}

export async function updateClient(id: string, data: Partial<Client>) {
  await updateDoc(doc(db, 'clients', id), {
    ...data,
    updatedAt: serverTimestamp()
  })
}

export async function deleteClient(id: string) {
  await deleteDoc(doc(db, 'clients', id))
}

export async function getClientsByAgent(agentId: string): Promise<Client[]> {
  const q = query(
    collection(db, 'clients'),
    where('agentId', '==', agentId),
    orderBy('createdAt', 'desc')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Client))
}
