import { Link } from "react-router"
import { Logo } from "./icons"
import shared from "./Landing.module.css"
import styles from "./LandingFooter.module.css"
import { SectionLink } from "./SectionLink"

// Worked out once when the page loads, not on every render.
const copyrightYear = new Date().getFullYear()

const product = [
  { section: "features", label: "Features" },
  { section: "pricing", label: "Pricing" },
  { section: "join", label: "Join Early Access" },
]

const pages = {
  Account: [
    { to: "/sign-in", label: "Sign in" },
    { to: "/sign-up", label: "Create an account" },
  ],
  Legal: [
    { to: "/privacy", label: "Privacy Policy" },
    { to: "/terms", label: "Terms & Conditions" },
  ],
}

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={shared.wrap}>
        <div className={styles.columns}>
          <div>
            <SectionLink section="top">
              <Logo />
            </SectionLink>
            <p>
              The investor database and cold email platform built for founders actively raising
              their round.
            </p>
          </div>
          <div>
            <h6>Product</h6>
            <ul>
              {product.map((item) => (
                <li key={item.section}>
                  <SectionLink section={item.section}>
                    {item.label} <span aria-hidden>→</span>
                  </SectionLink>
                </li>
              ))}
            </ul>
          </div>
          {Object.entries(pages).map(([heading, links]) => (
            <div key={heading}>
              <h6>{heading}</h6>
              <ul>
                {links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>
                      {link.label} <span aria-hidden>→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <span>© {copyrightYear} Pitchdex Inc. All rights reserved.</span>
          <div className={styles.bottomLinks}>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </div>
        </div>
        <div className={styles.wordmark} aria-hidden>
          pitchdex
        </div>
      </div>
    </footer>
  )
}
