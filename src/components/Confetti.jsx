import { useEffect, useState } from 'react'
import styles from './Confetti.module.css'

const COLORS = ['#b8ff00', '#9ee600', '#fff', '#ffd700', '#ffeb3b', '#c8e6c9']

function Particle({ delay, x, color, size, duration }) {
  return (
    <div
      className={styles.particle}
      style={{
        '--delay': `${delay}ms`,
        '--x': `${x}%`,
        '--color': color,
        '--size': `${size}px`,
        '--duration': `${duration}ms`,
      }}
    />
  )
}

export default function Confetti() {
  const [particles, setParticles] = useState([])

  useEffect(() => {
    const count = 70
    const list = []
    for (let i = 0; i < count; i++) {
      list.push({
        id: i,
        delay: Math.random() * 600,
        x: Math.random() * 100,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 6 + Math.random() * 8,
        duration: 2500 + Math.random() * 1500,
      })
    }
    setParticles(list)
    const t = setTimeout(() => setParticles([]), 4500)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={styles.wrap} aria-hidden>
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </div>
  )
}
