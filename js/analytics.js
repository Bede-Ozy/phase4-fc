// Phase 4 FC - Analytics Logic

const Analytics = {

    // Calculates cumulative stats for all players
    getPlayerStats(sessions, players) {
        const stats = {};

        // Initialize stats for each player
        players.forEach(p => {
            stats[p.name] = {
                id: p.id,
                name: p.name,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0,
                ownGoals: 0,
                appearances: 0,
                totalPoints: 0,
                position: p.position || 'Midfielder',
                starts: 0,
                subs: 0,
                attendancePoints: 0
            };
        });

        // Process each session
        sessions.forEach(session => {
            session.teams.forEach(team => {
                team.players.forEach(playerData => {
                    const name = playerData.name;
                    if (stats[name]) {
                        stats[name].goals += playerData.goals || 0;
                        stats[name].assists += playerData.assists || 0;
                        stats[name].yellowCards += playerData.yellow || 0;
                        stats[name].redCards += playerData.red || 0;
                        stats[name].ownGoals += playerData.ownGoals || 0;
                        stats[name].appearances += 1;

                        let sessionPoints = 0;

                        // Appearance Points (Starter vs Sub)
                        const role = session.teams.flatMap(t => t.players).find(p => p.name === name)?.role || 'starter';
                        if (role === 'sub') {
                            sessionPoints += 0.5;
                        } else {
                            sessionPoints += 1.0;
                        }

                        const pos = (stats[name].position || '').toLowerCase();
                        const goals = playerData.goals || 0;
                        const assists = playerData.assists || 0;
                        const yellow = playerData.yellow || 0;
                        const red = playerData.red || 0;

                        // Goal points by position
                        if (pos.includes('goal') || pos === 'gk') {
                            sessionPoints += (goals * 5);
                            sessionPoints += (assists * 3);
                        } else if (pos.includes('defender')) {
                            sessionPoints += (goals * 3);
                            sessionPoints += (assists * 3);
                        } else if (pos.includes('midfield')) {
                            sessionPoints += (goals * 2);
                            sessionPoints += (assists * 2);
                        } else { // Forwards
                            sessionPoints += (goals * 2);
                            sessionPoints += (assists * 1);
                        }

                        // Clean Sheet Bonus (Team conceded 0 goals)
                        // Verify clean sheet by checking the OPPONENT's score
                        // The 'team' object has 'score'. We need to find the OTHER team in the session.
                        const opponent = session.teams.find(t => t.name !== team.name);
                        if (opponent && opponent.score === 0) {
                            if (pos.includes('goal') || pos === 'gk') {
                                sessionPoints += 4;
                            } else if (pos.includes('defender')) {
                                sessionPoints += 3;
                            } else {
                                sessionPoints += 2;
                            }
                        }

                        // Card deductions
                        sessionPoints -= (yellow * 2);
                        sessionPoints -= (red * 4);

                        stats[name].totalPoints += sessionPoints;

                        if (playerData.role === 'starter') stats[name].starts += 1;
                        if (playerData.role === 'sub') stats[name].subs += 1;
                    }
                });
            });
        });

        return Object.values(stats);
    },

    // Get top leaders for dashboard
    getLeaders(playerStats) {
        return {
            topPoints: [...playerStats].sort((a, b) => b.totalPoints - a.totalPoints)[0],
            topScorer: [...playerStats].sort((a, b) => b.goals - a.goals)[0],
            topAssister: [...playerStats].sort((a, b) => b.assists - a.assists)[0],
            appearanceKing: [...playerStats].sort((a, b) => b.appearances - a.appearances)[0]
        };
    },

    // Formats data for CSV export
    generateCSV(sessions) {
        let csv = 'Session ID,Date,Type,Team,Player Name,Position,Role,Goals,Assists,Yellow,Red,Own Goals,Points\n';

        sessions.forEach(s => {
            s.teams.forEach(t => {
                t.players.forEach(p => {
                    const stats = Analytics.getPlayerStats([s], [{ name: p.name, position: p.position }]);
                    const points = stats[0] ? stats[0].totalPoints : 0;
                    csv += `${s.id},${s.date},${s.type},${t.name},${p.name},${p.position || ''},${p.role},${p.goals},${p.assists},${p.yellow},${p.red},${p.ownGoals || 0},${points}\n`;
                });
            });
        });

        return csv;
    }
};
