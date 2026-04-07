import { useState } from 'react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('all')

  const categories = ['All', 'Technology', 'Finance', 'Healthcare', 'Sales', 'Marketing', 'Design', 'Education']
  const locations = ['All', 'Remote', 'New York', 'San Francisco', 'London', 'Sydney', 'Toronto']

  const stats = [
    {
      label: 'Active Jobs',
      value: '2,450',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Companies',
      value: '500+',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'from-violet-500 to-violet-600',
    },
    {
      label: 'Active Users',
      value: '10K+',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Placements',
      value: '5,000+',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'from-amber-500 to-orange-500',
    },
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Product Manager',
      company: 'Tech Corp',
      initials: 'SJ',
      color: 'from-pink-500 to-rose-500',
      text: 'Found my dream job within 2 weeks. The platform made it so easy to connect with top companies!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      role: 'Software Engineer',
      company: 'Innovation Labs',
      initials: 'MC',
      color: 'from-blue-500 to-indigo-600',
      text: 'Great job opportunities and supportive community. Highly recommended for tech professionals.',
      rating: 5,
    },
    {
      name: 'Emily Davis',
      role: 'UX Designer',
      company: 'Creative Studios',
      initials: 'ED',
      color: 'from-violet-500 to-purple-600',
      text: 'Best platform for finding quality talent. Excellent service and a very intuitive experience!',
      rating: 5,
    },
  ]

  const featuredJobs = [
    { id: 1, title: 'Senior React Developer', company: 'Tech Innovations', location: 'Remote', salary: '$120k–$150k', category: 'Technology', type: 'Full-Time', color: 'bg-blue-50 dark:bg-blue-900/20', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
    { id: 2, title: 'UX/UI Designer', company: 'Design Co', location: 'San Francisco', salary: '$100k–$130k', category: 'Design', type: 'Full-Time', color: 'bg-violet-50 dark:bg-violet-900/20', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
    { id: 3, title: 'Marketing Manager', company: 'Growth Marketing', location: 'New York', salary: '$90k–$120k', category: 'Marketing', type: 'Hybrid', color: 'bg-emerald-50 dark:bg-emerald-900/20', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
    { id: 4, title: 'Data Scientist', company: 'AI Solutions', location: 'Remote', salary: '$130k–$160k', category: 'Technology', type: 'Remote', color: 'bg-amber-50 dark:bg-amber-900/20', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  ]

  const popularCategories = [
    { name: 'Technology', count: 450, color: 'from-blue-500 to-indigo-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
    )},
    { name: 'Design', count: 280, color: 'from-pink-500 to-rose-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
    )},
    { name: 'Marketing', count: 320, color: 'from-orange-500 to-amber-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
    )},
    { name: 'Finance', count: 190, color: 'from-emerald-500 to-teal-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { name: 'Healthcare', count: 340, color: 'from-red-500 to-pink-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    )},
    { name: 'Sales', count: 210, color: 'from-violet-500 to-purple-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
    )},
    { name: 'Education', count: 160, color: 'from-cyan-500 to-blue-500', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" /></svg>
    )},
    { name: 'Operations', count: 180, color: 'from-slate-500 to-zinc-600', icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    )},
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-24 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="container relative mx-auto px-6">
          <div className="mb-14 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-300 backdrop-blur-sm">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              India's #1 Job Portal — 2,450+ live openings
            </div>
            <h1 className="mb-5 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl lg:text-7xl">
              Find Your{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Perfect Career
              </span>
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-300/90 leading-relaxed">
              Connect with top companies across India & worldwide. Upload your resume, apply in one click, and land your dream role faster than ever.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mx-auto max-w-4xl">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md md:flex-row">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Job title, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-4 text-white placeholder:text-slate-400 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-8 text-white focus:border-blue-400/50 focus:outline-none md:w-44"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()} className="text-slate-900">{cat}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/10 py-3 pl-10 pr-8 text-white focus:border-blue-400/50 focus:outline-none md:w-44"
                >
                  {locations.map((loc) => (
                    <option key={loc} value={loc.toLowerCase()} className="text-slate-900">{loc}</option>
                  ))}
                </select>
              </div>
              <Link to="/jobs" className="flex-shrink-0">
                <button className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-600 hover:to-indigo-700 hover:shadow-blue-500/40 md:w-auto">
                  Search Jobs
                </button>
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-slate-400">
              <span>Popular:</span>
              {['React Developer', 'Product Manager', 'Data Analyst', 'UI Designer'].map((tag) => (
                <button key={tag} className="rounded-full border border-white/10 px-3 py-0.5 text-slate-300 hover:border-blue-400/40 hover:text-blue-300 transition">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 dark:divide-slate-800 md:grid-cols-4 md:divide-y-0">
            {stats.map((stat, idx) => (
              <div key={idx} className="flex items-center gap-4 px-6 py-8">
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Jobs */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Handpicked for You</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Featured Opportunities</h2>
            </div>
            <Link to="/jobs" className="hidden items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 md:flex">
              View all jobs
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredJobs.map((job) => (
              <div key={job.id} className={`group relative flex flex-col rounded-2xl border border-slate-200 ${job.color} p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-800`}>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-800">
                    <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${job.badge}`}>{job.type}</span>
                </div>
                <h3 className="mb-1 font-bold text-slate-900 dark:text-white">{job.title}</h3>
                <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{job.company}</p>
                <div className="mt-auto space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {job.location}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg className="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {job.salary}
                  </div>
                </div>
                <Link to="/jobs">
                  <button className="mt-4 w-full rounded-xl border border-indigo-200 bg-white/70 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-600 hover:text-white hover:border-indigo-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white">
                    View Details
                  </button>
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link to="/jobs">
              <button className="rounded-xl border border-indigo-200 px-8 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/30">
                View All Jobs
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="mb-14 text-center">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-blue-400">Our Advantage</p>
            <h2 className="text-3xl font-bold">Why Thousands Choose Us</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: 'Smart Matching', desc: 'AI-powered job recommendations tailored to your skills, experience, and career goals.', icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              )},
              { title: 'One-Click Apply', desc: 'Upload your resume once and apply to multiple jobs instantly without repetitive forms.', icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
              )},
              { title: 'Real-Time Tracking', desc: 'Track every application from submission to offer with live status updates and pipeline visibility.', icon: (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              )},
            ].map((feature, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm transition hover:bg-white/10">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="mb-12 text-center">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Explore by Domain</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Popular Categories</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {popularCategories.map((category, idx) => (
              <button
                key={idx}
                className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${category.color} text-white shadow-md`}>
                  {category.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{category.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{category.count} jobs</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-white py-20 dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <div className="mb-12 text-center">
            <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Success Stories</p>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">What Our Users Say</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <div key={idx} className="relative rounded-2xl border border-slate-200 bg-slate-50 p-7 dark:border-slate-800 dark:bg-slate-950">
                <div className="mb-5 flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.color} text-sm font-bold text-white`}>
                    {testimonial.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{testimonial.role} · {testimonial.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 py-24 text-white">
        {/* Noise texture overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'1\'/%3E%3C/svg%3E")' }} />

        {/* Soft glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 right-1/3 h-40 w-40 -translate-y-1/2 rounded-full bg-sky-400/10 blur-2xl" />

        {/* Floating badge top-left */}
        <div className="absolute left-8 top-12 hidden xl:block">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm">🎯</span>
            <div>
              <p className="text-[11px] font-semibold text-white leading-none">5,000+ placed</p>
            </div>
          </div>
        </div>

        {/* Floating badge top-right */}
        <div className="absolute right-8 top-12 hidden xl:block">
          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-sm">⚡</span>
            <div>
              <p className="text-[11px] font-semibold text-white leading-none">Apply in 60 sec</p>
            </div>
          </div>
        </div>

        <div className="container relative mx-auto px-6 text-center">
          {/* Small overline */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-1.5 text-sm font-medium text-blue-200">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
            Trusted by 10,000+ professionals across India
          </div>

          <h2 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            Ready to Land Your<br />
            <span className="text-sky-300">Dream Job?</span>
          </h2>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/register">
              <button className="group relative overflow-hidden rounded-2xl bg-white px-10 py-4 text-sm font-bold text-blue-800 shadow-xl shadow-blue-900/40 transition hover:shadow-2xl hover:shadow-blue-900/50">
                <span className="relative z-10">Get Started — It's Free</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-sky-100 to-white transition-transform group-hover:translate-x-0" />
              </button>
            </a>
            <a href="/jobs">
              <button className="rounded-2xl border border-white/25 bg-white/10 px-10 py-4 text-sm font-bold text-white backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20">
                Browse All Jobs →
              </button>
            </a>
          </div>

          {/* Avatars + social proof */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex -space-x-2">
              {['from-pink-500 to-rose-500', 'from-amber-500 to-orange-500', 'from-emerald-500 to-teal-500', 'from-blue-500 to-indigo-500', 'from-violet-500 to-purple-500'].map((g, i) => (
                <div key={i} className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${g} text-xs font-bold text-white ring-2 ring-blue-900`}>
                  {['R', 'A', 'S', 'P', 'K'][i]}
                </div>
              ))}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white ring-2 ring-blue-900">
                +9k
              </div>
            </div>
            <p className="text-sm text-blue-200">
              Join <strong className="text-white">10,000+ professionals</strong> who found their dream role here
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
