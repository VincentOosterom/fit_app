import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import styles from './Admin.module.css'

export default function AdminAccounts() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const load = async () => {
    await supabase.rpc('sync_profiles_from_auth').then(() => {})
    const [profilesRes, adminsRes] = await Promise.all([
      supabase.from('profiles').select('id, email, full_name, role, is_blocked, deleted_at, created_at').order('created_at', { ascending: false }),
      supabase.from('admin_user_ids').select('user_id'),
    ])
    const adminIds = new Set((adminsRes.data ?? []).map((a) => a.user_id))
    const all = profilesRes.data ?? []
    setProfiles(all.filter((p) => !adminIds.has(p.id)))
  }

  useEffect(() => {
    let cancelled = false
    load().then(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncMessage('')
    const { data, error } = await supabase.rpc('sync_profiles_from_auth')
    setSyncing(false)
    if (error) {
      setSyncMessage('Sync mislukt: ' + (error.message || 'Onbekend'))
      return
    }
    await load()
    setSyncMessage(typeof data === 'number' ? `${data} profiel(en) bijgewerkt.` : 'Sync voltooid.')
  }

  const filtered = search.trim()
    ? profiles.filter((p) => (p.email || '').toLowerCase().includes(search.toLowerCase()) || (p.full_name || '').toLowerCase().includes(search.toLowerCase()))
    : profiles

  if (loading) return <p className={styles.muted}>Laden…</p>

  return (
    <div className={styles.page}>
      <h1>Klanten</h1>
      <p className={styles.intro}>Alle klantaccounts (geen medewerkers). Bij openen worden profielen gesynchroniseerd. Klik op een account voor detail, schema’s en acties.</p>
      <div className={styles.toolbar}>
        <input
          type="search"
          placeholder="Zoeken op e-mail of naam…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        <button type="button" onClick={handleSync} disabled={syncing} className={styles.btnSecondary}>
          {syncing ? 'Syncen…' : 'Profielen syncen'}
        </button>
      </div>
      {syncMessage && <p className={styles.message}>{syncMessage}</p>}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Naam</th>
              <th>Rol</th>
              <th>Actief</th>
              <th>Status</th>
              <th>Geregistreerd</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.email || '—'}</td>
                <td>{p.full_name || '—'}</td>
                <td>{p.role || 'client'}</td>
                <td>{p.deleted_at ? 'Nee' : p.is_blocked ? 'Geblokkeerd' : 'Ja'}</td>
                <td>{p.deleted_at ? 'Verwijderd' : p.is_blocked ? 'Geblokkeerd' : 'Actief'}</td>
                <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('nl-NL') : '—'}</td>
                <td>
                  <Link to={`/dashboard/admin/accounts/${p.id}`} className={styles.link}>Bekijken</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.muted}>{filtered.length} account(s)</p>
    </div>
  )
}
