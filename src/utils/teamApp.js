// The install-as-app offer is for the team only. public/index.html has no
// manifest link, so Chrome never offers to install the site to visitors; once
// a team member is signed in (TeamNav), this adds it. The app opens on the
// Planner (manifest start_url).
export const offerTeamApp = () => {
  if (document.querySelector('link[rel="manifest"]')) return
  const link = document.createElement('link')
  link.rel = 'manifest'
  link.href = `${process.env.PUBLIC_URL || ''}/manifest.json`
  document.head.appendChild(link)
}
