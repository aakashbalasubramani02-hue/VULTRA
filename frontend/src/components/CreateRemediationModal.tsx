import React, { useState } from 'react';
import { api } from '../api/client';
import { RemediationRecord, TriageItem } from '../types/api';
import {
  X,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Calendar,
  User,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CreateRemediationModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  item: TriageItem | null;
  onRemediationCreated: (record: RemediationRecord) => void;
}

const OWNER_SUGGESTIONS = [
  'Infrastructure Team',
  'Platform Security Team',
  'Application Engineering',
  'DevSecOps Team',
  'Database Operations',
];

export const CreateRemediationModal: React.FC<CreateRemediationModalProps> = ({
  isOpen,
  onClose,
  orgId,
  item,
  onRemediationCreated,
}) => {
  const [owner, setOwner] = useState('Infrastructure Team');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2 weeks default
    return d.toISOString().split('T')[0];
  });
  const [initialNote, setInitialNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsSubmitting(true);
    try {
      const record = await api.createRemediation(orgId, {
        cve_id: item.cve_id,
        asset_id: item.technology.asset_id || undefined,
        owner: owner.trim() || 'Security Team',
        due_date: dueDate || undefined,
        initial_note: initialNote.trim() || undefined,
      });

      onRemediationCreated(record);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create remediation record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-[#1E2530] pb-5">
            <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                Defensive Action Workflow
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">Initiate Remediation Record</h2>
            </div>
          </div>

          {/* Read-Only Deterministic Intelligence Summary */}
          <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#00E5FF]">{item.cve_id}</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30 font-bold">
                  {item.priority}
                </span>
                <span className="text-[#F5F7FA] font-bold">
                  {item.score.toFixed(1)} <span className="text-[#606D7A] font-normal">/100</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E2530] text-[11px]">
              <div>
                <span className="text-[#606D7A] block text-[9px] font-label-caps uppercase">
                  Target Asset
                </span>
                <span className="text-[#F5F7FA] font-bold truncate block">
                  {item.technology.asset_name || item.service || item.technology.product}
                </span>
                {item.technology.asset_id && (
                  <span className="text-[#00E5FF] text-[9px] block">[{item.technology.asset_id}]</span>
                )}
              </div>
              <div>
                <span className="text-[#606D7A] block text-[9px] font-label-caps uppercase">
                  Technology / Version
                </span>
                <span className="text-[#00daf3] font-bold truncate block">
                  {item.technology.product}
                </span>
                <span className="text-[#bac9cc] text-[9px] block">
                  {item.technology.version && item.technology.version !== 'unknown'
                    ? `v${item.technology.version}`
                    : 'Version unconstrained'}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
            {errorMessage && (
              <div className="p-3.5 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Owner */}
            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-[#606D7A] uppercase flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-[#00E5FF]" />
                <span>Assigned Remediation Owner / Team *</span>
              </label>
              <input
                type="text"
                required
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="e.g. Infrastructure Team"
                className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none"
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {OWNER_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setOwner(sug)}
                    className={`text-[10px] px-2 py-0.5 border transition-colors cursor-pointer ${
                      owner === sug
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                        : 'bg-[#0c0e12] border-[#1E2530] text-[#bac9cc] hover:border-[#3b494c]'
                    }`}
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Due Date */}
            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-[#606D7A] uppercase flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#FFAA00]" />
                <span>Target Remediation Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none cursor-pointer"
              />
            </div>

            {/* Initial Defensive Note */}
            <div className="space-y-2">
              <label className="text-[10px] font-label-caps text-[#606D7A] uppercase flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-[#00daf3]" />
                <span>Initial Operational Note (Optional)</span>
              </label>
              <textarea
                rows={3}
                value={initialNote}
                onChange={(e) => setInitialNote(e.target.value)}
                placeholder="e.g. Confirmed affected production instances. Upgrade scheduled during maintenance window."
                className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2530]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] text-xs font-label-caps uppercase font-bold tracking-wider transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold text-xs hover:bg-[#c3f5ff] transition-colors cursor-pointer uppercase tracking-widest disabled:opacity-40"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Initiate Remediation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
