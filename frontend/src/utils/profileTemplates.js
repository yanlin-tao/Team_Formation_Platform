export const fallbackProfile = {
  profile: {
    name: 'Avery Chen',
    title: 'Product-focused CS + Advertising Student',
    major: 'Computer Science + Advertising Minor',
    graduation: 'Spring 2025',
    location: 'Urbana-Champaign, IL',
    bio: 'I blend user research with rapid prototyping to ship course project MVPs. Currently leading matchmaking initiatives for CS 411 and co-hosting peer onboarding workshops.',
    availability: 'Weekdays after 5 PM & weekends',
  },
  stats: [
    { label: 'Active Courses', value: 5, trend: '+1 this term' },
    { label: 'Open Requests', value: 3, trend: '2 waiting replies' },
    { label: 'Successful Matches', value: 14, trend: '92% response rate' },
    { label: 'Collaboration Score', value: '4.8/5', trend: 'Consistently high' },
  ],
  activeTeams: [
    {
      name: 'CS 411 • Team Atlas',
      role: 'Product Lead',
      focus: 'Matching dashboard with predictive ranking',
      progress: 72,
      spots: 1,
    },
    {
      name: 'ECE 484 • Resonance Lab',
      role: 'UX Researcher',
      focus: 'Signal optimization visualizer',
      progress: 45,
      spots: 2,
    },
  ],
  spotlightProjects: [
    {
      course: 'CS 412 • Data Mining',
      title: 'Peer Mentor Matching Engine',
      summary: 'Combined MySQL window functions with FastAPI streaming to cut match time by 63%.',
    },
    {
      course: 'INFO 490 • Design Studio',
      title: 'TeamUp Brand Refresh',
      summary: 'Partnered with 4 designers to craft UIUC-themed system with reusable tokens.',
    },
  ],
  skills: {
    core: ['Product Strategy', 'Data Storytelling', 'Team Facilitation', 'Rapid Prototyping'],
    tools: ['Figma', 'FastAPI', 'MySQL', 'Supabase', 'Vite', 'Zustand'],
  },
  recentActivity: [
    { title: 'Launched skill tags for CS 411', time: '2h ago', detail: 'Shared tagged templates with 28 teammates.' },
    { title: 'Reviewed 3 join requests', time: 'Yesterday', detail: 'Left feedback for students in INFO 303.' },
    { title: 'Published sprint recap', time: 'Mon, 10:45 PM', detail: 'Outlined blockers + unblocked tasks for Atlas.' },
  ],
  learningTargets: [
    { topic: 'GraphQL Federation', detail: 'Scalable gateway for course data mesh' },
    { topic: 'LLM Prompt Chaining', detail: 'Auto-generate teammate intros & outreach tips' },
    { topic: 'Service Reliability', detail: 'Add SLO dashboards for matching backlog' },
  ],
}
