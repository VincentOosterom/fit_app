import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import styles from './Admin.module.css'

export default function AdminMedewerkers() {
  const { user: currentUser } = useAuth()
  const [admins, setAdmins] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [admRes, profRes] = await Promise.all([
        supabase.from('admin_user_ids').select('user_id'),
        supabase.from('profiles').select('id, email, full_name, role'),
      ])
      if (!cancelled) {
        setAdmins(admRes.data?.map((a) => a.user_id) ?? [])
        setProfiles(profRes.data ?? [])
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const adminProfiles = profiles.filter((p) => admins.includes(p.id))

  const addByEmail = async (e) => {
    e.preventDefault()
    setMessage('')
    const profile = profiles.find((p) => (p.email || '').toLowerCase() === email.trim().toLowerCase())
    if (!profile) {
      setMessage('Geen account gevonden met dit e-mailadres. Sync eerst profielen op de Klanten-pagina.')
      return
    }
    if (admins.includes(profile.id)) {
      setMessage('Deze gebruiker is al admin.')
      return
    }
    const { error } = await supabase.from('admin_user_ids').insert({ user_id: profile.id })
    if (error) {
      setMessage('Toevoegen mislukt: ' + error.message)
      return
    }
    await supabase.from('profiles').update({ role: 'admin', updated_at: new Date().toISOString() }).eq('id', profile.id)
    setAdmins((a) => [...a, profile.id])
    setEmail('')
    setMessage(profile.email + ' is nu admin.')
  }

  const removeAdmin = async (userId) => {
    if (userId === currentUser?.id) {
      setMessage('Je kunt jezelf niet verwijderen.')
      return
    }
    const { error } = await supabase.from('admin_user_ids').delete().eq('user_id', userId)
    if (error) {
      setMessage('Verwijderen mislukt: ' + error.message)
      return
    }
    await supabase.from('profiles').update({ role: 'client', updated_at: new Date().toISOString() }).eq('id', userId)
    setAdmins((a) => a.filter((id) => id !== userId))
    setMessage('Admin-rechten verwijderd.')
  }

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Medewerkers</h1>
      <p className={styles.intro}>Beheer wie admin-rechten heeft. Admins kunnen klanten, rapportage en instellingen beheren.</p>

      <section className={styles.section}>
        <h2>Admin toevoegen</h2>
        <form onSubmit={addByEmail} className={styles.actions}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail van bestaande gebruiker"
            className={styles.input}
            required
          />
          <button type="submit" className={styles.btnPrimary}>Toevoegen als admin</button>
        </form>
        {message && <p className={styles.message}>{message}</p>}
      </section>

      <section className={styles.section}>
        <h2>Huidige admins</h2>
        <ul className={styles.list}>
          {adminProfiles.map((p) => (
            <li key={p.id}>
              {p.email || p.full_name || p.id} {p.id === currentUser?.id && '(jij)'}
              {p.id !== currentUser?.id && (
                <button type="button" onClick={() => removeAdmin(p.id)} className={styles.btnDanger} style={{ marginLeft: '0.75rem' }}>
                  Verwijderen
                </button>
              )}
            </li>
          ))}
        </ul>
        {adminProfiles.length === 0 && <p className={styles.muted}>Nog geen andere admins.</p>}
      </section>
    </div>
  )
}
