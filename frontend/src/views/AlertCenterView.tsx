import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  AlertSummary,
  ProfileDetailResponse,
  SmartAlert,
  WhyRiskChangedResponse,
} from '../types/api';
import { AlertDetailDrawer } from '../components/AlertDetailDrawer';
import {
  X,
  Activity,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Server,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AlertCenterViewProps {
  selectedProfileId: string;
  onNavigateToTriage?: () => void;
  onOpenEvidence?: (cveId: string) => void;
  onInitiateRemediation?: (cveId: string, assetId?: string | null) => void;
}

export const AlertCenterView: React.FC<AlertCenterViewProps> = ({
  selectedProfileId,
  onOpenEvidence,
  onInitiateRemediation,
}) => {
  const [profile, setProfile] = useState<ProfileDetailResponse | null>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingRisk, setIsCheckingRisk] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Detail Drawer
  const [selectedAlert, setSelectedAlert] = useState<SmartAlert | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Why Did My Risk Change Modal
  const [whyRiskData, setWhyRiskData] = useState<WhyRiskChangedResponse | null>(null);
  const [showWhyModal, setShowWhyModal] = useState(false);

  const fetchAlertsData = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [profRes, listRes, sumRes] = await Promise.all([
        api.getProfileDetail(selectedProfileId),
        api.getAlerts(selectedProfileId),
        api.getAlertSummary(selectedProfileId),
      ]);
      setProfile(profRes);
      setAlerts(listRes.alerts);
      setSummary(sumRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load alert center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [selectedProfileId]);

  const handleRunRiskCheck = async () => {
    setIsCheckingRisk(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await api.runRiskCheck(selectedProfileId);
      setSuccessMessage(res.message);
      await fetchAlertsData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Risk check evaluation failed.');
    } finally {
      setIsCheckingRisk(false);
    }
  };

  const handleOpenWhyModal = async () => {
    try {
      const data = await api.getWhyRiskChanged(selectedProfileId);
      setWhyRiskData(data);
      setShowWhyModal(true);
    } catch (err: any) {
      alert(`Failed to load executive risk drivers: ${err.message}`);
    }
  };

  const handleAlertUpdated = (updated: SmartAlert) => {
    setAlerts((prev) => prev.map((a) => (a.alert_id === updated.alert_id ? updated : a)));
    setSelectedAlert(updated);
    api.getAlertSummary(selectedProfileId).then(setSummary).catch(() => {});
  };

  const handleAlertDismissed = (alertId: string) => {
    setAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
    if (selectedAlert?.alert_id === alertId) {
      setIsDrawerOpen(false);
      setSelectedAlert(null);
    }
    api.getAlertSummary(selectedProfileId).then(setSummary).catch(() => {});
  };

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (unreadOnly && a.is_read) return false;
      if (severityFilter !== 'ALL' && a.severity.toUpperCase() !== severityFilter.toUpperCase()) {
        return false;
      }
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const text = `${a.alert_id} ${a.title} ${a.cve_id || ''} ${a.product || ''} ${a.asset_name || ''} ${a.what_changed}`.toLowerCase();
        if (!text.includes(s)) return false;
      }
      return true;
    });
  }, [alerts, unreadOnly, severityFilter, searchTerm]);

  const getSeverityBadge = (sev: string) => {
    switch (sev.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-[#FF3B30]/15 text-[#FF3B30] border-[#FF3B30]/40';
      case 'HIGH':
        return 'bg-[#FF9500]/15 text-[#FF9500] border-[#FF9500]/40';
      case 'MEDIUM':
        return 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40';
      case 'INFO':
      default:
        return 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#00E5FF] font-mono text-sm">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>SYNCHRONIZING CONTINUOUS RISK WATCH & ALERT STREAMS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="bg-[#111318] border-l-4 border-l-[#00E5FF] border border-[#1E2530] p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2 py-0.5 border border-[#00E5FF]/20">
              {profile?.profile_id || selectedProfileId}
            </span>
            <span className="text-[10px] font-label-caps uppercase tracking-widest text-[#606D7A]">
              Continuous Threat Detection
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
            Continuous Risk Watch & Smart Alerts
          </h1>
          <p className="text-xs text-[#bac9cc] font-mono max-w-2xl">
            Detect meaningful vulnerability movements, new weaponisation signals, and perimeter
            context escalations between analysis snapshots without vulnerability noise.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleOpenWhyModal}
            className="px-4 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#00daf3]/40 text-[#00daf3] text-xs font-label-caps font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Why Did My Risk Change?</span>
          </button>

          <button
            onClick={handleRunRiskCheck}
            disabled={isCheckingRisk}
            className="px-5 py-2 bg-[#00E5FF] text-[#0c0e12] hover:bg-[#c3f5ff] text-xs font-label-caps font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 disabled:opacity-40"
          >
            {isCheckingRisk ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running Risk Check...</span>
              </>
            ) : (
              <>
                <Activity className="h-3.5 w-3.5" />
                <span>Run Risk Check</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success / Error Messages */}
      {successMessage && (
        <div className="p-4 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] text-xs font-mono flex items-center gap-3">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#606D7A] uppercase">Active Alerts</div>
          <div className="text-2xl font-bold text-[#F5F7FA] mt-1">{summary?.total || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#00E5FF] uppercase font-bold">Unread</div>
          <div className="text-2xl font-bold text-[#00E5FF] mt-1">{summary?.unread || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#FF3B30] uppercase font-bold">
            Critical
          </div>
          <div className="text-2xl font-bold text-[#FF3B30] mt-1">{summary?.critical || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#FF9500] uppercase font-bold">High</div>
          <div className="text-2xl font-bold text-[#FF9500] mt-1">{summary?.high || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#00daf3] uppercase font-bold">
            Medium
          </div>
          <div className="text-2xl font-bold text-[#00daf3] mt-1">{summary?.medium || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#bac9cc] uppercase font-bold">Info</div>
          <div className="text-2xl font-bold text-[#bac9cc] mt-1">{summary?.info || 0}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111318] border border-[#1E2530] p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#606D7A]" />
          <input
            type="text"
            placeholder="Search alerts, CVEs, products, assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] pl-9 pr-3 py-1.5 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          {/* Unread Toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-[#bac9cc]">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded bg-[#0c0e12] border-[#3b494c] text-[#00E5FF] focus:ring-0 cursor-pointer"
            />
            <span>Unread Only</span>
          </label>
        </div>
      </div>

      {/* Alert Queue Cards */}
      {filteredAlerts.length === 0 ? (
        <div className="bg-[#111318] border border-[#1E2530] p-12 text-center space-y-3">
          <CheckCircle2 className="h-8 w-8 text-[#00E676] mx-auto" />
          <div className="text-sm font-mono text-[#F5F7FA] font-bold">
            No active risk changes requiring attention
          </div>
          <p className="text-xs font-mono text-[#606D7A]">
            Continuous risk watch is monitoring perimeter changes. Click "Run Risk Check" to evaluate.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            return (
              <motion.div
                key={alert.alert_id}
                layout
                onClick={() => {
                  setSelectedAlert(alert);
                  setIsDrawerOpen(true);
                }}
                className={`bg-[#111318] border p-5 transition-all cursor-pointer relative shadow-lg ${
                  !alert.is_read
                    ? 'border-l-4 border-l-[#00E5FF] border-[#3b494c] hover:border-[#00E5FF]'
                    : 'border-[#1E2530] hover:border-[#3b494c]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: ID, Severity, Title, Footprint */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 border border-[#00E5FF]/30">
                        {alert.alert_id}
                      </span>
                      <span
                        className={`font-bold px-2 py-0.5 uppercase border text-[10px] ${getSeverityBadge(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      {alert.cve_id && (
                        <span className="font-bold text-[#F5F7FA]">{alert.cve_id}</span>
                      )}
                      {alert.asset_name && (
                        <span className="text-[#606D7A] flex items-center gap-1">
                          • <Server className="h-3 w-3" /> {alert.asset_name}
                        </span>
                      )}
                      {!alert.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#F5F7FA] font-sans hover:text-[#00E5FF] transition-colors">
                      {alert.title}
                    </h3>

                    <p className="text-xs font-mono text-[#bac9cc] max-w-3xl">
                      {alert.what_changed}
                    </p>
                  </div>

                  {/* Right: State Delta & Actions */}
                  <div className="flex flex-col md:items-end justify-between gap-3 font-mono text-xs shrink-0">
                    <div className="p-2 bg-[#0c0e12] border border-[#1E2530] text-right">
                      <div className="text-[9px] font-label-caps text-[#606D7A] uppercase">
                        Transition
                      </div>
                      <div className="text-xs font-bold text-[#00E5FF] mt-0.5">
                        {alert.previous_state} → {alert.current_state}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#606D7A]">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(alert.created_at).toLocaleTimeString()}</span>
                      <span className="text-[#00E5FF] font-label-caps uppercase font-bold hover:underline ml-2">
                        Inspect →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Alert Detail Drawer */}
      <AlertDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedAlert(null);
        }}
        orgId={selectedProfileId}
        alert={selectedAlert}
        onAlertUpdated={handleAlertUpdated}
        onAlertDismissed={handleAlertDismissed}
        onOpenEvidence={onOpenEvidence}
        onInitiateRemediation={onInitiateRemediation}
      />

      {/* "Why Did My Risk Change?" Executive Modal */}
      {showWhyModal && whyRiskData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm font-sans">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8 space-y-6 font-mono text-xs"
          >
            {/* Close */}
            <button
              onClick={() => setShowWhyModal(false)}
              className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-[#1E2530] pb-4">
              <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                  Executive Risk Synthesis
                </div>
                <h2 className="text-xl font-bold text-[#F5F7FA] font-sans">Why Did My Risk Change?</h2>
              </div>
            </div>

            {/* Posture Shift Banner */}
            <div className="p-4 bg-[#0c0e12] border border-[#1E2530] flex items-center justify-between">
              <div>
                <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
                  Current Risk Posture
                </span>
                <span className="text-lg font-bold text-[#FF3B30] uppercase">
                  {whyRiskData.current_posture}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
                  Trajectory Direction
                </span>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 border ${
                    whyRiskData.posture_direction === 'INCREASING'
                      ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                      : whyRiskData.posture_direction === 'DECREASING'
                      ? 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/30'
                      : 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]'
                  }`}
                >
                  {whyRiskData.posture_direction}
                </span>
              </div>
            </div>

            {/* Main Causal Drivers */}
            <div className="space-y-2">
              <span className="text-[11px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider">
                Primary Causal Drivers
              </span>
              <div className="space-y-2">
                {whyRiskData.main_drivers.map((drv, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#0c0e12] border border-[#1E2530] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F5F7FA]">{drv.title}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 border ${getSeverityBadge(
                          drv.severity
                        )}`}
                      >
                        {drv.severity}
                      </span>
                    </div>
                    <p className="text-[#bac9cc] text-[11px] leading-relaxed">{drv.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Defensive Actions */}
            <div className="space-y-2 pt-2 border-t border-[#1E2530]">
              <span className="text-[11px] font-label-caps text-[#00E676] uppercase font-bold tracking-wider">
                Authoritative Recommended Actions
              </span>
              <div className="space-y-2">
                {whyRiskData.top_actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#00E676]/10 border border-[#00E676]/30 text-[#69f0ae] text-xs flex items-start gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-[#1E2530] flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-5 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps uppercase font-bold cursor-pointer"
              >
                Close Synthesis
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
