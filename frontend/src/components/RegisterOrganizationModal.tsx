import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  X,
  Building2,
  Plus,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RegisterOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationRegistered: (newOrgId: string) => void;
}

const SECTOR_SUGGESTIONS = [
  'Financial Services',
  'Healthcare & Life Sciences',
  'Technology & Cloud SaaS',
  'Energy & Utilities',
  'Manufacturing & Logistics',
  'Government & Public Sector',
  'Critical Infrastructure',
];

const RISK_APPETITE_OPTIONS = ['Low', 'Medium', 'High', 'Zero-Tolerance'];

export const RegisterOrganizationModal: React.FC<RegisterOrganizationModalProps> = ({
  isOpen,
  onClose,
  onOrganizationRegistered,
}) => {
  const [name, setName] = useState('');
  const [sector, setSector] = useState(SECTOR_SUGGESTIONS[0]);
  const [riskAppetite, setRiskAppetite] = useState('Low');
  const [criticalProducts, setCriticalProducts] = useState<string[]>([]);
  const [productInput, setProductInput] = useState('');
  const [catalogue, setCatalogue] = useState<string[]>([]);

  // Weights (fractions summing to 1.0)
  const [kevWeight, setKevWeight] = useState(0.35);
  const [epssWeight, setEpssWeight] = useState(0.25);
  const [cvssWeight, setCvssWeight] = useState(0.15);
  const [exposureWeight, setExposureWeight] = useState(0.15);
  const [importanceWeight, setImportanceWeight] = useState(0.10);

  const [showAdvancedWeights, setShowAdvancedWeights] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [registeredOrgId, setRegisteredOrgId] = useState<string | null>(null);

  // Load available product catalogue dynamically from dataset
  useEffect(() => {
    if (isOpen) {
      api
        .getProductCatalogue()
        .then((res) => {
          setCatalogue(res.products);
          if (criticalProducts.length === 0 && res.products.length > 0) {
            setCriticalProducts([res.products[0]]);
          }
        })
        .catch(() => {
          // Fallback if network issue
          setCatalogue([
            'Web Application Firewall',
            'Identity Provider SaaS',
            'Cloud Database Engine',
            'Enterprise Router OS',
            'Core Banking Framework',
            'Embedded IoT Gateway',
          ]);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddProduct = (prod: string) => {
    const trimmed = prod.trim();
    if (!trimmed) return;
    if (!criticalProducts.includes(trimmed)) {
      setCriticalProducts([...criticalProducts, trimmed]);
    }
    setProductInput('');
  };

  const handleRemoveProduct = (prod: string) => {
    setCriticalProducts(criticalProducts.filter((p) => p !== prod));
  };

  const totalWeight =
    Math.round(
      (kevWeight + epssWeight + cvssWeight + exposureWeight + importanceWeight) * 100
    ) / 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Organisation Name is required.');
      return;
    }

    if (criticalProducts.length === 0) {
      setErrorMessage('At least one critical product must be configured in asset inventory.');
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await api.registerOrganization({
        name: name.trim(),
        sector: sector.trim(),
        risk_appetite: riskAppetite,
        critical_products: criticalProducts,
        weight_modifiers: {
          cisa_kev_weight: kevWeight,
          first_epss_weight: epssWeight,
          cvss_weight: cvssWeight,
          exposure_weight: exposureWeight,
          importance_weight: importanceWeight,
        },
      });

      setRegisteredOrgId(created.profile_id);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to register organisation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartAnalysis = () => {
    if (registeredOrgId) {
      onOrganizationRegistered(registeredOrgId);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0c0e12]/85 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[#111318] border border-[#3b494c] shadow-2xl p-6 md:p-8 space-y-6"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-[#1E2530] pb-5">
            <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                Dynamic Profile Onboarding
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">
                Register New Organisation Profile
              </h2>
            </div>
          </div>

          {/* Success State Screen */}
          {registeredOrgId ? (
            <div className="space-y-6 py-4">
              <div className="p-6 bg-[#0c0e12] border border-[#00E5FF]/50 text-center space-y-3 font-mono">
                <div className="w-12 h-12 bg-[#00E5FF]/20 text-[#00E5FF] mx-auto flex items-center justify-center border border-[#00E5FF]/40">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-[#F5F7FA]">
                  ORGANISATION REGISTERED SUCCESSFULLY
                </h3>
                <div className="text-xs text-[#00daf3]">
                  Profile ID: <strong className="text-[#00E5FF] text-sm">{registeredOrgId}</strong>
                </div>
                <p className="text-xs text-[#bac9cc] max-w-md mx-auto leading-relaxed pt-2">
                  <strong className="text-[#F5F7FA]">{name}</strong> has been persisted to the profile registry. The deterministic decision engine is ready to triage the vulnerability dataset against this organisation's perimeter.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2530]">
                <button
                  type="button"
                  onClick={handleStartAnalysis}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold text-xs hover:bg-[#c3f5ff] transition-colors cursor-pointer uppercase tracking-widest"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analyse Organisation Now →</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] text-xs flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Organisation Identity */}
              <div className="space-y-4">
                <div className="text-[11px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider flex items-center gap-2">
                  <span>01. Organisation Identity</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 font-mono text-xs">
                    <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                      Organisation Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Health Systems"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3.5 py-2.5 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 font-mono text-xs">
                    <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                      Industry Sector *
                    </label>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                      className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3.5 py-2.5 outline-none transition-colors cursor-pointer"
                    >
                      {SECTOR_SUGGESTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Risk Appetite */}
              <div className="space-y-3 pt-2">
                <div className="text-[11px] font-label-caps text-[#00daf3] uppercase font-bold tracking-wider">
                  02. Risk Appetite Declaration
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                  {RISK_APPETITE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setRiskAppetite(opt)}
                      className={`p-2.5 border text-center font-bold transition-colors cursor-pointer ${
                        riskAppetite === opt
                          ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF]'
                          : 'bg-[#0c0e12] border-[#1E2530] text-[#bac9cc] hover:border-[#3b494c]'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Critical Products & Technology Stack */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider">
                    03. Critical Technology Inventory
                  </div>
                  <span className="text-[10px] font-mono text-[#606D7A]">
                    {criticalProducts.length} Products Configured
                  </span>
                </div>

                {/* Selected Products List */}
                <div className="p-3 bg-[#0c0e12] border border-[#1E2530] min-h-[50px] flex flex-wrap items-center gap-2">
                  {criticalProducts.length === 0 ? (
                    <span className="text-xs text-[#606D7A] italic font-mono">
                      No products added yet. Select from catalogue below or type custom product.
                    </span>
                  ) : (
                    criticalProducts.map((prod) => (
                      <span
                        key={prod}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#191c20] border border-[#3b494c] text-xs font-mono text-[#F5F7FA]"
                      >
                        <span>{prod}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(prod)}
                          className="text-[#606D7A] hover:text-[#FF3B30] transition-colors cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Input & Catalog Suggestions */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type or pick product from dataset..."
                    value={productInput}
                    onChange={(e) => setProductInput(e.target.value)}
                    className="flex-1 bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-xs font-mono text-[#F5F7FA] px-3.5 py-2 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddProduct(productInput)}
                    className="px-4 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-xs font-label-caps font-bold uppercase tracking-wider text-[#F5F7FA] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {/* Autocomplete suggestions from vulnerabilities.csv */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-label-caps text-[#606D7A] uppercase mr-1">
                    Discovered Products:
                  </span>
                  {catalogue.map((catProd) => {
                    const isAdded = criticalProducts.includes(catProd);
                    return (
                      <button
                        key={catProd}
                        type="button"
                        onClick={() =>
                          isAdded ? handleRemoveProduct(catProd) : handleAddProduct(catProd)
                        }
                        className={`text-[10px] font-mono px-2 py-0.5 border transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                            : 'bg-[#0c0e12] border-[#1E2530] text-[#bac9cc] hover:border-[#3b494c]'
                        }`}
                      >
                        {isAdded ? '✓ ' : '+ '}
                        {catProd}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Risk Weight Configuration (Toggle) */}
              <div className="pt-2 border-t border-[#1E2530] space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedWeights(!showAdvancedWeights)}
                    className="text-[11px] font-label-caps text-[#606D7A] hover:text-[#00E5FF] uppercase font-bold tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span>{showAdvancedWeights ? 'Hide Custom Weights' : 'Customise Risk Weights (Advanced)'}</span>
                  </button>
                  <span className="text-[10px] font-mono text-[#606D7A]">
                    Total Weight: {totalWeight.toFixed(2)}
                  </span>
                </div>

                {showAdvancedWeights && (
                  <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-3 font-mono text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#606D7A]">CISA KEV Weight:</span>
                          <span className="text-[#FF3B30] font-bold">{(kevWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={kevWeight}
                          onChange={(e) => setKevWeight(parseFloat(e.target.value))}
                          className="w-full accent-[#00E5FF]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#606D7A]">FIRST EPSS Weight:</span>
                          <span className="text-[#FF9500] font-bold">{(epssWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={epssWeight}
                          onChange={(e) => setEpssWeight(parseFloat(e.target.value))}
                          className="w-full accent-[#00E5FF]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#606D7A]">CVSS Base Score Weight:</span>
                          <span className="text-[#FFCC00] font-bold">{(cvssWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={cvssWeight}
                          onChange={(e) => setCvssWeight(parseFloat(e.target.value))}
                          className="w-full accent-[#00E5FF]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#606D7A]">Asset Exposure Weight:</span>
                          <span className="text-[#00daf3] font-bold">{(exposureWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={exposureWeight}
                          onChange={(e) => setExposureWeight(parseFloat(e.target.value))}
                          className="w-full accent-[#00E5FF]"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[#606D7A]">Service Importance Weight:</span>
                          <span className="text-[#c3f5ff] font-bold">{(importanceWeight * 100).toFixed(0)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.0"
                          max="1.0"
                          step="0.05"
                          value={importanceWeight}
                          onChange={(e) => setImportanceWeight(parseFloat(e.target.value))}
                          className="w-full accent-[#00E5FF]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Live Profile Preview */}
              <div className="p-4 bg-[#0c0e12] border border-[#1E2530] space-y-2 font-mono text-[11px]">
                <div className="flex items-center justify-between text-[#606D7A] border-b border-[#1E2530] pb-1.5">
                  <span className="font-label-caps uppercase font-bold">Profile Summary Preview</span>
                  <span>Deterministic Ingestion</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div>
                    <span className="text-[#606D7A] text-[9px] block">NAME</span>
                    <span className="text-[#F5F7FA] font-bold truncate block">{name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[#606D7A] text-[9px] block">SECTOR</span>
                    <span className="text-[#00daf3] font-bold truncate block">{sector}</span>
                  </div>
                  <div>
                    <span className="text-[#606D7A] text-[9px] block">APPETITE</span>
                    <span className="text-[#FF3B30] font-bold truncate block">{riskAppetite}</span>
                  </div>
                  <div>
                    <span className="text-[#606D7A] text-[9px] block">PRODUCTS</span>
                    <span className="text-[#00E5FF] font-bold block">{criticalProducts.length}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2530]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] text-xs font-label-caps uppercase font-bold tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold text-xs hover:bg-[#c3f5ff] transition-colors cursor-pointer uppercase tracking-widest disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Registering...</span>
                    </>
                  ) : (
                    <>
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Register Organisation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
