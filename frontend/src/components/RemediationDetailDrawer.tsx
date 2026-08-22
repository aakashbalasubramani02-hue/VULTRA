import React, { useState } from 'react';
import { api } from '../api/client';
import { RemediationRecord, RemediationStatus } from '../types/api';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Server,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RemediationDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  remediation: RemediationRecord | null;
  onRemediationUpdated: (record: RemediationRecord) => void;
  onOpenEvidence?: (cveId: string) => void;
}

const STATUS_STEPS: { id: RemediationStatus; label: string; color: string }[] = [
  { id: 'OPEN', label: 'Open', color: '#FF3B30' },
  { id: 'ACKNOWLEDGED', label: 'Acknowledged', color: '#FFAA00' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: '#00E5FF' },
  { id: 'MITIGATED', label: 'Mitigated', color: '#00daf3' },
  { id: 'RESOLVED', label: 'Resolved', color: '#00E676' },
  { id: 'RISK_ACCEPTED', label: 'Risk Accepted', color: '#606D7A' },
];

export const RemediationDetailDrawer: React.FC<RemediationDetailDrawerProps> = ({
  isOpen,
  onClose,
  orgId,
  remediation,
  onRemediationUpdated,
  onOpenEvidence,
}) => {
  const [newNote, setNewNote] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  // Verification on Resolve
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState('');

  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !remediation) return null;

  const handleStatusChange = async (targetStatus: RemediationStatus) => {
    if (targetStatus === 'RESOLVED') {
      setVerificationDetails('');
      setShowResolveModal(true);
      return;
    }

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await api.updateRemediation(orgId, remediation.remediation_id, {
        status: targetStatus,
      });
      onRemediationUpdated(updated);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update remediation status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await api.updateRemediation(orgId, remediation.remediation_id, {
        status: 'RESOLVED',
        verification_details: verificationDetails.trim() || 'Verified resolution by Security Team.',
      });
      onRemediationUpdated(updated);
      setShowResolveModal(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record resolution.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveOwner = async () => {
    if (!newOwner.trim()) {
      setIsEditingOwner(false);
      return;
    }
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await api.updateRemediation(orgId, remediation.remediation_id, {
        owner: newOwner.trim(),
      });
      onRemediationUpdated(updated);
      setIsEditingOwner(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update owner.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveDueDate = async () => {
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await api.updateRemediation(orgId, remediation.remediation_id, {
        due_date: newDueDate || undefined,
      });
      onRemediationUpdated(updated);
      setIsEditingDueDate(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update due date.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsUpdating(true);
    setErrorMessage(null);
    try {
      const updated = await api.addRemediationNote(orgId, remediation.remediation_id, {
        content: newNote.trim(),
        author: remediation.owner || 'Security Team',
      });
      onRemediationUpdated(updated);
      setNewNote('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add note.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-[#0c0e12]/75 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-2xl bg-[#111318] border-l border-[#3b494c] shadow-2xl flex flex-col justify-between"
          >
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-[#1E2530] flex items-center justify-between bg-[#11141B]">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2 py-0.5 border border-[#00E5FF]/30">
                    {remediation.remediation_id}
                  </span>
                  <span className="text-[10px] font-label-caps uppercase tracking-widest text-[#606D7A]">
                    {remediation.org_id}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#F5F7FA] font-mono flex items-center gap-2">
                  <span>{remediation.cve_id}</span>
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className="text-[9px] text-[#606D7A] font-label-caps block uppercase">
                    Risk Assessment
                  </span>
                  <span className="text-sm font-bold text-[#00E5FF]">
                    {remediation.score.toFixed(1)}{' '}
                    <span className="text-xs text-[#606D7A] font-normal">/100</span>
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7 font-mono text-xs">
              {errorMessage && (
                <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] flex items-center gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Status Workflow Ribbon */}
              <div className="space-y-2">
                <span className="text-[10px] font-label-caps text-[#606D7A] uppercase font-bold tracking-wider">
                  Remediation Lifecycle Stage
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                  {STATUS_STEPS.map((st) => {
                    const isActive = remediation.status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleStatusChange(st.id)}
                        className={`px-2 py-2 text-[10px] font-label-caps uppercase font-bold tracking-wider border transition-all text-center cursor-pointer ${
                          isActive
                            ? 'bg-[#00E5FF] text-[#0c0e12] border-[#00E5FF] shadow-md'
                            : 'bg-[#0c0e12] text-[#bac9cc] border-[#1E2530] hover:border-[#3b494c]'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Technical Asset Footprint (READ-ONLY) */}
              <div className="space-y-3 pt-4 border-t border-[#1E2530]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    <span>Matched Asset & Technical Footprint</span>
                  </span>
                  <span className="text-[9px] text-[#606D7A] uppercase">READ-ONLY RISK MODEL</span>
                </div>

                <div className="p-4 bg-[#0c0e12] border border-[#1E2530] grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#606D7A] text-[9px] font-label-caps block uppercase">
                      Asset Name
                    </span>
                    <span className="text-[#F5F7FA] font-bold truncate block">
                      {remediation.asset_name}
                    </span>
                    <span className="text-[#00E5FF] text-[9px] block">[{remediation.asset_id}]</span>
                  </div>
                  <div>
                    <span className="text-[#606D7A] text-[9px] font-label-caps block uppercase">
                      Product & Version
                    </span>
                    <span className="text-[#00daf3] font-bold truncate block">
                      {remediation.product}
                    </span>
                    <span className="text-[#bac9cc] text-[9px] block">
                      {remediation.installed_version && remediation.installed_version !== 'unknown'
                        ? `v${remediation.installed_version}`
                        : 'Version unconstrained'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#606D7A] text-[9px] font-label-caps block uppercase">
                      Environment & Exposure
                    </span>
                    <span className="text-[#F5F7FA] font-bold uppercase block">
                      {remediation.environment} • {remediation.exposure}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#606D7A] text-[9px] font-label-caps block uppercase">
                      Criticality Tier
                    </span>
                    <span className="text-[#FFAA00] font-bold uppercase block">
                      {remediation.importance}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ownership & Due Date */}
              <div className="space-y-3 pt-4 border-t border-[#1E2530]">
                <span className="text-[11px] font-label-caps text-[#FFAA00] uppercase font-bold tracking-wider">
                  Responsibility & Schedule
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Owner */}
                  <div className="p-3 bg-[#0c0e12] border border-[#1E2530] space-y-1.5">
                    <span className="text-[#606D7A] text-[9px] font-label-caps uppercase flex items-center justify-between">
                      <span>Assigned Owner</span>
                      {!isEditingOwner && (
                        <button
                          onClick={() => {
                            setNewOwner(remediation.owner);
                            setIsEditingOwner(true);
                          }}
                          className="text-[#00E5FF] hover:underline cursor-pointer text-[10px]"
                        >
                          Change
                        </button>
                      )}
                    </span>
                    {isEditingOwner ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={newOwner}
                          onChange={(e) => setNewOwner(e.target.value)}
                          className="w-full bg-[#111318] border border-[#3b494c] text-[#F5F7FA] px-2 py-1 outline-none text-xs"
                        />
                        <button
                          onClick={handleSaveOwner}
                          className="px-2 py-1 bg-[#00E5FF] text-[#0c0e12] font-bold cursor-pointer"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setIsEditingOwner(false)}
                          className="px-2 py-1 bg-[#191c20] text-[#bac9cc] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-[#F5F7FA]">{remediation.owner}</div>
                    )}
                  </div>

                  {/* Due Date */}
                  <div className="p-3 bg-[#0c0e12] border border-[#1E2530] space-y-1.5">
                    <span className="text-[#606D7A] text-[9px] font-label-caps uppercase flex items-center justify-between">
                      <span>Target Due Date</span>
                      {!isEditingDueDate && (
                        <button
                          onClick={() => {
                            setNewDueDate(remediation.due_date || '');
                            setIsEditingDueDate(true);
                          }}
                          className="text-[#00E5FF] hover:underline cursor-pointer text-[10px]"
                        >
                          Change
                        </button>
                      )}
                    </span>
                    {isEditingDueDate ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="date"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                          className="w-full bg-[#111318] border border-[#3b494c] text-[#F5F7FA] px-2 py-1 outline-none text-xs"
                        />
                        <button
                          onClick={handleSaveDueDate}
                          className="px-2 py-1 bg-[#00E5FF] text-[#0c0e12] font-bold cursor-pointer"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => setIsEditingDueDate(false)}
                          className="px-2 py-1 bg-[#191c20] text-[#bac9cc] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#F5F7FA]">
                          {remediation.due_date || 'No deadline set'}
                        </span>
                        {remediation.is_overdue && (
                          <span className="px-1.5 py-0.5 bg-[#FF3B30]/15 border border-[#FF3B30]/40 text-[#FF3B30] text-[9px] font-bold uppercase">
                            OVERDUE
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resolution Verification (if resolved) */}
              {remediation.verification_details && (
                <div className="p-4 bg-[#00E676]/10 border border-[#00E676]/30 space-y-1.5">
                  <div className="text-[10px] font-label-caps text-[#00E676] uppercase font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Resolution Verification Audit</span>
                  </div>
                  <p className="text-xs text-[#F5F7FA] leading-relaxed">
                    {remediation.verification_details}
                  </p>
                </div>
              )}

              {/* Defensive Notes Section */}
              <div className="space-y-3 pt-4 border-t border-[#1E2530]">
                <span className="text-[11px] font-label-caps text-[#00daf3] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Defensive Operational Notes ({remediation.notes.length})</span>
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {remediation.notes.length === 0 ? (
                    <div className="text-[11px] text-[#606D7A] italic">No defensive notes logged yet.</div>
                  ) : (
                    remediation.notes.map((note) => (
                      <div
                        key={note.note_id}
                        className="p-3 bg-[#0c0e12] border border-[#1E2530] space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#606D7A]">
                          <span className="text-[#00E5FF] font-bold">{note.author}</span>
                          <span>{new Date(note.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-[#F5F7FA] leading-relaxed">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Log operational update or patch schedule note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="flex-1 bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-1.5 outline-none text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isUpdating || !newNote.trim()}
                    className="px-4 py-1.5 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold uppercase text-[11px] hover:bg-[#c3f5ff] disabled:opacity-40 cursor-pointer"
                  >
                    Add Note
                  </button>
                </form>
              </div>

              {/* Activity History Audit Trail */}
              <div className="space-y-3 pt-4 border-t border-[#1E2530]">
                <span className="text-[11px] font-label-caps text-[#606D7A] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-[#00E5FF]" />
                  <span>Immutable Activity Audit Trail ({remediation.activity_log.length})</span>
                </span>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {remediation.activity_log.map((act) => (
                    <div
                      key={act.activity_id}
                      className="p-2.5 bg-[#0c0e12] border border-[#1E2530] flex items-start gap-2.5 text-[11px]"
                    >
                      <span className="px-1.5 py-0.5 bg-[#191c20] text-[#00E5FF] font-bold border border-[#3b494c] text-[9px] shrink-0">
                        {act.action}
                      </span>
                      <div className="flex-1 space-y-0.5">
                        <div className="text-[#F5F7FA]">{act.details}</div>
                        <div className="text-[9px] text-[#606D7A]">
                          {act.author} • {new Date(act.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[#1E2530] bg-[#11141B] flex items-center justify-between">
              {onOpenEvidence && (
                <button
                  onClick={() => onOpenEvidence(remediation.cve_id)}
                  className="flex items-center gap-1.5 text-xs text-[#00E5FF] hover:underline font-mono cursor-pointer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>View Authoritative Evidence</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps font-bold uppercase tracking-wider transition-colors cursor-pointer ml-auto"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </div>

        {/* Verification Modal on Resolve */}
        {showResolveModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md bg-[#111318] border border-[#3b494c] p-6 space-y-5 shadow-2xl font-mono text-xs"
            >
              <div className="flex items-center gap-3 border-b border-[#1E2530] pb-4">
                <CheckCircle2 className="h-5 w-5 text-[#00E676]" />
                <h3 className="text-base font-bold text-[#F5F7FA]">Record Remediation Resolution</h3>
              </div>

              <p className="text-[#bac9cc] leading-relaxed">
                Provide defensive verification evidence before marking this finding resolved:
              </p>

              <form onSubmit={handleConfirmResolve} className="space-y-4">
                <textarea
                  required
                  rows={3}
                  value={verificationDetails}
                  onChange={(e) => setVerificationDetails(e.target.value)}
                  placeholder="e.g. Patched to version 2.4.52 in production; SHA256 binary hash verified; regression tests passed."
                  className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E676] text-[#F5F7FA] p-3 outline-none resize-none"
                />

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-1.5 bg-[#191c20] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !verificationDetails.trim()}
                    className="px-5 py-1.5 bg-[#00E676] text-[#0c0e12] font-bold uppercase hover:bg-[#69f0ae] cursor-pointer disabled:opacity-40"
                  >
                    Confirm Resolution
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
