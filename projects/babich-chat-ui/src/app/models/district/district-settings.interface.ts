/**
 * Настройки района (админская панель). Соответствует
 * DistrictSettingsDto на бэке (GET/PUT /api/districts/{id}/settings).
 */
export interface DistrictSettings {
  electionDurationHours: number;
  electionAliveWindowDays: number;
  electionQuorumPercent: number;
  electionMaxCandidates: number;
  recallDurationHours: number;
  recallAliveWindowDays: number;
  recallQuorumPercent: number;
}
