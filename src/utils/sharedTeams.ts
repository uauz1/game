const TEAMS_KEY = 'qaddha.shared-teams.v1';

export type SharedTeam = { name: string; color: string };

export function loadSharedTeams(): [SharedTeam, SharedTeam] | null {
  try {
    const value = JSON.parse(localStorage.getItem(TEAMS_KEY) ?? 'null');
    if (!Array.isArray(value) || value.length !== 2) return null;
    if (value.some(team => !team || typeof team.name !== 'string' || !team.name.trim() || typeof team.color !== 'string')) return null;
    if (value[0].color === value[1].color) return null;
    return value as [SharedTeam, SharedTeam];
  } catch {
    return null;
  }
}

export function saveSharedTeams(teams: SharedTeam[]) {
  try {
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams.slice(0, 2).map(team => ({ name: team.name.trim(), color: team.color }))));
  } catch {
    // Shared team preferences are optional.
  }
}
