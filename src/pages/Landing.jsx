import { Link } from 'react-router-dom'
import LandingHeader from '../components/LandingHeader'
import { TRAINING_GOALS, TRAINING_GOAL_CATEGORIES } from '../lib/trainingGoals'
import styles from './Landing.module.css'

export default function Landing() {
  return (
    <div className={styles.page}>
      <LandingHeader />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>TrainLogic</p>
          <h1>Voeding en training op maat</h1>
          <p className={styles.heroSub}>
            Eén keer je doelen invullen. Wij bouwen een 4-weekse planning op vaste regels. Geen dag-tot-dag stress — wel wekelijkse evaluatie en een schema dat bij je past.
          </p>
          <Link to="/login?register=1" className={styles.heroCta}>
            Start — eerste maand gratis
          </Link>
          <p className={styles.heroNote}>Daarna vanaf € 7,95/maand · 3 plannen: Starter, Pro of Premium · Min. 6 maanden, daarna maandelijks opzegbaar</p>
        </div>
      </section>

      <section id="sport-doel" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2>Kies je sport of doel</h2>
          <p className={styles.lead}>
            Of je nu traint voor een marathon, Hyrox, een wedstrijd of gewoon fitter wilt worden — bij het invullen van je gegevens kies je welk doel bij je past. Wij houden daar in je schema rekening mee: opbouw, volume en taper passen we aan op jouw sport of evenement.
          </p>
          <div className={styles.goalGrid}>
            {(Object.keys(TRAINING_GOAL_CATEGORIES)).map((catKey) => (
              <div key={catKey} className={styles.goalCategory}>
                <h3>{TRAINING_GOAL_CATEGORIES[catKey]}</h3>
                <ul className={styles.goalChips}>
                  {TRAINING_GOALS.filter((g) => g.category === catKey).map((g) => (
                    <li key={g.value}>{g.label}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="hoe-werkt-het" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2>Hoe het werkt</h2>
          <p className={styles.lead}>
            Eén keer je gegevens invullen. Daarna krijg je een persoonlijk 4-weekse schema voor voeding en training. Na elke week een korte evaluatie — zo kunnen we bijsturen waar nodig.
          </p>
          <ul className={styles.steps}>
            <li><strong>Input</strong> — Doel, niveau, beschikbare dagen, dieetwensen</li>
            <li><strong>Schema</strong> — Wij genereren voeding (kcal, macro’s, voorbeelden) en training (focus, volume, concrete sessies)</li>
            <li><strong>Weekevaluatie</strong> — Honger of futloos? Slaap en training goed? We passen aan op jouw feedback</li>
          </ul>
        </div>
      </section>

      <section id="berekening" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2>Zo berekenen we je schema</h2>
          <p className={styles.lead}>
            Vaste regels en jouw cijfers. Geen giswerk — alles is uitlegbaar.
          </p>
          <div className={styles.calculationFlow}>
            <div className={styles.flowStep}>
              <span className={styles.flowNum}>1</span>
              <div>
                <strong>Jouw input</strong>
                <p>Doel, niveau, trainingsdagen, tijd per sessie, gewicht en voedingsdoel. Bij zware sport (marathon, kracht+duur) hogere energiebehoefte.</p>
              </div>
            </div>
            <div className={styles.flowStep}>
              <span className={styles.flowNum}>2</span>
              <div>
                <strong>Volume & calorieën</strong>
                <p>Volume = dagen × minuten. Calorieën uit doel: vetverlies ≈ 85%, prestatie ≈ 115%. Macro’s per doel.</p>
              </div>
            </div>
            <div className={styles.flowStep}>
              <span className={styles.flowNum}>3</span>
              <div>
                <strong>4 weken, per week</strong>
                <p>Training: focus, voorbeeldsessies met duur en oefeningen. Voeding: energierichting + voorbeeldmaaltijden met kcal en macro’s.</p>
              </div>
            </div>
            <div className={styles.flowStep}>
              <span className={styles.flowNum}>4</span>
              <div>
                <strong>Wekelijkse evaluatie</strong>
                <p>Na elke week: hoe ging het, honger/futloos, slaap, training. Daar sturen we op bij.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="voeding" className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2>Voeding</h2>
          <p className={styles.lead}>
            Per week: energierichting, weekgemiddelde kcal en macro’s. Concrete voorbeeldmaaltijden met kcal en eiwit/koolhydraten/vet.
          </p>
        </div>
      </section>

      <section id="training" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2>Training</h2>
          <p className={styles.lead}>
            4 weken met focus per week, volume en concrete sessies (duur, type, voorbeeldoefeningen). Geleidelijke progressie en herstel.
          </p>
        </div>
      </section>

      <section id="tarieven" className={styles.pricing}>
        <div className={styles.sectionInner}>
          <h2>Prijzen</h2>
          <p className={styles.lead}>
            Kies het plan dat bij je past. Eerste maand gratis bij elk plan.
          </p>
          <div className={styles.priceGrid}>
            <div className={styles.priceCard}>
              <div className={styles.priceHeader}>
                <span className={styles.priceName}>Starter</span>
                <div className={styles.priceAmount}>
                  <span className={styles.priceValue}>€ 7,95</span>
                  <span className={styles.pricePeriod}>/maand</span>
                </div>
                <p className={styles.priceFirst}>Eerste maand gratis</p>
              </div>
              <ul className={styles.priceFeatures}>
                <li>4-weekse voedings- en trainingsschema</li>
                <li>Wekelijkse evaluatie (na elke week)</li>
                <li>Vervolg schema na 4 weken (op basis van evaluatie)</li>
                <li>Basis e-mail ondersteuning</li>
              </ul>
              <p className={styles.priceTerms}>Min. 6 maanden, daarna maandelijks opzegbaar.</p>
              <Link to="/login?register=1" className={styles.cta + ' ' + styles.ctaSecondary}>Kies Starter</Link>
            </div>

            <div className={styles.priceCard + ' ' + styles.priceCardFeatured}>
              <span className={styles.priceCardBadge}>Meest gekozen</span>
              <div className={styles.priceHeader}>
                <span className={styles.priceName}>Pro</span>
                <div className={styles.priceAmount}>
                  <span className={styles.priceValue}>€ 9,99</span>
                  <span className={styles.pricePeriod}>/maand</span>
                </div>
                <p className={styles.priceFirst}>Eerste maand gratis</p>
              </div>
              <ul className={styles.priceFeatures}>
                <li>Alles van Starter, plus:</li>
                <li>Uitgebreide voorbeeldmaaltijden met kcal en macro’s per maaltijd</li>
                <li>Concrete trainingssessies: type, duur en voorbeeldoefeningen (sets × reps)</li>
                <li>Supplementadvies op basis van je profiel (doel, gebruik)</li>
                <li>Prioriteit bij schema-generatie en aanpassingen</li>
                <li>Export schema (PDF) voor onderweg of print</li>
                <li>E-mail support met reactie binnen 48 uur</li>
                <li>Progressie-overzicht per blok (volume, evaluaties)</li>
              </ul>
              <p className={styles.priceTerms}>Min. 6 maanden, daarna maandelijks opzegbaar.</p>
              <Link to="/login?register=1" className={styles.cta}>Kies Pro</Link>
            </div>

            <div className={styles.priceCard}>
              <div className={styles.priceHeader}>
                <span className={styles.priceName}>Premium</span>
                <div className={styles.priceAmount}>
                  <span className={styles.priceValue}>€ 14,95</span>
                  <span className={styles.pricePeriod}>/maand</span>
                </div>
                <p className={styles.priceFirst}>Eerste maand gratis</p>
              </div>
              <ul className={styles.priceFeatures}>
                <li>Alles van Pro, plus:</li>
                <li>Persoonlijke check-in na week 2 en week 4 (korte review + advies)</li>
                <li>Schema bijgesteld op jouw evaluatie vóór het volgende blok</li>
                <li>Toegang tot event-specifieke programma’s (marathon, wedstrijd, taper)</li>
                <li>Prioriteit support (reactie binnen 24 uur)</li>
              </ul>
              <p className={styles.priceTerms}>Min. 6 maanden, daarna maandelijks opzegbaar.</p>
              <Link to="/login?register=1" className={styles.cta + ' ' + styles.ctaSecondary}>Kies Premium</Link>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2>Voor wie</h2>
          <p className={styles.lead}>
            Voor iedereen die wil trainen en eten volgens een plan. Afvallen, sterker worden, fit vanaf nul of richting een sportevenement — we bouwen één 4-weekse planning die bij je past.
          </p>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p className={styles.footerBrand}>TrainLogic</p>
          <p className={styles.footerTagline}>Voeding &amp; training op maat.</p>
          <p className={styles.footerLegal}>© TrainLogic</p>
        </div>
      </footer>
    </div>
  )
}
