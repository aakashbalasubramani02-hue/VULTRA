import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Asset, AssetCreateRequest, AssetUpdateRequest } from '../types/api';
import {
  X,
  Server,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  assetToEdit?: Asset | null;
  onAssetSaved: (asset: Asset) => void;
}

const ENVIRONMENT_OPTIONS = ['production', 'staging', 'development', 'testing'];
const EXPOSURE_OPTIONS = ['internet-facing', 'internal', 'restricted', 'air-gapped'];
const IMPORTANCE_OPTIONS = ['critical', 'high', 'medium', 'low'];

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  orgId,
  assetToEdit,
  onAssetSaved,
}) => {
  const [name, setName] = useState('');
  const [product, setProduct] = useState('');
  const [vendor, setVendor] = useState('');
  const [version, setVersion] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [exposure, setExposure] = useState('internet-facing');
  const [importance, setImportance] = useState('critical');

  const [catalogue, setCatalogue] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (assetToEdit) {
        setName(assetToEdit.name);
        setProduct(assetToEdit.product);
        setVendor(assetToEdit.vendor || '');
        setVersion(assetToEdit.version || '');
        setEnvironment(assetToEdit.environment || 'production');
        setExposure(assetToEdit.exposure || 'internet-facing');
        setImportance(assetToEdit.importance || 'critical');
      } else {
        setName('');
        setProduct('');
        setVendor('');
        setVersion('unknown');
        setEnvironment('production');
        setExposure('internet-facing');
        setImportance('critical');
      }

      api
        .getProductCatalogue()
        .then((res) => {
          setCatalogue(res.products);
          if (!assetToEdit && res.products.length > 0 && !product) {
            setProduct(res.products[0]);
          }
        })
        .catch(() => {
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
  }, [isOpen, assetToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage('Asset Name is required.');
      return;
    }
    if (!product.trim()) {
      setErrorMessage('Product Identifier is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (assetToEdit) {
        const updatePayload: AssetUpdateRequest = {
          name: name.trim(),
          product: product.trim(),
          vendor: vendor.trim() || undefined,
          version: version.trim() || 'unknown',
          environment,
          exposure,
          importance,
        };
        const res = await api.updateAsset(orgId, assetToEdit.asset_id, updatePayload);
        onAssetSaved(res.asset);
      } else {
        const createPayload: AssetCreateRequest = {
          name: name.trim(),
          product: product.trim(),
          vendor: vendor.trim() || 'Standard Vendor',
          version: version.trim() || 'unknown',
          environment,
          exposure,
          importance,
        };
        const res = await api.createAsset(orgId, createPayload);
        onAssetSaved(res.asset);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save technology asset.');
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
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#F5F7FA] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 border-b border-[#1E2530] pb-5">
            <div className="w-10 h-10 bg-[#00E5FF] flex items-center justify-center text-[#0c0e12]">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-label-caps uppercase tracking-widest text-[#00E5FF] font-bold">
                {assetToEdit ? 'Asset Configuration' : 'Asset Onboarding'}
              </div>
              <h2 className="text-xl font-bold text-[#F5F7FA]">
                {assetToEdit ? `Edit Asset — ${assetToEdit.asset_id}` : 'Register Technology Asset'}
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 font-mono text-xs">
            {errorMessage && (
              <div className="p-3.5 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] text-xs flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. Identity */}
            <div className="space-y-3">
              <div className="text-[11px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider">
                01. Asset Identification
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                  Asset Display Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Perimeter Edge Router"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                    Product / Technology *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Enterprise Router OS"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                    Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CiscoNet / Standard Vendor"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none"
                  />
                </div>
              </div>

              {/* Catalogue pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-[#606D7A] font-label-caps uppercase mr-1">
                  Catalogue:
                </span>
                {catalogue.map((catProd) => (
                  <button
                    key={catProd}
                    type="button"
                    onClick={() => setProduct(catProd)}
                    className={`text-[10px] px-2 py-0.5 border transition-colors cursor-pointer ${
                      product === catProd
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF] text-[#00E5FF]'
                        : 'bg-[#0c0e12] border-[#1E2530] text-[#bac9cc] hover:border-[#3b494c]'
                    }`}
                  >
                    {catProd}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Version & Environment */}
            <div className="space-y-3 pt-2 border-t border-[#1E2530]">
              <div className="text-[11px] font-label-caps text-[#00daf3] uppercase font-bold tracking-wider">
                02. Version & Environmental Footprint
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                    Installed Version (or "unknown")
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15.2(4)M or unknown"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none"
                  />
                  <span className="text-[9px] text-[#606D7A] block">
                    If unknown, matches trigger NEEDS VERIFICATION.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                    Deployment Environment
                  </label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none cursor-pointer uppercase text-xs"
                  >
                    {ENVIRONMENT_OPTIONS.map((env) => (
                      <option key={env} value={env}>
                        {env.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Exposure & Importance */}
            <div className="space-y-3 pt-2 border-t border-[#1E2530]">
              <div className="text-[11px] font-label-caps text-[#00E5FF] uppercase font-bold tracking-wider">
                03. Threat Posture & Asset Criticality
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                    Perimeter Exposure
                  </label>
                  <select
                    value={exposure}
                    onChange={(e) => setExposure(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none cursor-pointer uppercase text-xs"
                  >
                    {EXPOSURE_OPTIONS.map((exp) => (
                      <option key={exp} value={exp}>
                        {exp.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-label-caps text-[#606D7A] uppercase block">
                    Business Criticality
                  </label>
                  <select
                    value={importance}
                    onChange={(e) => setImportance(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] px-3 py-2 outline-none cursor-pointer uppercase text-xs"
                  >
                    {IMPORTANCE_OPTIONS.map((imp) => (
                      <option key={imp} value={imp}>
                        {imp.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{assetToEdit ? 'Save Changes' : 'Register Asset'}</span>
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
