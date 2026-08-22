import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { Asset, ProfileDetailResponse } from '../types/api';
import { AddAssetModal } from '../components/AddAssetModal';
import {
  Server,
  Plus,
  Search,
  Trash2,
  Edit2,
  ShieldAlert,
  Globe,
  Lock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface InventoryViewProps {
  selectedProfileId: string;
  onNavigateToTriage?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  selectedProfileId,
  onNavigateToTriage,
}) => {
  const [profile, setProfile] = useState<ProfileDetailResponse | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [exposureFilter, setExposureFilter] = useState('ALL');
  const [importanceFilter, setImportanceFilter] = useState('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<Asset | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [profileRes, assetRes] = await Promise.all([
        api.getProfileDetail(selectedProfileId),
        api.getAssets(selectedProfileId),
      ]);
      setProfile(profileRes);
      setAssets(assetRes.assets);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load asset inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [selectedProfileId]);

  const handleAssetSaved = (_savedAsset: Asset) => {
    fetchInventory();
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!window.confirm(`Are you sure you want to delete asset ${assetId}?`)) {
      return;
    }
    try {
      await api.deleteAsset(selectedProfileId, assetId);
      setAssets((prev) => prev.filter((a) => a.asset_id !== assetId));
    } catch (err: any) {
      alert(`Failed to delete asset: ${err.message}`);
    }
  };

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesEnv =
        envFilter === 'ALL' ||
        (asset.environment || 'production').toLowerCase() === envFilter.toLowerCase();

      const matchesExposure =
        exposureFilter === 'ALL' ||
        asset.exposure.toLowerCase().includes(exposureFilter.toLowerCase());

      const matchesImportance =
        importanceFilter === 'ALL' ||
        asset.importance.toLowerCase() === importanceFilter.toLowerCase();

      return matchesSearch && matchesEnv && matchesExposure && matchesImportance;
    });
  }, [assets, searchTerm, envFilter, exposureFilter, importanceFilter]);

  // KPIs
  const totalCount = assets.length;
  const internetFacingCount = assets.filter((a) =>
    a.exposure.toLowerCase().includes('internet')
  ).length;
  const criticalCount = assets.filter(
    (a) => a.importance.toLowerCase() === 'critical' || a.importance.toLowerCase() === 'high'
  ).length;
  const unknownVersionCount = assets.filter(
    (a) => !a.version || a.version.toLowerCase() === 'unknown'
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-[#00E5FF] font-mono text-sm">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>SYNCHRONIZING ASSET INVENTORY & VULNERABILITY REPOSITORY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
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
            Asset & Technology Inventory
          </h1>
          <p className="text-xs text-[#bac9cc] font-mono max-w-2xl">
            Live technology assets, software versions, and environmental exposure profiles evaluated
            by VULTRA's deterministic matching engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigateToTriage && (
            <button
              onClick={onNavigateToTriage}
              className="px-4 py-2 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#F5F7FA] text-xs font-label-caps font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Back to Triage
            </button>
          )}
          <button
            onClick={() => {
              setAssetToEdit(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2 bg-[#00E5FF] text-[#0c0e12] font-label-caps font-bold text-xs uppercase tracking-widest hover:bg-[#c3f5ff] transition-all shadow-lg cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/40 text-[#FF3B30] text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#111318] border border-[#1E2530] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-label-caps text-[#606D7A] uppercase">Total Assets</div>
            <div className="text-2xl font-bold text-[#F5F7FA] mt-1">{totalCount}</div>
          </div>
          <div className="w-10 h-10 bg-[#191c20] border border-[#3b494c] flex items-center justify-center text-[#00E5FF]">
            <Server className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-label-caps text-[#FF3B30] uppercase font-bold">
              Internet-Facing
            </div>
            <div className="text-2xl font-bold text-[#FF3B30] mt-1">{internetFacingCount}</div>
          </div>
          <div className="w-10 h-10 bg-[#FF3B30]/10 border border-[#FF3B30]/30 flex items-center justify-center text-[#FF3B30]">
            <Globe className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-label-caps text-[#FFAA00] uppercase font-bold">
              Critical / High Tier
            </div>
            <div className="text-2xl font-bold text-[#FFAA00] mt-1">{criticalCount}</div>
          </div>
          <div className="w-10 h-10 bg-[#FFAA00]/10 border border-[#FFAA00]/30 flex items-center justify-center text-[#FFAA00]">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#111318] border border-[#1E2530] p-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-label-caps text-[#00daf3] uppercase font-bold">
              Needs Verification
            </div>
            <div className="text-2xl font-bold text-[#00daf3] mt-1">{unknownVersionCount}</div>
          </div>
          <div className="w-10 h-10 bg-[#00daf3]/10 border border-[#00daf3]/30 flex items-center justify-center text-[#00daf3]">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-[#111318] border border-[#1E2530] p-4 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#606D7A]" />
          <input
            type="text"
            placeholder="Search assets, products, vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0e12] border border-[#3b494c] focus:border-[#00E5FF] text-[#F5F7FA] pl-9 pr-3 py-1.5 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Environment */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Env:</span>
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
            >
              <option value="ALL">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
              <option value="testing">Testing</option>
            </select>
          </div>

          {/* Exposure */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Exposure:</span>
            <select
              value={exposureFilter}
              onChange={(e) => setExposureFilter(e.target.value)}
              className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
            >
              <option value="ALL">All Exposure</option>
              <option value="internet">Internet-Facing</option>
              <option value="internal">Internal</option>
              <option value="restricted">Restricted</option>
              <option value="air-gapped">Air-Gapped</option>
            </select>
          </div>

          {/* Importance */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">Crit:</span>
            <select
              value={importanceFilter}
              onChange={(e) => setImportanceFilter(e.target.value)}
              className="bg-[#0c0e12] border border-[#3b494c] text-[#bac9cc] px-2 py-1 outline-none uppercase cursor-pointer text-xs"
            >
              <option value="ALL">All Criticality</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-[#111318] border border-[#1E2530] p-12 text-center space-y-3">
          <Server className="h-8 w-8 text-[#606D7A] mx-auto" />
          <div className="text-sm font-mono text-[#F5F7FA] font-bold">No technology assets match the selected criteria</div>
          <p className="text-xs font-mono text-[#606D7A]">
            Try adjusting your search query or registering a new asset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAssets.map((asset) => {
            const isInternet = asset.exposure.toLowerCase().includes('internet');
            const isCritical =
              asset.importance.toLowerCase() === 'critical' ||
              asset.importance.toLowerCase() === 'high';
            const isUnknownVersion =
              !asset.version || asset.version.toLowerCase() === 'unknown';

            return (
              <motion.div
                key={asset.asset_id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111318] border border-[#1E2530] hover:border-[#3b494c] transition-all p-5 flex flex-col justify-between space-y-4 shadow-lg group relative"
              >
                {/* Top Row: Asset ID & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 border border-[#00E5FF]/30">
                      {asset.asset_id}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 border ${
                        asset.environment === 'staging'
                          ? 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/30'
                          : 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]'
                      }`}
                    >
                      {asset.environment || 'PRODUCTION'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setAssetToEdit(asset);
                        setIsAddModalOpen(true);
                      }}
                      title="Edit Asset"
                      className="p-1.5 bg-[#191c20] hover:bg-[#282a2f] border border-[#3b494c] text-[#bac9cc] hover:text-[#00E5FF] transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteAsset(asset.asset_id)}
                      title="Delete Asset"
                      className="p-1.5 bg-[#191c20] hover:bg-[#FF3B30]/20 border border-[#3b494c] hover:border-[#FF3B30]/40 text-[#bac9cc] hover:text-[#FF3B30] transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Content */}
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-[#F5F7FA] tracking-tight group-hover:text-[#00E5FF] transition-colors">
                    {asset.name}
                  </h3>
                  <div className="text-xs font-mono text-[#00daf3]">{asset.product}</div>
                  {asset.vendor && (
                    <div className="text-[11px] font-mono text-[#606D7A]">
                      Vendor: {asset.vendor}
                    </div>
                  )}
                </div>

                {/* Version & Threat Badges */}
                <div className="pt-3 border-t border-[#1E2530] space-y-2.5 font-mono text-xs">
                  {/* Version */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-label-caps text-[#606D7A] uppercase">
                      Installed Version
                    </span>
                    {isUnknownVersion ? (
                      <span className="text-[10px] text-[#00daf3] bg-[#00daf3]/10 border border-[#00daf3]/30 px-2 py-0.5 font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        UNKNOWN (VERIFY)
                      </span>
                    ) : (
                      <span className="text-xs text-[#F5F7FA] font-bold bg-[#0c0e12] px-2 py-0.5 border border-[#3b494c]">
                        v{asset.version}
                      </span>
                    )}
                  </div>

                  {/* Exposure & Importance Row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span
                      className={`text-[10px] font-label-caps uppercase px-2 py-0.5 border flex items-center gap-1 ${
                        isInternet
                          ? 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/40 font-bold'
                          : 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]'
                      }`}
                    >
                      {isInternet ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {asset.exposure}
                    </span>

                    <span
                      className={`text-[10px] font-label-caps uppercase px-2 py-0.5 border ${
                        isCritical
                          ? 'bg-[#FFAA00]/10 text-[#FFAA00] border-[#FFAA00]/40 font-bold'
                          : 'bg-[#191c20] text-[#bac9cc] border-[#3b494c]'
                      }`}
                    >
                      {asset.importance}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Asset Modal */}
      <AddAssetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setAssetToEdit(null);
        }}
        orgId={selectedProfileId}
        assetToEdit={assetToEdit}
        onAssetSaved={handleAssetSaved}
      />
    </div>
  );
};
