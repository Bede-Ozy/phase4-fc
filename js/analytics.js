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
                cleanSheets: 0,
                attendancePoints: 0,
                captainBonus: 0,
                attendedDates: [],
                breakdown: { attendance: 0, goals: 0, assists: 0, cleanSheets: 0, deductions: 0, captainBonus: 0 }
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
                        stats[name].attendedDates.push({ date: session.date, role: playerData.role || 'starter' });

                        let sessionPoints = 0;

                        // Appearance Points (Starter vs Sub)
                        const role = playerData.role || 'starter';
                        let weight = 0;
                        if (role === 'sub') {
                            weight = 0.5;
                            stats[name].subs += 1;
                        } else {
                            weight = 1.0;
                            stats[name].starts += 1;
                        }

                        stats[name].attendancePoints += weight;
                        sessionPoints += weight;
                        stats[name].breakdown.attendance += weight;

                        const pos = (stats[name].position || '').toLowerCase();
                        const goals = playerData.goals || 0;
                        const assists = playerData.assists || 0;
                        const yellow = playerData.yellow || 0;
                        const red = playerData.red || 0;

                        let gp = 0;
                        let ap = 0;
                        // Goal points by position
                        if (pos.includes('goal') || pos === 'gk') {
                            gp = (goals * 5);
                            ap = (assists * 3);
                        } else if (pos.includes('defender')) {
                            gp = (goals * 3);
                            ap = (assists * 3);
                        } else if (pos.includes('midfield')) {
                            gp = (goals * 2);
                            ap = (assists * 2);
                        } else { // Forwards
                            gp = (goals * 2);
                            ap = (assists * 1);
                        }
                        sessionPoints += gp + ap;
                        stats[name].breakdown.goals += gp;
                        stats[name].breakdown.assists += ap;

                        // Clean Sheet Bonus (Team conceded 0 goals)
                        // Verify clean sheet by checking the OPPONENT's score
                        // The 'team' object has 'score'. We need to find the OTHER team in the session.
                        const opponent = session.teams.find(t => t.name !== team.name);
                        let cs = 0;
                        if (opponent && opponent.score === 0) {
                            stats[name].cleanSheets += 1;
                            if (pos.includes('goal') || pos === 'gk') {
                                cs = 4;
                            } else if (pos.includes('defender')) {
                                cs = 3;
                            } else {
                                cs = 2;
                            }
                        }
                        sessionPoints += cs;
                        stats[name].breakdown.cleanSheets += cs;

                        // Card deductions
                        let deductions = (yellow * 2) + (red * 4);
                        sessionPoints -= deductions;
                        stats[name].breakdown.deductions -= deductions;

                        // Captain Win Bonus
                        if (playerData.isCaptain) {
                            const opponent = session.teams.find(t => t.name !== team.name);
                            if (opponent && team.score > opponent.score) {
                                sessionPoints += 1;
                                stats[name].captainBonus += 1;
                                stats[name].breakdown.captainBonus += 1;
                            }
                        }

                        stats[name].totalPoints += sessionPoints;
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
            appearanceKing: [...playerStats].sort((a, b) => (b.attendancePoints - a.attendancePoints) || (b.appearances - a.appearances))[0]
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

window.Analytics = Analytics;
export default Analytics;
