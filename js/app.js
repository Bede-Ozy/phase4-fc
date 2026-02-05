// Phase 4 FC - Core App Logic

// --- State Management ---
const State = {
    players: [],
    sessions: [],
    currentTab: 'sessions', // Default tab
    playerSearchQuery: '',
    playerFilterPos: 'all',
    matchSearchQuery: '',
    matchFilterType: 'all',
    init() {
        this.load();
        this.render();
    },
    load() {
        const savedPlayers = localStorage.getItem('p4fc_players');
        const savedSessions = localStorage.getItem('p4fc_sessions');
        this.players = savedPlayers ? JSON.parse(savedPlayers) : this.getSeedPlayers();
        this.sessions = savedSessions ? JSON.parse(savedSessions) : this.getSeedSessions();
        console.log('State Loaded:', { players: this.players.length, sessions: this.sessions.length });
    },
    save() {
        localStorage.setItem('p4fc_players', JSON.stringify(this.players));
        localStorage.setItem('p4fc_sessions', JSON.stringify(this.sessions));
    },
    getSeedPlayers() {
        return [
            { id: 1, name: 'Bede O.', position: 'Forward', active: true },
            { id: 2, name: 'Aderinsola K.', position: 'Midfielder', active: true },
            { id: 3, name: 'Marcus R.', position: 'Defender', active: true },
            { id: 4, name: 'John D.', position: 'Midfielder', active: true },
            { id: 5, name: 'Sarah L.', position: 'Winger', active: true }
        ];
    },
    getSeedSessions() {
        return [
            {
                id: 101,
                date: '2026-01-28',
                type: 'match',
                teams: [
                    {
                        name: 'Orange', coach: 'Coach Michael', score: 3, players: [
                            { name: 'Bede O.', goals: 2, assists: 1, yellow: 0, red: 0, role: 'starter' },
                            { name: 'Sarah L.', goals: 1, assists: 0, yellow: 0, red: 0, role: 'starter' }
                        ]
                    },
                    {
                        name: 'Blue', coach: 'Coach David', score: 1, players: [
                            { name: 'Aderinsola K.', goals: 1, assists: 0, yellow: 0, red: 0, role: 'starter' },
                            { name: 'Marcus R.', goals: 0, assists: 1, yellow: 0, red: 0, role: 'starter' }
                        ]
                    }
                ]
            },
            {
                id: 102,
                date: '2026-02-01',
                type: 'training',
                coach: 'Coach Michael',
                teams: [
                    {
                        name: 'Orange', score: 2, players: [
                            { name: 'Sarah L.', goals: 2, assists: 0, yellow: 0, red: 0, role: 'starter' },
                            { name: 'John D.', goals: 0, assists: 1, yellow: 0, red: 0, role: 'starter' }
                        ]
                    },
                    {
                        name: 'Blue', score: 2, players: [
                            { name: 'Bede O.', goals: 1, assists: 1, yellow: 0, red: 0, role: 'starter' },
                            { name: 'Marcus R.', goals: 1, assists: 0, yellow: 1, red: 0, role: 'starter' }
                        ]
                    }
                ]
            }
        ];
    },
    render() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('index.html') || path.endsWith('/') || path.endsWith('phase4fc') || path.endsWith('phase4fc/') || (!path.includes('admin.html') && !path.includes('stats.html') && !path.includes('.html'))) {
            this.renderPublicDashboard();
        } else if (path.includes('stats.html')) {
            this.renderStatsPage();
        } else if (path.includes('matches.html')) {
            this.renderMatchHistoryPage();
        } else if (path.includes('admin.html')) {
            this.renderAdminDashboard();
        }
    },

    renderStatsPage() {
        this.renderDetailedStats();
    },

    renderAdminDashboard() {
        switchTab(this.currentTab);
    },

    renderPublicDashboard() {
        this.renderLatestMatch();
        this.renderStatsOverview();
        this.renderMatchList();
        this.renderLeaderboard();
    },

    renderMatchHistoryPage() {
        const container = document.getElementById('full-match-list');
        if (!container) return;

        const searchQuery = (this.matchSearchQuery || '').toLowerCase();
        const filterType = (this.matchFilterType || 'all').toLowerCase();

        let filtered = this.sessions.filter(s => {
            const matchesSearch = s.teams.some(t => t.name.toLowerCase().includes(searchQuery)) ||
                s.date.includes(searchQuery) ||
                s.type.toLowerCase().includes(searchQuery);
            const matchesType = filterType === 'all' || s.type.toLowerCase() === filterType;
            return matchesSearch && matchesType;
        });

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center glass-card rounded-3xl">
                    <div class="text-4xl mb-4">🏟️</div>
                    <p class="text-slate-500 italic">No matches found matching your criteria.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.slice().reverse().map(s => `
            <div class="glass-card overflow-hidden rounded-3xl border border-slate-700 hover:border-primary/30 transition-all group">
                <div class="p-6 md:p-8">
                    <div class="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div class="flex-1 flex flex-col md:flex-row items-center gap-6">
                            <div class="text-center bg-slate-800 rounded-2xl p-4 min-w-[100px] border border-slate-700">
                                <div class="text-xs text-slate-400 font-bold uppercase tracking-widest">${new Date(s.date).toLocaleDateString('en-GB', { month: 'short' })}</div>
                                <div class="text-3xl font-black">${new Date(s.date).getDate()}</div>
                                <div class="text-[10px] text-slate-500 font-bold uppercase mt-1">${new Date(s.date).getFullYear()}</div>
                            </div>
                            
                            <div class="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                                <div class="flex items-center gap-3">
                                    ${this.getTeamFlag(s.teams[0].name)}
                                    <h4 class="text-xl font-bold">${s.teams[0].name}</h4>
                                </div>
                                <div class="px-6 py-2 bg-slate-900 rounded-2xl border border-slate-700 flex items-center gap-4">
                                    <span class="text-3xl font-black text-primary">${s.teams[0].score}</span>
                                    <span class="text-slate-600 font-bold text-sm">VS</span>
                                    <span class="text-3xl font-black text-primary">${s.teams[1].score}</span>
                                </div>
                                <div class="flex items-center gap-3">
                                    <h4 class="text-xl font-bold text-right">${s.teams[1].name}</h4>
                                    ${this.getTeamFlag(s.teams[1].name)}
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex flex-col items-center md:items-end gap-3">
                            <span class="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/20">${s.type}</span>
                            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-tight">
                                Coach: ${s.type === 'training' ? (s.coach || '--') : (s.teams[0].coach || '--')}
                            </div>
                        </div>
                    </div>

                    <!-- Scorers & Lineups Section -->
                    <div class="mt-8 pt-6 border-t border-slate-700/50">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">${s.teams[0].name} Lineup & Contributions</h5>
                                <div class="flex flex-wrap gap-2">
                                    ${this.renderExpandedPlayers(s.teams[0])}
                                </div>
                            </div>
                            <div class="md:text-right">
                                <h5 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">${s.teams[1].name} Lineup & Contributions</h5>
                                <div class="flex flex-wrap gap-2 md:justify-end">
                                    ${this.renderExpandedPlayers(s.teams[1])}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderLatestMatch() {
        const container = document.getElementById('latest-match-container');
        if (!container) return;

        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div class="glass-card p-12 rounded-2xl text-center">
                    <h2 class="text-xl text-slate-400">Welcome to Phase 4 FC</h2>
                    <p class="mt-2">No recent sessions recorded. Check back soon or visit Admin to add data.</p>
                </div>
            `;
            return;
        }

        const latest = this.sessions[this.sessions.length - 1];

        container.innerHTML = `
            <div class="glass-card rounded-3xl overflow-hidden relative border border-slate-700">
                <div class="p-8">
                    <div class="absolute top-0 right-0 p-4">
                        <span class="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-widest">${latest.type}</span>
                    </div>
                    <div class="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div class="flex-1 text-center md:text-right">
                            <div class="flex items-center justify-center md:justify-end gap-2 mb-2">
                                ${this.getTeamFlag(latest.teams[0].name)}
                                <h4 class="text-slate-400 text-sm font-semibold uppercase">${latest.teams[0].name}</h4>
                            </div>
                            <div class="text-5xl font-black">${latest.teams[0].score}</div>
                            <div class="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tight">Coach: ${latest.type === 'training' ? (latest.coach || '--') : (latest.teams[0].coach || '--')}</div>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="text-slate-500 font-bold text-sm mb-1">${new Date(latest.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                            <div class="h-12 w-px bg-slate-700"></div>
                            <div class="mt-2 text-slate-400 font-bold">VS</div>
                        </div>
                        <div class="flex-1 text-center md:text-left">
                            <div class="flex items-center justify-center md:justify-start gap-2 mb-2">
                                ${this.getTeamFlag(latest.teams[1].name)}
                                <h4 class="text-slate-400 text-sm font-semibold uppercase">${latest.teams[1].name}</h4>
                            </div>
                            <div class="text-5xl font-black">${latest.teams[1].score}</div>
                            <div class="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-tight">Coach: ${latest.type === 'training' ? (latest.coach || '--') : (latest.teams[1].coach || '--')}</div>
                        </div>
                    </div>
                    
                    <div class="mt-8 flex justify-center">
                        <button onclick="State.toggleHeroExpand()" class="text-xs font-bold text-slate-500 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700">
                            ${this.isHeroExpanded ? 'Hide Lineups' : 'View Full Lineups'}
                            <svg class="w-4 h-4 transform ${this.isHeroExpanded ? 'rotate-180' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                        </button>
                    </div>
                </div>

                <div id="hero-lineups" class="${this.isHeroExpanded ? 'block' : 'hidden'} border-t border-slate-700 bg-slate-900/50 animate-in slide-in-from-top duration-300">
                    <div class="grid grid-cols-2 gap-0 divide-x divide-slate-700">
                        <div class="p-6 md:p-8">
                            <div class="space-y-2">
                                ${this.renderExpandedPlayers(latest.teams[0])}
                            </div>
                        </div>
                        <div class="p-6 md:p-8 text-right">
                            <div class="space-y-2">
                                ${this.renderExpandedPlayers(latest.teams[1])}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    isHeroExpanded: false,
    toggleHeroExpand() {
        this.isHeroExpanded = !this.isHeroExpanded;
        this.renderLatestMatch();
    },

    renderExpandedPlayers(team) {
        const isBlue = team.name.toLowerCase().includes('blue');
        const isOrange = team.name.toLowerCase().includes('orange');

        return team.players.map(p => {
            let highlights = '';
            const hasContribution = p.goals > 0 || p.assists > 0 || p.yellow > 0 || p.red > 0;

            if (hasContribution) {
                if (isBlue) {
                    highlights = `bg-blue-500/20 text-blue-400 border border-blue-500/30`;
                } else if (isOrange) {
                    highlights = `bg-orange-500/20 text-orange-400 border border-orange-500/30`;
                }
            }

            return `
                <div class="flex items-center gap-2 ${team.name.toLowerCase().includes('blue') ? '' : 'flex-row-reverse'}">
                    <div class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${highlights || 'text-slate-500'}">
                        ${p.name}
                        ${p.goals > 0 ? `<span class="ml-1 opacity-80" title="Goals">⚽${p.goals}</span>` : ''}
                        ${p.assists > 0 ? `<span class="ml-1 opacity-80" title="Assists">👟${p.assists}</span>` : ''}
                        ${p.ownGoals > 0 ? `<span class="ml-1 text-red-400" title="Own Goal">⚠️OG</span>` : ''}
                        <div class="flex gap-0.5 ml-1">
                            ${Array(p.yellow || 0).fill(0).map(() => `<span class="text-[10px]" title="Yellow Card">🟨</span>`).join('')}
                            ${Array(p.red || 0).fill(0).map(() => `<span class="text-[10px]" title="Red Card">🟥</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    getScorersList(team) {
        return team.players
            .filter(p => p.goals > 0)
            .map(p => `<div>${p.name} <span class="text-primary font-bold">(${p.goals})</span></div>`)
            .join('') || '<div class="opacity-30">No goals</div>';
    },

    getTeamFlag(teamName) {
        const color = teamName.toLowerCase().includes('orange') ? '#f97316' :
            teamName.toLowerCase().includes('blue') ? '#3b82f6' : '#94a3b8';
        return `
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="${color}">
                <path d="M5 21v-19h14l-2 5 2 5h-12v9h-2z"/>
            </svg>
        `;
    },

    renderStatsOverview() {
        const stats = Analytics.getPlayerStats(this.sessions, this.players);
        const leaders = Analytics.getLeaders(stats);

        const ts = document.getElementById('top-scorer');
        const ta = document.getElementById('top-assister');
        const tk = document.getElementById('top-attendance');

        if (ts) {
            ts.innerHTML = `
                <span class="text-3xl font-bold">${leaders.topScorer ? leaders.topScorer.goals : 0}</span>
                <div class="flex flex-col">
                    <span class="text-primary text-[10px] font-black uppercase leading-none">Goals</span>
                    <span class="text-slate-400 text-[10px] font-bold truncate max-w-[80px]">${leaders.topScorer && leaders.topScorer.goals > 0 ? leaders.topScorer.name : '--'}</span>
                </div>
            `;
        }
        if (ta) {
            ta.innerHTML = `
                <span class="text-3xl font-bold">${leaders.topAssister ? leaders.topAssister.assists : 0}</span>
                <div class="flex flex-col">
                    <span class="text-secondary text-[10px] font-black uppercase leading-none">Assists</span>
                    <span class="text-slate-400 text-[10px] font-bold truncate max-w-[80px]">${leaders.topAssister && leaders.topAssister.assists > 0 ? leaders.topAssister.name : '--'}</span>
                </div>
            `;
        }
        if (tk) {
            tk.innerHTML = `
                <span class="text-3xl font-bold">${leaders.appearanceKing ? leaders.appearanceKing.appearances : 0}</span>
                <div class="flex flex-col">
                    <span class="text-accent text-[10px] font-black uppercase leading-none">Sessions</span>
                    <span class="text-slate-400 text-[10px] font-bold truncate max-w-[80px]">${leaders.appearanceKing && leaders.appearanceKing.appearances > 0 ? leaders.appearanceKing.name : '--'}</span>
                </div>
            `;
        }
    },

    renderMatchList() {
        const container = document.getElementById('match-list');
        if (!container) return;

        if (this.sessions.length === 0) return;

        container.innerHTML = this.sessions.slice().reverse().map(s => `
            <div class="glass-card p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                <div class="flex items-center gap-4">
                    <div class="text-center bg-slate-800 rounded-lg p-2 min-w-[60px]">
                        <div class="text-xs text-slate-400 font-bold uppercase">${new Date(s.date).toLocaleDateString('en-GB', { month: 'short' })}</div>
                        <div class="text-xl font-black">${new Date(s.date).getDate()}</div>
                    </div>
                    <div>
                        <div class="font-bold flex items-center gap-2">
                            ${this.getTeamFlag(s.teams[0].name)}
                            ${s.teams[0].name} <span class="text-primary">${s.teams[0].score}</span> 
                            <span class="text-slate-600">vs</span> 
                            <span class="text-primary">${s.teams[1].score}</span> ${s.teams[1].name}
                            ${this.getTeamFlag(s.teams[1].name)}
                        </div>
                        <div class="text-xs text-slate-500 uppercase font-bold tracking-widest">${s.type}</div>
                    </div>
                </div>
                <div class="hidden sm:flex flex-col items-end">
                    <div class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1 opacity-50">Scorers</div>
                    <div class="flex -space-x-2">
                        ${s.teams.flatMap(t => t.players).filter(p => p.goals > 0).map(p => `
                            <div class="w-8 h-8 rounded-full bg-primary/20 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-primary relative group" title="${p.name} (${p.goals} goals)">
                                ${p.name.split(' ').map(n => n[0]).join('')}
                                ${p.goals > 1 ? `<span class="absolute -top-1 -right-1 bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">${p.goals}</span>` : ''}
                            </div>
                        `).join('') || '<div class="text-[10px] text-slate-700 italic">No score</div>'}
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderLeaderboard() {
        const container = document.getElementById('leaderboard');
        if (!container) return;

        const playerStats = Analytics.getPlayerStats(this.sessions, this.players);

        const sortKey = this.currentLeaderSort || 'totalPoints';
        const filterRole = (this.currentLeaderFilter || 'all').toLowerCase();

        let filtered = playerStats;
        if (filterRole !== 'all') {
            filtered = playerStats.filter(p => (p.position || '').toLowerCase().includes(filterRole));
        }

        const sorted = [...filtered].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 10);

        container.innerHTML = `
            <div class="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black uppercase tracking-widest text-slate-400">Rankings</span>
                    <select onchange="State.currentLeaderFilter = this.value; State.renderLeaderboard()" class="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-primary">
                        <option value="all" ${filterRole === 'all' ? 'selected' : ''}>All Roles</option>
                        <option value="forward" ${filterRole === 'forward' ? 'selected' : ''}>Forwards</option>
                        <option value="midfielder" ${filterRole === 'midfielder' ? 'selected' : ''}>Midfielders</option>
                        <option value="defender" ${filterRole === 'defender' ? 'selected' : ''}>Defenders</option>
                    </select>
                </div>
                <div class="flex gap-2">
                    <button onclick="State.currentLeaderSort = 'totalPoints'; State.renderLeaderboard()" class="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border ${sortKey === 'totalPoints' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'} transition-all">Points</button>
                    <button onclick="State.currentLeaderSort = 'goals'; State.renderLeaderboard()" class="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border ${sortKey === 'goals' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'} transition-all">Goals</button>
                    <button onclick="State.currentLeaderSort = 'assists'; State.renderLeaderboard()" class="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border ${sortKey === 'assists' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'} transition-all">Assists</button>
                </div>
            </div>
            <div class="divide-y divide-slate-700/30">
                ${sorted.map((p, i) => `
                    <div class="p-4 flex items-center justify-between group hover:bg-slate-800/30 transition-all">
                        <div class="flex items-center gap-4">
                            <span class="text-sm font-black ${i < 3 ? 'text-primary' : 'text-slate-600'}">${i + 1}</span>
                            <div>
                                <div class="font-bold text-slate-200 text-sm">${p.name}</div>
                                <div class="text-[9px] text-slate-500 font-bold uppercase">${p.position}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-base font-black text-white">${p[sortKey] || 0}</div>
                            <div class="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">${sortKey === 'totalPoints' ? 'Pts' : sortKey}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
            ${sorted.length === 0 ? '<div class="p-12 text-center text-slate-600 italic text-sm">No players found</div>' : ''}
        `;
    },

    renderDetailedStats() {
        const container = document.getElementById('detailed-stats-grid');
        if (!container) return;

        const playerStats = Analytics.getPlayerStats(this.sessions, this.players);
        const searchQuery = (this.playerSearchQuery || '').toLowerCase();
        const filterPos = (this.playerFilterPos || 'all').toLowerCase();

        let filtered = playerStats.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery);
            const matchesPos = filterPos === 'all' || (p.position || '').toLowerCase().includes(filterPos);
            return matchesSearch && matchesPos;
        });

        // Sort by points by default
        filtered.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));

        container.innerHTML = filtered.map(p => `
            <div class="glass-card p-6 rounded-[2rem] border border-slate-700 hover:border-primary/50 transition-all group">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h4 class="text-xl font-black text-white group-hover:text-primary transition-colors">${p.name}</h4>
                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${p.position}</span>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-black text-primary">${p.totalPoints}</div>
                        <div class="text-[8px] font-black uppercase tracking-tighter text-slate-600">Total Points</div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30">
                        <div class="text-primary font-black text-lg">${p.goals}</div>
                        <div class="text-[8px] font-black text-slate-500 uppercase">Goals ⚽</div>
                    </div>
                    <div class="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30">
                        <div class="text-secondary font-black text-lg">${p.assists}</div>
                        <div class="text-[8px] font-black text-slate-500 uppercase">Assists 👟</div>
                    </div>
                    <div class="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30">
                        <div class="text-white font-black text-lg">${p.appearances}</div>
                        <div class="text-[8px] font-black text-slate-500 uppercase">Apps 🏟️</div>
                    </div>
                    <div class="flex gap-1.5 items-center justify-center bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30">
                        <div class="flex gap-0.5">
                            <span class="${p.yellowCards > 0 ? 'opacity-100' : 'opacity-20'}">🟨</span>
                            <span class="${p.redCards > 0 ? 'opacity-100' : 'opacity-20'}">🟥</span>
                        </div>
                        <div class="text-[8px] font-black text-slate-500 uppercase">Cards</div>
                    </div>
                </div>

                <div class="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase pt-4 border-t border-slate-700/30">
                    <span>Performance</span>
                    <div class="flex gap-1 h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div class="bg-primary h-full" style="width: ${Math.min(100, (p.totalPoints / 50) * 100)}%"></div>
                    </div>
                </div>
            </div>
        `).join('');

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-20 text-center glass-card rounded-3xl">
                    <div class="text-4xl mb-4">🔍</div>
                    <p class="text-slate-500 italic">No players found matching your search.</p>
                </div>
            `;
        }
    },


    renderAdminSessions() {
        const container = document.getElementById('session-list');
        if (!container) return;

        if (this.sessions.length === 0) {
            container.innerHTML = `
                <div class="glass-card p-12 rounded-2xl flex flex-col items-center justify-center text-center opacity-50">
                    <div class="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                        <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    </div>
                    <p class="text-slate-400 italic">No sessions recorded yet. Start by adding your first match or training.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="space-y-4">
                ${this.sessions.slice().reverse().map(s => `
                    <div class="glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-800 group">
                        <div class="flex items-center gap-6">
                            <div class="text-xs font-bold text-slate-500">${new Date(s.date).toLocaleDateString()}</div>
                            <div class="font-bold text-slate-100">
                                ${s.teams[0].name} <span class="bg-primary/20 text-primary px-2 rounded">${s.teams[0].score}</span> 
                                <span class="px-2 text-slate-600">vs</span> 
                                <span class="bg-primary/20 text-primary px-2 rounded">${s.teams[1].score}</span> ${s.teams[1].name}
                            </div>
                            <span class="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase font-black">${s.type}</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="editSession(${s.id})" class="text-slate-400 hover:text-primary p-2 transition-colors" title="Edit Session">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="deleteSession(${s.id})" class="text-slate-500 hover:text-red-500 p-2 transition-colors" title="Delete Session">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
                
                ${this.sessions.length > 0 ? `
                    <div class="mt-8 pt-6 border-t border-slate-700/50 flex flex-wrap gap-3">
                        <span class="text-[10px] font-black text-slate-500 uppercase w-full">Quick Clear (Sessions)</span>
                        <button onclick="clearData('sessions', '7d')" class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all">Past 7 Days</button>
                        <button onclick="clearData('sessions', '30d')" class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all">Past 30 Days</button>
                        <button onclick="clearData('sessions', 'all')" class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all">Clear All</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
};

// --- Tab Navigation (Admin) ---
// --- Tab Navigation (Admin) ---
function switchTab(tab) {
    State.currentTab = tab;
    const title = document.getElementById('tab-title');
    if (!title) return;

    // Update sidebar buttons visual state
    document.querySelectorAll('aside button, .space-y-4 button').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(`'${tab}'`)) {
            btn.classList.add('border-primary');
            btn.classList.remove('border-slate-700');
            btn.querySelector('span')?.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('border-primary', 'border-secondary', 'border-accent');
            btn.classList.add('border-slate-700');
            btn.querySelector('span')?.classList.add('text-slate-400');
        }
    });

    if (tab === 'sessions') {
        title.innerText = 'Session Management';
        State.renderAdminSessions();
    } else if (tab === 'players') {
        title.innerText = 'Squad Management';
        renderPlayerManagement();
    } else if (tab === 'analytics') {
        title.innerText = 'Deep Analytics';
        renderDeepAnalytics();
    }
}

function renderDeepAnalytics() {
    const container = document.getElementById('session-list');
    const stats = Analytics.getPlayerStats(State.sessions, State.players)
        .sort((a, b) => b.totalPoints - a.totalPoints);

    container.innerHTML = `
        <div class="glass-card overflow-hidden rounded-2xl border border-slate-700">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-800 text-slate-400 uppercase text-[10px] font-black">
                        <tr>
                            <th class="px-4 py-3">Player</th>
                            <th class="px-4 py-3">Pos</th>
                            <th class="px-4 py-3">Apps</th>
                            <th class="px-4 py-3 text-primary">G</th>
                            <th class="px-4 py-3 text-secondary">A</th>
                            <th class="px-4 py-3 text-yellow-500">Y</th>
                            <th class="px-4 py-3 text-red-500">R</th>
                            <th class="px-4 py-3 font-bold text-white">Points</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-700/50">
                        ${stats.map(p => `
                            <tr class="hover:bg-slate-800/40 transition-colors">
                                <td class="px-4 py-3 font-bold text-slate-100">${p.name}</td>
                                <td class="px-4 py-3 text-slate-400 text-xs">${p.position}</td>
                                <td class="px-4 py-3">${p.appearances}</td>
                                <td class="px-4 py-3 text-primary font-bold">${p.goals}</td>
                                <td class="px-4 py-3 text-secondary font-bold">${p.assists}</td>
                                <td class="px-4 py-3 text-yellow-500">${p.yellowCards}</td>
                                <td class="px-4 py-3 text-red-500">${p.redCards}</td>
                                <td class="px-4 py-3 font-black text-white">${p.totalPoints}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${stats.length === 0 ? '<div class="p-12 text-center text-slate-500 italic">No player data to analyze</div>' : ''}
            </div>
        </div>
    `;
}

function renderPlayerManagement() {
    const container = document.getElementById('session-list');
    container.innerHTML = `
        <div class="glass-card p-6 rounded-2xl">
            <div class="flex justify-between items-center mb-6">
                 <h3 class="font-bold">Active Players</h3>
                 <button class="btn-secondary text-xs" onclick="showAddPlayerModal()">+ Add Player</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${State.players.map(p => `
                    <div class="p-4 bg-slate-800 rounded-xl flex items-center justify-between group hover:ring-1 hover:ring-primary/30 transition-all">
                        <div>
                            <div class="font-bold text-slate-100">${p.name}</div>
                            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">${p.position}</div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="editPlayer(${p.id})" class="text-slate-500 hover:text-primary p-2 transition-colors" title="Edit Player">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button onclick="deletePlayer(${p.id})" class="text-slate-500 hover:text-red-400 p-2 transition-colors" title="Remove Player">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-8 pt-6 border-t border-slate-700/50 flex flex-wrap gap-3">
                <span class="text-[10px] font-black text-slate-500 uppercase w-full">Quick Clear (Squad)</span>
                <button onclick="clearData('players', 'all')" class="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold hover:bg-red-500 hover:text-white transition-all">Clear All Players</button>
            </div>
        </div>
    `;
}

// --- Session Entry Implementation ---
let currentDraft = null;

function openNewSessionModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');

    currentDraft = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        type: 'match',
        coach: '',
        teams: [
            { name: 'Orange', coach: '', score: 0, players: [] },
            { name: 'Blue', coach: '', score: 0, players: [] }
        ]
    };

    renderSessionModal();
}

function renderSessionModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.innerHTML = `
        <div class="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[2rem] p-6 md:p-10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h2 class="text-3xl font-black uppercase tracking-tight text-white">Entry <span class="text-primary">Console</span></h2>
                    <p class="text-slate-500 text-sm font-medium mt-1">Record match details and player performance</p>
                </div>
                <button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">✕</button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div class="space-y-4">
                    <label class="block text-xs font-bold text-slate-500 uppercase">Session Type</label>
                    <div class="flex gap-2">
                        <button onclick="currentDraft.type='match'; renderSessionModal()" class="flex-1 py-3 rounded-xl border-2 ${currentDraft.type === 'match' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-800 text-slate-500'} font-bold">MATCH</button>
                        <button onclick="currentDraft.type='training'; renderSessionModal()" class="flex-1 py-3 rounded-xl border-2 ${currentDraft.type === 'training' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-800 text-slate-500'} font-bold">TRAINING</button>
                    </div>
                </div>
                <div class="space-y-4">
                    <label class="block text-xs font-bold text-slate-500 uppercase">Date</label>
                    <input type="date" value="${currentDraft.date}" onchange="currentDraft.date=this.value" class="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-bold">
                </div>
            </div>

            ${currentDraft.type === 'training' ? `
                <div class="mb-8 space-y-4">
                    <label class="block text-xs font-bold text-slate-500 uppercase tracking-widest">Training Lead Coach</label>
                    <input type="text" placeholder="Enter Coach Name" value="${currentDraft.coach}" onchange="currentDraft.coach=this.value" class="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-bold focus:border-primary outline-none transition-colors">
                </div>
            ` : ''}

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <!-- Team A -->
                ${renderTeamDraft(0)}
                <!-- Team B -->
                ${renderTeamDraft(1)}
            </div>

            <div class="mt-12 flex justify-end gap-4">
                <button onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button onclick="saveSession()" class="btn-primary px-12">Submit Data</button>
            </div>
        </div>
    `;
}

function renderTeamDraft(teamIdx) {
    const team = currentDraft.teams[teamIdx];
    return `
        <div class="glass-card p-5 rounded-3xl border-t-4 ${teamIdx === 0 ? 'border-primary' : 'border-secondary'}">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <input type="text" value="${team.name}" onchange="currentDraft.teams[${teamIdx}].name=this.value" class="bg-transparent text-xl font-black w-32 focus:outline-none block placeholder-slate-700">
                    ${currentDraft.type === 'match' ? `
                        <input type="text" placeholder="Coach Name" value="${team.coach || ''}" onchange="currentDraft.teams[${teamIdx}].coach=this.value" class="bg-transparent text-[10px] text-slate-500 font-bold uppercase tracking-widest focus:outline-none focus:text-primary transition-colors">
                    ` : ''}
                </div>
                <div class="text-4xl font-black text-white/20">${team.score}</div>
            </div>
            
            <div class="space-y-2 mb-2 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                ${State.players.map(p => {
        const activeP = team.players.find(ap => ap.name === p.name);
        return `
                        <div class="p-2 bg-slate-800/40 rounded-xl flex items-center gap-2 transition-all ${activeP ? 'ring-1 ring-primary/30 bg-slate-800/80' : 'opacity-30 hover:opacity-60'}">
                            <!-- Player Identity -->
                            <div class="flex items-center gap-2 flex-grow min-w-0 pr-2 border-r border-slate-700/30">
                                <button onclick="togglePlayerInDraft(${teamIdx}, '${p.name}')" class="shrink-0 w-6 h-6 rounded-lg border-2 border-slate-700 flex items-center justify-center transition-all ${activeP ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'hover:border-slate-500'}">
                                    ${activeP ? '✓' : ''}
                                </button>
                                <div class="min-w-0">
                                    <div class="font-bold text-xs text-slate-100 truncate">${p.name}</div>
                                    <div class="text-[8px] text-slate-500 font-bold uppercase truncate tracking-tighter">${p.position}</div>
                                </div>
                            </div>
                            
                            <!-- Stat Entry Controls -->
                            ${activeP ? `
                                <div class="flex items-center gap-4 shrink-0">
                                    <!-- Goals & Assists Group -->
                                    <div class="flex items-center gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-700/40">
                                        <div class="flex items-center gap-1.5 px-2 border-r border-slate-700/50">
                                            <button onclick="updateStat(${teamIdx}, '${p.name}', 'goals', -1)" class="w-5 h-5 rounded-md bg-slate-700 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center text-xs">-</button>
                                            <div class="text-center min-w-[16px]">
                                                <span class="text-xs font-black text-primary leading-none">${activeP.goals}</span>
                                                <div class="text-[7px] text-slate-500 font-bold uppercase -mt-0.5">G</div>
                                            </div>
                                            <button onclick="updateStat(${teamIdx}, '${p.name}', 'goals', 1)" class="w-5 h-5 rounded-md bg-slate-700 hover:bg-primary/20 hover:text-primary transition-colors flex items-center justify-center text-xs">+</button>
                                        </div>
                                        <div class="flex items-center gap-1.5 px-2">
                                            <button onclick="updateStat(${teamIdx}, '${p.name}', 'assists', -1)" class="w-5 h-5 rounded-md bg-slate-700 hover:bg-secondary/20 hover:text-secondary transition-colors flex items-center justify-center text-xs">-</button>
                                            <div class="text-center min-w-[16px]">
                                                <span class="text-xs font-black text-secondary leading-none">${activeP.assists}</span>
                                                <div class="text-[7px] text-slate-500 font-bold uppercase -mt-0.5">A</div>
                                            </div>
                                            <button onclick="updateStat(${teamIdx}, '${p.name}', 'assists', 1)" class="w-5 h-5 rounded-md bg-slate-700 hover:bg-secondary/20 hover:text-secondary transition-colors flex items-center justify-center text-xs">+</button>
                                        </div>
                                    </div>

                                    <!-- Discipline Group -->
                                    <div class="flex items-center gap-1.5">
                                        <button onclick="updateStat(${teamIdx}, '${p.name}', 'yellow', 1)" class="w-5 h-7 rounded-[3px] ${activeP.yellow ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20' : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'} flex items-center justify-center text-[10px] font-black uppercase transition-all">
                                            ${activeP.yellow || 'Y'}
                                        </button>
                                        <button onclick="updateStat(${teamIdx}, '${p.name}', 'red', 1)" class="w-5 h-7 rounded-[3px] ${activeP.red ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-red-600/10 text-red-500 border border-red-600/30'} flex items-center justify-center text-[10px] font-black uppercase transition-all">
                                            ${activeP.red || 'R'}
                                        </button>
                                        <button onclick="updateStat(${teamIdx}, '${p.name}', 'ownGoals', 1)" class="w-7 h-7 rounded-full ${activeP.ownGoals ? 'bg-red-500/20 text-red-400 border-red-500/50' : 'bg-slate-900 text-slate-600 border-slate-700'} border flex items-center justify-center text-[9px] font-black transition-all hover:border-red-500">
                                            ${activeP.ownGoals || 'OG'}
                                        </button>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
}

function togglePlayerInDraft(teamIdx, playerName) {
    const team = currentDraft.teams[teamIdx];
    const otherTeam = currentDraft.teams[1 - teamIdx];

    // Remove from other team if present
    otherTeam.players = otherTeam.players.filter(p => p.name !== playerName);

    const exists = team.players.findIndex(p => p.name === playerName);
    if (exists > -1) {
        team.players.splice(exists, 1);
    } else {
        team.players.push({ name: playerName, goals: 0, assists: 0, yellow: 0, red: 0, ownGoals: 0, role: 'starter' });
    }

    recalculateScore();
    renderSessionModal();
}

function updateStat(teamIdx, playerName, stat, delta) {
    const player = currentDraft.teams[teamIdx].players.find(p => p.name === playerName);
    if (player) {
        if (stat === 'yellow' || stat === 'red' || stat === 'ownGoals') {
            player[stat] = (player[stat] || 0) + delta;
            if (player[stat] > 2 && stat !== 'ownGoals') player[stat] = 0; // Cycle for cards
            if (player[stat] < 0) player[stat] = 0;
        } else {
            player[stat] = Math.max(0, player[stat] + delta);
        }
    }
    recalculateScore();
    renderSessionModal();
}

function recalculateScore() {
    const team0OGs = currentDraft.teams[0].players.reduce((sum, p) => sum + (p.ownGoals || 0), 0);
    const team1OGs = currentDraft.teams[1].players.reduce((sum, p) => sum + (p.ownGoals || 0), 0);

    currentDraft.teams[0].score = currentDraft.teams[0].players.reduce((sum, p) => sum + p.goals, 0) + team1OGs;
    currentDraft.teams[1].score = currentDraft.teams[1].players.reduce((sum, p) => sum + p.goals, 0) + team0OGs;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function saveSession() {
    const existingIdx = State.sessions.findIndex(s => s.id === currentDraft.id);
    if (existingIdx > -1) {
        State.sessions[existingIdx] = currentDraft;
    } else {
        State.sessions.push(currentDraft);
    }
    State.save();
    closeModal();
    State.render();
}

function editSession(id) {
    const session = State.sessions.find(s => s.id === id);
    if (session) {
        currentDraft = JSON.parse(JSON.stringify(session)); // Deep copy
        const overlay = document.getElementById('modal-overlay');
        overlay.classList.remove('hidden');
        renderSessionModal();
    }
}

function editPlayer(id) {
    const player = State.players.find(p => p.id === id);
    if (player) {
        const newName = prompt('Enter new player name:', player.name);
        if (newName === null) return;
        const newPos = prompt('Enter new position:', player.position);
        if (newPos === null) return;

        player.name = newName;
        player.position = newPos;
        State.save();
        State.render();
        renderPlayerManagement();
    }
}

function clearData(type, range) {
    const confirmMsg = range === 'all' ? `Are you sure you want to clear ALL ${type}?` : `Clear ${type} from the past ${range === '7d' ? '7 days' : '30 days'}?`;
    if (!confirm(confirmMsg)) return;

    if (type === 'sessions') {
        if (range === 'all') {
            State.sessions = [];
        } else {
            const days = range === '7d' ? 7 : 30;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            State.sessions = State.sessions.filter(s => new Date(s.date) < cutoff);
        }
    } else if (type === 'players') {
        if (range === 'all') {
            State.players = [];
            State.sessions = []; // Sessions require players
        }
    }

    State.save();
    State.render();
    if (type === 'players') renderPlayerManagement();
    if (type === 'sessions') State.renderAdminSessions();
}

function deleteSession(id) {
    if (confirm('Delete this session?')) {
        State.sessions = State.sessions.filter(s => s.id !== id);
        State.save();
        State.render();
    }
}

function deletePlayer(id) {
    if (confirm('Remove player from squad?')) {
        State.players = State.players.filter(p => p.id !== id);
        State.save();
        renderPlayerManagement();
    }
}

function showAddPlayerModal() {
    const name = prompt('Player Name:');
    const pos = prompt('Position (e.g. Forward):');
    if (name && pos) {
        State.players.push({ id: Date.now(), name, position: pos, active: true });
        State.save();
        renderPlayerManagement();
    }
}

function exportCSV() {
    const csv = Analytics.generateCSV(State.sessions);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `p4fc-export-${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
}

document.getElementById('export-csv')?.addEventListener('click', exportCSV);

// Initialize App
window.addEventListener('DOMContentLoaded', () => State.init());
