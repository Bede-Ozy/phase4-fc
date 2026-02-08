// Phase 4 FC - Core App Logic (Firebase Integrated)
import {
    db,
    auth,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    query,
    orderBy
} from './firebase-config.js';

// --- State Management ---
const State = {
    players: [],
    sessions: [],
    currentTab: 'sessions', // Default tab
    playerSearchQuery: '',
    playerFilterPos: 'all',
    matchSearchQuery: '',
    matchFilterType: 'all',
    user: null, // Auth user

    init() {
        this.loadFromLocal(); // Fast load for UI
        this.render(); // Initial render
        this.subscribeToData(); // Live sync
        this.initAuth(); // Auth listener
    },

    loadFromLocal() {
        try {
            const savedPlayers = localStorage.getItem('p4fc_players');
            const savedSessions = localStorage.getItem('p4fc_sessions');
            if (savedPlayers) this.players = JSON.parse(savedPlayers);
            if (savedSessions) this.sessions = JSON.parse(savedSessions);
        } catch (e) {
            console.error("Error loading local storage", e);
        }
    },

    saveLocal() {
        localStorage.setItem('p4fc_players', JSON.stringify(this.players));
        localStorage.setItem('p4fc_sessions', JSON.stringify(this.sessions));
    },

    subscribeToData() {
        // Subscribe to Players
        const qPlayers = query(collection(db, "players"), orderBy("name"));
        onSnapshot(qPlayers, (snapshot) => {
            this.players = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.saveLocal();
            this.render();
        });

        // Subscribe to Sessions
        const qSessions = query(collection(db, "sessions"));
        onSnapshot(qSessions, (snapshot) => {
            this.sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            this.saveLocal();
            this.render();
        });
    },

    initAuth() {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            const adminContent = document.getElementById('admin-content');
            const loginModal = document.getElementById('admin-login-modal');

            if (window.location.pathname.includes('admin.html')) {
                if (user) {
                    if (loginModal) loginModal.classList.add('hidden');
                    if (adminContent) adminContent.classList.remove('hidden');
                    this.renderAdminDashboard();
                } else {
                    if (loginModal) loginModal.classList.remove('hidden');
                    if (adminContent) adminContent.classList.add('hidden');
                }
            }
        });
    },

    render() {
        const path = window.location.pathname.toLowerCase();
        if (path.includes('stats.html')) {
            this.renderStatsPage();
        } else if (path.includes('matches.html')) {
            this.renderMatchHistoryPage();
        } else if (path.includes('admin.html')) {
            if (this.user) this.renderAdminDashboard();
        } else {
            this.renderPublicDashboard();
        }
    },

    renderStatsPage() { this.renderDetailedStats(); },
    renderAdminDashboard() { switchTab(this.currentTab); },

    renderPublicDashboard() {
        this.renderLatestMatch();
        this.renderStatsOverview();
        this.renderMatchList();
        this.renderLeaderboard();
    },

    // --- Render Methods ---
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
            container.innerHTML = `<div class="col-span-full py-20 text-center glass-card rounded-3xl"><div class="text-4xl mb-4">🏟️</div><p class="text-slate-500 italic">No matches found matching your criteria.</p></div>`;
            return;
        }

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        container.innerHTML = filtered.map(s => this.getSessionCardHTML(s)).join('');
    },

    getSessionCardHTML(s) {
        return `
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
                                <div class="flex items-center gap-3">${this.getTeamFlag(s.teams[0].name)}<h4 class="text-xl font-bold">${s.teams[0].name}</h4></div>
                                <div class="px-6 py-2 bg-slate-900 rounded-2xl border border-slate-700 flex items-center gap-4"><span class="text-3xl font-black text-primary">${s.teams[0].score}</span><span class="text-slate-600 font-bold text-sm">VS</span><span class="text-3xl font-black text-primary">${s.teams[1].score}</span></div>
                                <div class="flex items-center gap-3"><h4 class="text-xl font-bold text-right">${s.teams[1].name}</h4>${this.getTeamFlag(s.teams[1].name)}</div>
                            </div>
                        </div>
                        <div class="flex flex-col items-center md:items-end gap-3">
                            <span class="px-4 py-1.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/20">${s.type}</span>
                            <div class="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Coach: ${s.type === 'training' ? (s.coach || '--') : (s.teams[0].coach || '--')}</div>
                        </div>
                    </div>
                    <div class="mt-8 pt-6 border-t border-slate-700/50">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div><h5 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">${s.teams[0].name} Lineup & Contributions</h5><div class="flex flex-wrap gap-2">${this.renderExpandedPlayers(s.teams[0])}</div></div>
                            <div class="md:text-right"><h5 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">${s.teams[1].name} Lineup & Contributions</h5><div class="flex flex-wrap gap-2 md:justify-end">${this.renderExpandedPlayers(s.teams[1])}</div></div>
                        </div>
                    </div>
                </div>
            </div>`;
    },

    renderLatestMatch() {
        const container = document.getElementById('latest-match-container');
        if (!container) return;
        if (this.sessions.length === 0) {
            container.innerHTML = `<div class="glass-card p-12 rounded-2xl text-center"><h2 class="text-xl text-slate-400">Welcome to Phase 4 FC</h2><p class="mt-2">No recent sessions recorded.</p></div>`;
            return;
        }
        const sorted = [...this.sessions].sort((a, b) => new Date(a.date) - new Date(b.date));
        const latest = sorted[sorted.length - 1];

        container.innerHTML = `
            <div class="glass-card rounded-3xl overflow-hidden relative border border-slate-700">
                <div class="p-8">
                    <div class="absolute top-0 right-0 p-4"><span class="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full uppercase tracking-widest">${latest.type}</span></div>
                    <div class="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div class="flex-1 text-center md:text-right">
                            <div class="flex items-center justify-center md:justify-end gap-2 mb-2">${this.getTeamFlag(latest.teams[0].name)}<h4 class="text-slate-400 text-sm font-semibold uppercase">${latest.teams[0].name}</h4></div>
                            <div class="text-5xl font-black">${latest.teams[0].score}</div>
                        </div>
                        <div class="flex flex-col items-center">
                            <div class="text-slate-500 font-bold text-sm mb-1">${new Date(latest.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</div>
                            <div class="h-12 w-px bg-slate-700"></div>
                            <div class="mt-2 text-slate-400 font-bold">VS</div>
                        </div>
                        <div class="flex-1 text-center md:text-left">
                            <div class="flex items-center justify-center md:justify-start gap-2 mb-2">${this.getTeamFlag(latest.teams[1].name)}<h4 class="text-slate-400 text-sm font-semibold uppercase">${latest.teams[1].name}</h4></div>
                            <div class="text-5xl font-black">${latest.teams[1].score}</div>
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
                        <div class="p-6 md:p-8"><div class="space-y-2">${this.renderExpandedPlayers(latest.teams[0])}</div></div>
                        <div class="p-6 md:p-8 text-right"><div class="space-y-2">${this.renderExpandedPlayers(latest.teams[1])}</div></div>
                    </div>
                </div>
            </div>`;
    },

    isHeroExpanded: false,
    toggleHeroExpand() { this.isHeroExpanded = !this.isHeroExpanded; this.renderLatestMatch(); },

    renderExpandedPlayers(team) {
        const sortedPlayers = [...team.players].sort((a, b) => (a.role === 'sub' ? 1 : 0) - (b.role === 'sub' ? 1 : 0));
        const isBlue = team.name.toLowerCase().includes('blue');
        const isOrange = team.name.toLowerCase().includes('orange');

        return sortedPlayers.map(p => {
            const hasContribution = p.goals > 0 || p.assists > 0 || p.yellow > 0 || p.red > 0;
            const isSub = p.role === 'sub';
            let highlights = '';
            if (hasContribution) {
                if (isBlue) highlights = `bg-blue-500/20 text-blue-400 border border-blue-500/30`;
                else if (isOrange) highlights = `bg-orange-500/20 text-orange-400 border border-orange-500/30`;
            }

            return `
                <div class="flex items-center gap-2 ${team.name.toLowerCase().includes('blue') ? '' : 'flex-row-reverse'}">
                    <div class="px-2 py-1 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1 ${highlights || 'text-slate-500'} ${isSub ? 'opacity-75' : ''}">
                        ${p.name}
                        ${isSub ? '<span class="text-xs" title="Substitute">🔄</span>' : ''}
                        ${p.goals > 0 ? `<span class="ml-1 opacity-80" title="Goals">⚽${p.goals}</span>` : ''}
                        ${p.assists > 0 ? `<span class="ml-1 opacity-80" title="Assists">👟${p.assists}</span>` : ''}
                        ${p.ownGoals > 0 ? `<span class="ml-1 text-red-400" title="Own Goal">⚠️OG</span>` : ''}
                        <div class="flex gap-0.5 ml-1">
                            ${Array(p.yellow || 0).fill(0).map(() => `<span class="text-[10px]" title="Yellow Card">🟨</span>`).join('')}
                            ${Array(p.red || 0).fill(0).map(() => `<span class="text-[10px]" title="Red Card">🟥</span>`).join('')}
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    getTeamFlag(teamName) {
        const color = teamName.toLowerCase().includes('orange') ? '#f97316' : teamName.toLowerCase().includes('blue') ? '#3b82f6' : '#94a3b8';
        return `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="${color}"><path d="M5 21v-19h14l-2 5 2 5h-12v9h-2z"/></svg>`;
    },

    renderStatsOverview() {
        if (!window.Analytics) return;
        const stats = Analytics.getPlayerStats(this.sessions, this.players);
        const leaders = Analytics.getLeaders(stats);

        const ts = document.getElementById('top-scorer');
        const ta = document.getElementById('top-assister');
        const tk = document.getElementById('top-attendance');

        if (ts) ts.innerHTML = `<span class="text-3xl font-bold">${leaders.topScorer ? leaders.topScorer.goals : 0}</span><div class="flex flex-col"><span class="text-primary text-[10px] font-black uppercase leading-none">Goals</span><span class="text-slate-400 text-[10px] font-bold truncate max-w-[80px]">${leaders.topScorer && leaders.topScorer.goals > 0 ? leaders.topScorer.name : '--'}</span></div>`;
        if (ta) ta.innerHTML = `<span class="text-3xl font-bold">${leaders.topAssister ? leaders.topAssister.assists : 0}</span><div class="flex flex-col"><span class="text-secondary text-[10px] font-black uppercase leading-none">Assists</span><span class="text-slate-400 text-[10px] font-bold truncate max-w-[80px]">${leaders.topAssister && leaders.topAssister.assists > 0 ? leaders.topAssister.name : '--'}</span></div>`;
        if (tk) tk.innerHTML = `<span class="text-3xl font-bold">${leaders.appearanceKing ? leaders.appearanceKing.appearances : 0}</span><div class="flex flex-col"><span class="text-accent text-[10px] font-black uppercase leading-none">Sessions</span><span class="text-slate-400 text-[10px] font-bold truncate max-w-[80px]">${leaders.appearanceKing && leaders.appearanceKing.appearances > 0 ? leaders.appearanceKing.name : '--'}</span></div>`;
    },

    renderMatchList() {
        const container = document.getElementById('match-list');
        if (!container || this.sessions.length === 0) return;
        const sorted = [...this.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        container.innerHTML = sorted.map(s => `
            <div class="glass-card p-4 rounded-xl flex items-center justify-between border border-transparent hover:border-slate-700 transition-all">
                <div class="flex items-center gap-4">
                    <div class="text-center bg-slate-800 rounded-lg p-2 min-w-[60px]">
                        <div class="text-xs text-slate-400 font-bold uppercase">${new Date(s.date).toLocaleDateString('en-GB', { month: 'short' })}</div>
                        <div class="text-xl font-black">${new Date(s.date).getDate()}</div>
                    </div>
                    <div>
                        <div class="font-bold flex items-center gap-2">${this.getTeamFlag(s.teams[0].name)}${s.teams[0].name} <span class="text-primary">${s.teams[0].score}</span> <span class="text-slate-600">vs</span> <span class="text-primary">${s.teams[1].score}</span> ${s.teams[1].name}${this.getTeamFlag(s.teams[1].name)}</div>
                        <div class="text-xs text-slate-500 uppercase font-bold tracking-widest">${s.type}</div>
                    </div>
                </div>
            </div>`).join('');
    },

    renderLeaderboard() {
        const container = document.getElementById('leaderboard');
        if (!container || !window.Analytics) return;
        const playerStats = Analytics.getPlayerStats(this.sessions, this.players);
        const sortKey = this.currentLeaderSort || 'totalPoints';
        const filterRole = (this.currentLeaderFilter || 'all').toLowerCase();
        let filtered = playerStats;
        if (filterRole !== 'all') filtered = playerStats.filter(p => (p.position || '').toLowerCase().includes(filterRole));
        const sorted = [...filtered].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 10);

        container.innerHTML = `
            <div class="p-4 bg-slate-800/80 border-b border-slate-700 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <span class="text-xs font-black uppercase tracking-widest text-slate-400">Rankings</span>
                    <select onchange="State.currentLeaderFilter = this.value; State.renderLeaderboard()" class="bg-slate-900/50 border border-slate-700 rounded-lg px-2 py-1 text-[10px] font-bold text-white outline-none focus:border-primary">
                        <option value="all">All Roles</option><option value="forward">Forwards</option><option value="midfielder">Midfielders</option><option value="defender">Defenders</option>
                    </select>
                </div>
                <div class="flex gap-2">
                     <button onclick="State.currentLeaderSort = 'totalPoints'; State.renderLeaderboard()" class="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border ${sortKey === 'totalPoints' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'}">Points</button>
                     <button onclick="State.currentLeaderSort = 'goals'; State.renderLeaderboard()" class="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border ${sortKey === 'goals' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'}">Goals</button>
                     <button onclick="State.currentLeaderSort = 'assists'; State.renderLeaderboard()" class="flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase border ${sortKey === 'assists' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-700 text-slate-500'}">Assists</button>
                </div>
            </div>
            <div class="divide-y divide-slate-700/30">
                ${sorted.map((p, i) => `
                    <div class="p-4 flex items-center justify-between group hover:bg-slate-800/30 transition-all">
                        <div class="flex items-center gap-4"><span class="text-sm font-black ${i < 3 ? 'text-primary' : 'text-slate-600'}">${i + 1}</span><div><div class="font-bold text-slate-200 text-sm">${p.name}</div><div class="text-[9px] text-slate-500 font-bold uppercase">${p.position}</div></div></div>
                        <div class="text-right"><div class="text-base font-black text-white">${p[sortKey] || 0}</div><div class="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">${sortKey === 'totalPoints' ? 'Pts' : sortKey}</div></div>
                    </div>`).join('')}
            </div>`;
    },

    renderDetailedStats() {
        const container = document.getElementById('detailed-stats-grid');
        if (!container || !window.Analytics) return;
        const playerStats = Analytics.getPlayerStats(this.sessions, this.players);
        const searchQuery = (this.playerSearchQuery || '').toLowerCase();
        const filterPos = (this.playerFilterPos || 'all').toLowerCase();
        let filtered = playerStats.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery);
            const matchesPos = filterPos === 'all' || (p.position || '').toLowerCase().includes(filterPos);
            return matchesSearch && matchesPos;
        });
        filtered.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        container.innerHTML = filtered.map(p => `
            <div class="glass-card p-6 rounded-[2rem] border border-slate-700 hover:border-primary/50 transition-all group">
                <div class="flex justify-between items-start mb-6"><div><h4 class="text-xl font-black text-white group-hover:text-primary transition-colors">${p.name}</h4><span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${p.position}</span></div><div class="text-right"><div class="text-3xl font-black text-primary">${p.totalPoints}</div><div class="text-[8px] font-black uppercase tracking-tighter text-slate-600">Total Points</div></div></div>
                <div class="grid grid-cols-2 gap-3 mb-6">
                    <div class="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30"><div class="text-primary font-black text-lg">${p.goals}</div><div class="text-[8px] font-black text-slate-500 uppercase">Goals ⚽</div></div>
                    <div class="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30"><div class="text-secondary font-black text-lg">${p.assists}</div><div class="text-[8px] font-black text-slate-500 uppercase">Assists 👟</div></div>
                    <div class="bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30"><div class="text-white font-black text-lg">${p.appearances}</div><div class="text-[8px] font-black text-slate-500 uppercase">Apps 🏟️</div></div>
                    <div class="flex gap-1.5 items-center justify-center bg-slate-900/50 p-3 rounded-2xl border border-slate-700/30"><div class="flex gap-0.5"><span class="${p.yellowCards > 0 ? 'opacity-100' : 'opacity-20'}">🟨</span><span class="${p.redCards > 0 ? 'opacity-100' : 'opacity-20'}">🟥</span></div><div class="text-[8px] font-black text-slate-500 uppercase">Cards</div></div>
                </div>
            </div>`).join('');
    },

    renderAdminSessions() {
        const container = document.getElementById('session-list');
        if (!container) return;
        if (this.sessions.length === 0) {
            container.innerHTML = `<div class="glass-card p-12 rounded-2xl flex flex-col items-center justify-center text-center opacity-50"><p class="text-slate-400 italic">No sessions recorded yet.</p></div>`;
            return;
        }
        const sorted = [...this.sessions].sort((a, b) => new Date(b.date) - new Date(a.date));
        container.innerHTML = `<div class="space-y-4">${sorted.map(s => `
            <div class="glass-card p-4 rounded-2xl flex items-center justify-between border border-slate-800 group">
                <div class="flex items-center gap-6">
                    <div class="text-xs font-bold text-slate-500">${new Date(s.date).toLocaleDateString()}</div>
                    <div class="font-bold text-slate-100">${s.teams[0].name} <span class="bg-primary/20 text-primary px-2 rounded">${s.teams[0].score}</span> vs <span class="bg-primary/20 text-primary px-2 rounded">${s.teams[1].score}</span> ${s.teams[1].name}</div>
                    <span class="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-400 uppercase font-black">${s.type}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="editSession('${s.id}')" class="text-slate-400 hover:text-primary p-2 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button>
                    <button onclick="deleteSession('${s.id}')" class="text-slate-500 hover:text-red-500 p-2 transition-colors"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
            </div>`).join('')}</div>`;
    }
};

// --- Tab & Global Funcs ---
function switchTab(tab) {
    State.currentTab = tab;
    const title = document.getElementById('tab-title');
    if (!title) return;
    document.querySelectorAll('aside button, .space-y-4 button').forEach(btn => {
        if (btn.getAttribute('onclick')?.includes(`'${tab}'`)) {
            btn.classList.add('border-primary'); btn.classList.remove('border-slate-700');
            btn.querySelector('span')?.classList.remove('text-slate-400');
        } else {
            btn.classList.remove('border-primary', 'border-secondary', 'border-accent');
            btn.classList.add('border-slate-700');
            btn.querySelector('span')?.classList.add('text-slate-400');
        }
    });
    if (tab === 'sessions') { title.innerText = 'Session Management'; State.renderAdminSessions(); }
    else if (tab === 'players') { title.innerText = 'Squad Management'; renderPlayerManagement(); }
    else if (tab === 'analytics') { title.innerText = 'Deep Analytics'; renderDeepAnalytics(); }
}

function renderPlayerManagement() {
    const container = document.getElementById('session-list');
    container.innerHTML = `
        <div class="glass-card p-6 rounded-2xl">
            <div class="flex justify-between items-center mb-6"><h3 class="font-bold">Active Players</h3><button class="btn-secondary text-xs" onclick="showAddPlayerModal()">+ Add Player</button></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${State.players.map(p => `
                    <div class="p-4 bg-slate-800 rounded-xl flex items-center justify-between group hover:ring-1 hover:ring-primary/30 transition-all">
                        <div><div class="font-bold text-slate-100">${p.name}</div><div class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">${p.position}</div></div>
                        <div class="flex items-center gap-2"><button onclick="editPlayer('${p.id}')" class="text-slate-500 hover:text-primary p-2 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg></button><button onclick="deletePlayer('${p.id}')" class="text-slate-500 hover:text-red-400 p-2 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>
                    </div>`).join('')}
            </div>
        </div>`;
}

let currentDraft = null;
window.openNewSessionModal = async function () {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('hidden');
    currentDraft = { date: new Date().toISOString().split('T')[0], type: 'match', coach: '', teams: [{ name: 'Orange', coach: '', score: 0, players: [] }, { name: 'Blue', coach: '', score: 0, players: [] }] };
    renderSessionModal();
}

window.renderSessionModal = function () {
    const overlay = document.getElementById('modal-overlay');
    const existingContent = document.getElementById('session-modal-content');
    const isUpdate = !!existingContent;
    overlay.innerHTML = `
        <div id="session-modal-content" class="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[95vh] overflow-y-auto rounded-[2rem] p-6 md:p-10 shadow-2xl ${isUpdate ? '' : 'animate-in fade-in zoom-in duration-300'}">
            <div class="flex justify-between items-center mb-10"><div><h2 class="text-3xl font-black uppercase tracking-tight text-white">Entry <span class="text-primary">Console</span></h2><p class="text-slate-500 text-sm font-medium mt-1">Record match details</p></div><button onclick="closeModal()" class="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">✕</button></div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div class="space-y-4"><label class="block text-xs font-bold text-slate-500 uppercase">Session Type</label><div class="flex gap-2"><button onclick="currentDraft.type='match'; renderSessionModal()" class="flex-1 py-3 rounded-xl border-2 ${currentDraft.type === 'match' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-800 text-slate-500'} font-bold">MATCH</button><button onclick="currentDraft.type='training'; renderSessionModal()" class="flex-1 py-3 rounded-xl border-2 ${currentDraft.type === 'training' ? 'border-primary bg-primary/10 text-primary' : 'border-slate-800 text-slate-500'} font-bold">TRAINING</button></div></div>
                <div class="space-y-4"><label class="block text-xs font-bold text-slate-500 uppercase">Date</label><input type="date" value="${currentDraft.date}" onchange="currentDraft.date=this.value" class="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-bold"></div>
            </div>
            ${currentDraft.type === 'training' ? `<div class="mb-8 space-y-4"><label class="block text-xs font-bold text-slate-500 uppercase tracking-widest">Training Lead Coach</label><input type="text" placeholder="Enter Coach Name" value="${currentDraft.coach}" onchange="currentDraft.coach=this.value" class="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-3 text-white font-bold focus:border-primary outline-none transition-colors"></div>` : ''}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">${renderTeamDraft(0)}${renderTeamDraft(1)}</div>
            <div class="mt-12 flex justify-end gap-4"><button onclick="closeModal()" class="btn-secondary">Cancel</button><button onclick="saveSession()" class="btn-primary px-12">Submit Data</button></div>
        </div>`;
}

function renderTeamDraft(teamIndex) {
    const team = currentDraft.teams[teamIndex];
    return `
        <div class="glass-card p-6 rounded-2xl border border-slate-700">
            <div class="mb-6 flex justify-between items-center"><input type="text" value="${team.name}" onchange="currentDraft.teams[${teamIndex}].name=this.value" class="bg-transparent text-xl font-bold text-white border-b border-transparent focus:border-primary outline-none"><input type="number" value="${team.score}" onchange="currentDraft.teams[${teamIndex}].score=parseInt(this.value)" class="w-16 bg-slate-800 p-2 rounded-lg text-center font-black text-xl"></div>
            <div class="space-y-2 mb-4"><div class="flex gap-2"><select id="player-select-${teamIndex}" class="flex-1 bg-slate-800 rounded-lg p-2 text-sm text-white"><option value="">Select Player...</option>${State.players.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}</select><button onclick="addPlayerToTeam(${teamIndex})" class="bg-primary/20 text-primary px-4 rounded-lg font-bold">+</button></div></div>
            <div class="space-y-2">${team.players.map((p, idx) => `
                <div class="bg-slate-800 p-3 rounded-lg flex flex-wrap gap-2 items-center justify-between">
                    <span class="font-bold text-sm">${p.name}</span>
                    <div class="flex items-center gap-1">
                         <select onchange="updatePlayerStat(${teamIndex}, ${idx}, 'role', this.value)" class="bg-slate-900 text-xs p-1 rounded"><option value="starter" ${p.role === 'starter' ? 'selected' : ''}>Start</option><option value="sub" ${p.role === 'sub' ? 'selected' : ''}>Sub</option></select>
                        <input type="number" placeholder="G" value="${p.goals || ''}" onchange="updatePlayerStat(${teamIndex}, ${idx}, 'goals', parseInt(this.value)||0)" class="w-8 bg-slate-900 border border-slate-700 text-center text-xs p-1 rounded">
                        <input type="number" placeholder="A" value="${p.assists || ''}" onchange="updatePlayerStat(${teamIndex}, ${idx}, 'assists', parseInt(this.value)||0)" class="w-8 bg-slate-900 border border-slate-700 text-center text-xs p-1 rounded">
                        <button onclick="updatePlayerStat(${teamIndex}, ${idx}, 'yellow', (p.yellow||0)+1)" class="w-6 h-6 text-xs bg-yellow-500/20 text-yellow-500 rounded">Y</button>
                        <button onclick="removePlayerFromTeam(${teamIndex}, ${idx})" class="text-red-500 hover:text-red-400">×</button>
                    </div>
                </div>`).join('')}</div>
        </div>`;
}

window.addPlayerToTeam = function (teamIndex) {
    const name = document.getElementById(`player-select-${teamIndex}`).value;
    if (!name || currentDraft.teams.some(t => t.players.find(p => p.name === name))) { alert("Player invalid or already added"); return; }
    currentDraft.teams[teamIndex].players.push({ name, goals: 0, assists: 0, yellow: 0, red: 0, ownGoals: 0, role: 'starter' });
    renderSessionModal();
}
window.removePlayerFromTeam = function (teamIndex, idx) { currentDraft.teams[teamIndex].players.splice(idx, 1); renderSessionModal(); }
window.updatePlayerStat = function (ti, pi, s, v) { currentDraft.teams[ti].players[pi][s] = v; }
window.closeModal = function () { document.getElementById('modal-overlay').classList.add('hidden'); currentDraft = null; }
window.saveSession = async function () {
    if (!currentDraft) return;
    try {
        if (currentDraft.id) await updateDoc(doc(db, "sessions", currentDraft.id), currentDraft);
        else await addDoc(collection(db, "sessions"), currentDraft);
        closeModal();
    } catch (e) { console.error(e); alert("Failed to save session."); }
}
window.deleteSession = async function (id) { if (confirm('Delete session?')) { try { await deleteDoc(doc(db, "sessions", id)); } catch (e) { console.error(e); } } }
window.editSession = function (id) { const s = State.sessions.find(s => s.id === id); if (s) { currentDraft = JSON.parse(JSON.stringify(s)); openNewSessionModal(); } }
window.showAddPlayerModal = async function () {
    const name = prompt("Player Name:"); if (!name) return;
    const position = prompt("Position:"); if (!position) return;
    await addDoc(collection(db, "players"), { name, position, active: true });
}
window.deletePlayer = async function (id) { if (confirm("Delete player?")) await deleteDoc(doc(db, "players", id)); }
window.editPlayer = async function (id) {
    const p = State.players.find(p => p.id === id); if (!p) return;
    const name = prompt("Name:", p.name), position = prompt("Pos:", p.position);
    if (name && position) await updateDoc(doc(db, "players", id), { name, position });
}
window.clearData = async function (type) { alert("Bulk clear disabled."); }

window.login = async function (e) {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('admin-email').value, document.getElementById('admin-password').value);
        document.getElementById('login-error').classList.add('hidden');
    } catch (error) { document.getElementById('login-error').classList.remove('hidden'); }
}
window.logout = function () { signOut(auth); window.location.href = 'index.html'; }

function renderDeepAnalytics() {
    const c = document.getElementById('session-list');
    if (!window.Analytics) { c.innerHTML = "Analytics not loaded"; return; }
    const stats = Analytics.getPlayerStats(State.sessions, State.players).sort((a, b) => b.totalPoints - a.totalPoints);
    c.innerHTML = `<div class="glass-card overflow-hidden rounded-2xl border border-slate-700"><div class="overflow-x-auto"><table class="w-full text-left text-sm"><thead class="bg-slate-800 text-slate-400 uppercase text-[10px] font-black"><tr><th class="px-4 py-3">Player</th><th class="px-4 py-3">Pos</th><th class="px-4 py-3">Apps</th><th class="px-4 py-3 text-primary">G</th><th class="px-4 py-3 text-secondary">A</th><th class="px-4 py-3 font-bold text-white">Pts</th></tr></thead><tbody class="divide-y divide-slate-700/50">${stats.map(p => `<tr class="hover:bg-slate-800/40 transition-colors"><td class="px-4 py-3 font-bold text-slate-100">${p.name}</td><td class="px-4 py-3 text-slate-400 text-xs">${p.position}</td><td class="px-4 py-3">${p.appearances}</td><td class="px-4 py-3 text-primary font-bold">${p.goals}</td><td class="px-4 py-3 text-secondary font-bold">${p.assists}</td><td class="px-4 py-3 font-black text-white">${p.totalPoints}</td></tr>`).join('')}</tbody></table></div></div>`;
}

window.State = State; window.switchTab = switchTab;
State.init();
