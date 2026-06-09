import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../contexts/AuthContext'

export interface LibraryItem {
  id: number
  type: 'movie' | 'tv'
  title: string
  poster: string | null
  status: 'watched' | 'watchlist'
  rating: number
  addedAt: number
}

export function useLibrary() {
  const { user } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])

  useEffect(() => {
    if (!user) { setItems([]); return }
    const q = query(collection(db, 'users', user.uid, 'library'))
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => d.data() as LibraryItem))
    })
    return unsub
  }, [user])

  async function saveItem(item: LibraryItem) {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'library', `${item.type}-${item.id}`)
    await setDoc(ref, item)
  }

  async function removeItem(id: number, type: 'movie' | 'tv') {
    if (!user) return
    const ref = doc(db, 'users', user.uid, 'library', `${type}-${id}`)
    await deleteDoc(ref)
  }

  function getItem(id: number, type: 'movie' | 'tv') {
    return items.find((i) => i.id === id && i.type === type) ?? null
  }

  return { items, saveItem, removeItem, getItem }
}
