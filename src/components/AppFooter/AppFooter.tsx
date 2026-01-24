'use client'

import styles from './AppFooter.module.sass'

interface FooterLink {
  label: string
  href: string
}

interface AppFooterProps {
  links?: FooterLink[]
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Support', href: '/support' },
]

export default function AppFooter({ links = DEFAULT_LINKS }: AppFooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.branding}>
          <span className={styles.poweredBy}>Powered by</span>
          <span className={styles.logo}>
            <span className={styles.logoText}>optivo</span>
            <span className={styles.logoDot} />
          </span>
        </div>

        <nav className={styles.links}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.link}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.copyright}>
          <span>&copy; {currentYear} Optivo. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
