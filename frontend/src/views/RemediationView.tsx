import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import {
  ProfileDetailResponse,
  RemediationRecord,
  RemediationStatus,
  RemediationSummary,
} from '../types/api';
import { RemediationDetailDrawer } from '../components/RemediationDetailDrawer';
import {
  ShieldCheck,
  Search,
  AlertTriangle,
  User,
  Calendar,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface RemediationViewProps {
  selectedProfileId: string;
  onNavigateToTriage?: () => void;
  onOpenEvidence?: (cveId: string) => void;
}

export const RemediationView: React.FC<RemediationViewProps> = ({
  selectedProfileId,
  onNavigateToTriage,
  onOpenEvidence,
}) => {
  const [profile, setProfile] = useState<ProfileDetailResponse | null>(null);
  const [remediations, setRemediations] = useState<RemediationRecord[]>([]);
  const [summary, setSummary] = useState<RemediationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assetFilter, setAssetFilter] = useState('ALL');

  // Drawer
  const [selectedRemediation, setSelectedRemediation] = useState<RemediationRecord | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchRemediations = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [profRes, listRes, sumRes] = await Promise.all([
        api.getProfileDetail(selectedProfileId),
        api.getRemediations(selectedProfileId),
        api.getRemediationSummary(selectedProfileId),
      ]);
      setProfile(profRes);
      setRemediations(listRes.remediations);
      setSummary(sumRes);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load remediation workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemediations();
  }, [selectedProfileId]);

  const handleRemediationUpdated = (updated: RemediationRecord) => {
    setRemediations((prev) =>
      prev.map((r) => (r.remediation_id === updated.remediation_id ? updated : r))
    );
    setSelectedRemediation(updated);
    api.getRemediationSummary(selectedProfileId).then(setSummary).catch(() => {});
  };

  const handleDeleteRemediation = async (remId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete remediation ${remId}?`)) {
      return;
    }
    try {
      await api.deleteRemediation(selectedProfileId, remId);
      setRemediations((prev) => prev.filter((r) => r.remediation_id !== remId));
      if (selectedRemediation?.remediation_id === remId) {
        setIsDrawerOpen(false);
        setSelectedRemediation(null);
      }
      api.getRemediationSummary(selectedProfileId).then(setSummary).catch(() => {});
    } catch (err: any) {
      alert(`Failed to delete remediation: ${err.message}`);
    }
  };

  // Filtered Remediations
  const filteredRemediations = useMemo(() => {
    return remediations.filter((rem) => {
      const matchesSearch =
        rem.cve_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rem.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rem.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rem.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rem.remediation_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        rem.status.toLowerCase() === statusFilter.toLowerCase().replace(' ', '_');

      const matchesPriority =
        priorityFilter === 'ALL' ||
        rem.priority.toLowerCase() === priorityFilter.toLowerCase();

      const matchesAsset =
        assetFilter === 'ALL' ||
        rem.asset_id.toLowerCase() === assetFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesPriority && matchesAsset;
    });
  }, [remediations, searchTerm, statusFilter, priorityFilter, assetFilter]);

  const uniqueAssets = useMemo(() => {
    const map = new Map<string, string>();
    remediations.forEach((r) => {
      map.set(r.asset_id, r.asset_name);
    });
    return Array.from(map.entries());
  }, [remediations]);

  const getStatusBadge = (status: RemediationStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/40';
      case 'ACKNOWLEDGED':
        return 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/40';
      case 'IN_PROGRESS':
        return 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/40';
      case 'MITIGATED':
        return 'bg-[#00daf3]/10 text-[#00daf3] border-[#00daf3]/40';
      case 'RESOLVED':
        return 'bg-[#00E676]/10 text-[#00E676] border-[#00E676]/40';
      case 'RISK_ACCEPTED':
        return 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]';
      default:
        return 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#00E5FF] font-mono text-sm">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>SYNCHRONIZING REMEDIATION WORKSPACE & AUDIT RECORDS...</span>
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
              {profile?.sector || 'Enterprise Environment'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-[#F5F7FA] tracking-tight">
            Remediation Workspace
          </h1>
          <p className="text-xs text-[#bac9cc] font-mono max-w-2xl">
            Track defensive mitigation workflows, assign team responsibilities, establish target SLA
            deadlines, and record verification evidence for deterministic findings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToTriage && (
            <button
              onClick={onNavigateToTriage}
              className="px-4 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to Triage Priorities
            </button>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#606D7A] uppercase">Total Actions</div>
          <div className="text-2xl font-bold text-[#F5F7FA] mt-1">{summary?.total || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#FF3B30] uppercase font-bold">Open</div>
          <div className="text-2xl font-bold text-[#FF3B30] mt-1">{summary?.open || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#00E5FF] uppercase font-bold">
            In Progress
          </div>
          <div className="text-2xl font-bold text-[#00E5FF] mt-1">{summary?.in_progress || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#00daf3] uppercase font-bold">
            Mitigated
          </div>
          <div className="text-2xl font-bold text-[#00daf3] mt-1">{summary?.mitigated || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#00E676] uppercase font-bold">
            Resolved
          </div>
          <div className="text-2xl font-bold text-[#00E676] mt-1">{summary?.resolved || 0}</div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4">
          <div className="text-[10px] font-label-caps text-[#FF3B30] uppercase font-bold">
            Overdue SLA
          </div>
          <div className="text-2xl font-bold text-[#FF3B30] mt-1">{summary?.overdue || 0}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111318] border border-[#1E2530] p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#606D7A]" />
          <input
            type="text"
            placeholder="Search CVE, asset, owner, product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] pl-9 pr-3 py-1.5 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="MITIGATED">Mitigated</option>
              <option value="RESOLVED">Resolved</option>
              <option value="RISK_ACCEPTED">Risk Accepted</option>
            </select>
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Asset */}
          {uniqueAssets.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Asset:</span>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
              >
                <option value="ALL">All Assets</option>
                {uniqueAssets.map(([id, name]) => (
                  <option key={id} value={id}>
                    {id} — {name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Remediation Queue Grid */}
      {filteredRemediations.length === 0 ? (
        <div className="bg-[#111318] border border-[#1E2530] p-12 text-center space-y-3">
          <ShieldCheck className="h-8 w-8 text-[#606D7A] mx-auto" />
          <div className="text-sm font-mono text-[#F5F7FA] font-bold">
            No active remediation items in queue
          </div>
          <p className="text-xs font-mono text-[#606D7A]">
            Initiate a defensive remediation record directly from the Top 5 Priorities view.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRemediations.map((rem) => {
            return (
              <motion.div
                key={rem.remediation_id}
                layout
                onClick={() => {
                  setSelectedRemediation(rem);
                  setIsDrawerOpen(true);
                }}
                className="bg-[#111318] border border-[#1E2530] hover:border-[#00E5FF] transition-all p-5 flex flex-col justify-between space-y-4 shadow-lg group relative cursor-pointer"
              >
                {/* Top: ID, CVE, Priority & Delete */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 border border-[#00E5FF]/30">
                      {rem.remediation_id}
                    </span>
                    <span className="font-mono text-xs font-bold text-[#F5F7FA]">
                      {rem.cve_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 uppercase border ${
                        rem.priority === 'URGENT'
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/30'
                          : rem.priority === 'HIGH'
                          ? 'bg-[#FF9500]/10 text-[#FF9500] border-[#FF9500]/30'
                          : 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]'
                      }`}
                    >
                      {rem.priority} ({rem.score.toFixed(1)})
                    </span>
                    <button
                      onClick={(e) => handleDeleteRemediation(rem.remediation_id, e)}
                      title="Delete Remediation"
                      className="p-1 text-[#606D7A] hover:text-[#FF3B30] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target Asset Footprint */}
                <div className="space-y-1 font-mono text-xs">
                  <h3 className="text-sm font-bold text-[#F5F7FA] group-hover:text-[#00E5FF] transition-colors">
                    {rem.asset_name}
                  </h3>
                  <div className="text-[#00daf3] text-[11px]">{rem.product}</div>
                  <div className="text-[#606D7A] text-[10px] uppercase">
                    {rem.environment} • {rem.exposure}
                  </div>
                </div>

                {/* Status & Overdue Tag */}
                <div className="pt-3 border-t border-[#1E2530] flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-label-caps uppercase px-2.5 py-0.5 border font-bold ${getStatusBadge(
                        rem.status
                      )}`}
                    >
                      {rem.status.replace('_', ' ')}
                    </span>
                    {rem.is_overdue && (
                      <span className="px-1.5 py-0.5 bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] text-[9px] font-bold uppercase">
                        OVERDUE
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-[#00E5FF] font-label-caps uppercase group-hover:underline">
                    Manage →
                  </span>
                </div>

                {/* Owner & Due Date */}
                <div className="pt-2 border-t border-[#1E2530] grid grid-cols-2 gap-2 text-[11px] font-mono text-[#bac9cc]">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3 w-3 text-[#606D7A] shrink-0" />
                    <span className="truncate">{rem.owner}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="h-3 w-3 text-[#606D7A] shrink-0" />
                    <span>{rem.due_date || 'No SLA'}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Remediation Detail Drawer */}
      <RemediationDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedRemediation(null);
        }}
        orgId={selectedProfileId}
        remediation={selectedRemediation}
        onRemediationUpdated={handleRemediationUpdated}
        onOpenEvidence={onOpenEvidence}
      />
    </div>
  );
};
