import React, { useState } from 'react';
import { api } from '../api/client';
import { SmartAlert } from '../types/api';
import {
  X,
  AlertTriangle,
  Server,
  ShieldCheck,
  ExternalLink,
  EyeOff,
  Clock,
  Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AlertDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  alert: SmartAlert | null;
  onAlertUpdated: (alert: SmartAlert) => void;
  onAlertDismissed: (alertId: string) => void;
  onOpenEvidence?: (cveId: string) => void;
  onInitiateRemediation?: (cveId: string, assetId?: string | null) => void;
}

export const AlertDetailDrawer: React.FC<AlertDetailDrawerProps> = ({
  isOpen,
  onClose,
  orgId,
  alert,
  onAlertUpdated,
  onAlertDismissed,
  onOpenEvidence,
  onInitiateRemediation,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !alert) return null;

  const handleMarkRead = async () => {
    setIsProcessing(true);
    try {
      await api.markAlertRead(alert.alert_id, orgId);
      onAlertUpdated({ ...alert, is_read: true });
    } catch (err: any) {
      console.error('Failed to mark alert as read', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await api.dismissAlert(alert.alert_id, orgId);
      onAlertDismissed(alert.alert_id);
      onClose();
    } catch (err: any) {
      console.error('Failed to dismiss alert', err);
    } finally {
      setIsProcessing(false);
    }
  };

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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-[#0c0e12]/75 backdrop-blur-sm font-sans">
        <div className="absolute inset-0" onClick={onClose} />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-screen max-w-2xl bg-[#111318] border-l border-[#3b494c] shadow-2xl flex flex-col justify-between"
          >
            {/* Top Bar */}
            <div className="p-6 md:p-8 border-b border-[#1E2530] flex items-center justify-between bg-[#11141B]">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold bg-[#00E5FF]/10 px-2 py-0.5 border border-[#00E5FF]/30">
                    {alert.alert_id}
                  </span>
                  <span
                    className={`text-[10px] font-label-caps uppercase tracking-widest font-bold px-2 py-0.5 border ${getSeverityBadge(
                      alert.severity
                    )}`}
                  >
                    {alert.severity} SEVERITY
                  </span>
                  <span className="text-[10px] font-label-caps uppercase text-[#606D7A]">
                    {alert.alert_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-[#F5F7FA] tracking-tight">{alert.title}</h2>
              </div>

              <button
                onClick={onClose}
                className="p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer ml-4 shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-7 font-mono text-xs">
              {/* Section 1: What Changed */}
              <div className="space-y-2">
                <span className="text-[10px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  <span>1. What Changed? (Delta Detection)</span>
                </span>

                <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4 border-b border-[#1E2530] pb-3">
                    <div>
                      <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
                        Previous State
                      </span>
                      <span className="text-[#bac9cc] font-bold block mt-0.5">
                        {alert.previous_state}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
                        Current State
                      </span>
                      <span className="text-[#00E5FF] font-bold block mt-0.5">
                        {alert.current_state}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-sans text-[#F5F7FA] font-medium leading-relaxed">
                    {alert.what_changed}
                  </p>
                </div>
              </div>

              {/* Section 2: Why Did It Change */}
              <div className="space-y-2 pt-2 border-t border-[#1E2530]">
                <span className="text-[10px] font-label-caps text-[#FFAA00] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>2. Why Did It Change? (Causal Attribution)</span>
                </span>

                <div className="p-4 bg-[#0c0e12] border border-[#1E2530] text-xs font-sans text-[#bac9cc] leading-relaxed">
                  {alert.why_it_matters}
                </div>
              </div>

              {/* Section 3: Affected Asset & Footprint */}
              {alert.product && (
                <div className="space-y-2 pt-2 border-t border-[#1E2530]">
                  <span className="text-[10px] font-label-caps text-[#00daf3] uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5" />
                    <span>3. Affected Asset & Technology Context</span>
                  </span>

                  <div className="p-4 bg-[#0c0e12] border border-[#1E2530] grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
                        Target Asset
                      </span>
                      <span className="text-[#F5F7FA] font-bold truncate block">
                        {alert.asset_name || alert.product}
                      </span>
                      {alert.asset_id && (
                        <span className="text-[#00E5FF] text-[9px] block">[{alert.asset_id}]</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-label-caps text-[#606D7A] block uppercase">
                        Technology / Product
                      </span>
                      <span className="text-[#00daf3] font-bold truncate block">{alert.product}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Section 4: Mandatory Defensive Action */}
              <div className="space-y-2 pt-2 border-t border-[#1E2530]">
                <span className="text-[10px] font-label-caps text-[#00E676] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>4. Mandatory Defensive Next Action</span>
                </span>

                <div className="p-4 bg-[#0c0e12] border border-[#00E676]/30 text-xs text-[#69f0ae] font-sans font-semibold leading-relaxed">
                  {alert.next_action}
                </div>
              </div>

              {/* Metadata strip */}
              <div className="pt-2 border-t border-[#1E2530] flex items-center justify-between text-[10px] text-[#606D7A]">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  <span>Detected: {new Date(alert.created_at).toLocaleString()}</span>
                </div>
                <span>Organisation: {alert.org_id}</span>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-5 border-t border-[#1E2530] bg-[#11141B] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                {!alert.is_read && (
                  <button
                    onClick={handleMarkRead}
                    disabled={isProcessing}
                    className="px-3 py-1.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] font-label-caps font-bold uppercase text-[10px] cursor-pointer"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#606D7A] hover:text-[#FF3B30] font-label-caps font-bold uppercase text-[10px] cursor-pointer"
                >
                  <EyeOff className="h-3 w-3" />
                  <span>Dismiss</span>
                </button>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                {alert.cve_id && onOpenEvidence && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEvidence(alert.cve_id!);
                    }}
                    className="flex items-center gap-1.5 text-xs text-[#00E5FF] hover:underline cursor-pointer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Evidence</span>
                  </button>
                )}

                {alert.cve_id && onInitiateRemediation && (
                  <button
                    onClick={() => {
                      onClose();
                      onInitiateRemediation(alert.cve_id!, alert.asset_id);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold uppercase tracking-wider text-xs hover:bg-[#c3f5ff] transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Initiate Remediation</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
