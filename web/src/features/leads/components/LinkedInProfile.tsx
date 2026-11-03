import { useId } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useLinkedInProfile } from "../hooks/useLinkedInProfile"
import type { LinkedInDegree } from "../types"
import styles from "./LinkedInProfile.module.css"

const degreeLabels: Record<LinkedInDegree, string> = {
  First: "1st",
  Second: "2nd",
  Third: "3rd",
  OutOfNetwork: "Out of network",
}

const monthFormat = new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" })
const countFormat = new Intl.NumberFormat(undefined, { notation: "compact" })

/** "Mar 2022 – Present", from LinkedIn's dates. Empty when LinkedIn gave none. */
function period(start: string | null | undefined, end: string | null | undefined) {
  if (!start) return null
  const format = (date: string) => monthFormat.format(new Date(`${date}T00:00:00`))
  return `${format(start)} – ${end ? format(end) : "Present"}`
}

/** A lead's LinkedIn background: connection, reach, About, experience and education. */
export function LinkedInProfile({ leadId }: { leadId: string }) {
  const id = useId()
  const profile = useLinkedInProfile(leadId)

  return (
    <section className={styles.section} aria-labelledby={id}>
      <h4 id={id} className={styles.heading}>
        LinkedIn
      </h4>

      {profile.isPending ? (
        <div className={styles.loading} aria-busy="true">
          <Skeleton className={styles.skeletonLine} />
          <Skeleton className={styles.skeletonBlock} />
          <Skeleton className={styles.skeletonBlock} />
        </div>
      ) : profile.isError ? (
        <div className={styles.prompt}>
          <p className={styles.muted}>{profile.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => profile.refetch()}>
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.badges}>
            {profile.data.summary.degree && (
              <Badge variant="secondary">{degreeLabels[profile.data.summary.degree]}</Badge>
            )}
            {profile.data.summary.isOpenProfile && (
              <Badge variant="outline" title="Anyone can message them, without connecting first">
                Open Profile
              </Badge>
            )}
            {profile.data.summary.isPremium && <Badge variant="outline">Premium</Badge>}
          </div>

          <Reach
            followers={profile.data.followers}
            connections={profile.data.connections}
            shared={profile.data.sharedConnections}
          />

          {profile.data.about && <p className={styles.about}>{profile.data.about}</p>}

          {profile.data.experience.length > 0 && (
            <Timeline
              title="Experience"
              items={profile.data.experience.map((role) => ({
                logoUrl: role.logoUrl,
                primary: role.position,
                secondary: role.company,
                period: period(role.start, role.end),
              }))}
            />
          )}

          {profile.data.education.length > 0 && (
            <Timeline
              title="Education"
              items={profile.data.education.map((school) => ({
                logoUrl: school.logoUrl,
                primary: school.school,
                secondary: school.degree,
                period: period(school.start, school.end),
              }))}
            />
          )}
        </>
      )}
    </section>
  )
}

function Reach({
  followers,
  connections,
  shared,
}: {
  followers?: number | null
  connections?: number | null
  shared?: number | null
}) {
  const parts = [
    followers != null && `${countFormat.format(followers)} followers`,
    connections != null && `${countFormat.format(connections)} connections`,
    shared ? `${shared} shared` : null,
  ].filter(Boolean)

  return parts.length > 0 ? <p className={styles.muted}>{parts.join(" · ")}</p> : null
}

type TimelineItem = {
  logoUrl?: string | null
  primary: string
  secondary?: string | null
  period: string | null
}

function Timeline({ title, items }: { title: string; items: TimelineItem[] }) {
  return (
    <div className={styles.timeline}>
      <h5 className={styles.subheading}>{title}</h5>
      <ul className={styles.list}>
        {items.map((item, index) => (
          <li key={index} className={styles.item}>
            {item.logoUrl ? (
              <img
                src={item.logoUrl}
                alt=""
                className={styles.logo}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className={styles.logo} aria-hidden />
            )}
            <div className={styles.itemText}>
              <p className={styles.primary}>{item.primary}</p>
              {item.secondary && <p>{item.secondary}</p>}
              {item.period && <p className={styles.muted}>{item.period}</p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
