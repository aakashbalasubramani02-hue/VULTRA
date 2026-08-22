import {
  AIExplanationResponse,
  AssetCreateRequest,
  AssetDetailResponse,
  AssetListResponse,
  AssetUpdateRequest,
  ComparisonResponse,
  EvidenceResponse,
  HealthResponse,
  OrganizationCreateRequest,
  OrganizationUpdateRequest,
  ProductCatalogueResponse,
  ProfileDetailResponse,
  ProfilesListResponse,
  TriageResponse,
  WeightModifiers,
  WhatIfResponse,
  WhyNotResponse,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!res.ok) {
        let errMessage = `HTTP error ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errMessage = errData.message;
          }
        } catch {
          // ignore non-json error body
        }
        throw new Error(errMessage);
      }

      return await res.json();
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('VULTRA backend API is offline. Ensure FastAPI is running locally on port 8000 or 8001.');
      }
      throw err;
    }
  }

  async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  async getProfiles(): Promise<ProfilesListResponse> {
    return this.request<ProfilesListResponse>('/profiles');
  }

  async getProfileDetail(profileId: string): Promise<ProfileDetailResponse> {
    return this.request<ProfileDetailResponse>(`/profiles/${encodeURIComponent(profileId)}`);
  }

  async getTriage(profileId: string, limit: number = 5): Promise<TriageResponse> {
    return this.request<TriageResponse>(`/triage/${encodeURIComponent(profileId)}?limit=${limit}`);
  }

  async getEvidence(profileId: string, cveId: string): Promise<EvidenceResponse> {
    return this.request<EvidenceResponse>(
      `/evidence/${encodeURIComponent(profileId)}/${encodeURIComponent(cveId)}`
    );
  }

  async getWhyNot(profileId: string): Promise<WhyNotResponse> {
    return this.request<WhyNotResponse>(`/why-not/${encodeURIComponent(profileId)}`);
  }

  async getComparison(profileA: string, profileB: string): Promise<ComparisonResponse> {
    return this.request<ComparisonResponse>(
      `/compare/${encodeURIComponent(profileA)}/${encodeURIComponent(profileB)}`
    );
  }

  async simulateWhatIf(
    profileId: string,
    weights: Partial<WeightModifiers>
  ): Promise<WhatIfResponse> {
    return this.request<WhatIfResponse>(`/what-if/${encodeURIComponent(profileId)}`, {
      method: 'POST',
      body: JSON.stringify(weights),
    });
  }

  async explainWithAI(profileId: string, cveId: string): Promise<AIExplanationResponse> {
    return this.request<AIExplanationResponse>(
      `/ai/explain/${encodeURIComponent(profileId)}/${encodeURIComponent(cveId)}`,
      {
        method: 'POST',
      }
    );
  }

  async getProductCatalogue(): Promise<ProductCatalogueResponse> {
    return this.request<ProductCatalogueResponse>('/organizations/catalogue/products');
  }

  async registerOrganization(data: OrganizationCreateRequest): Promise<ProfileDetailResponse> {
    return this.request<ProfileDetailResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(
    profileId: string,
    data: OrganizationUpdateRequest
  ): Promise<ProfileDetailResponse> {
    return this.request<ProfileDetailResponse>(`/organizations/${encodeURIComponent(profileId)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrganization(profileId: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(
      `/organizations/${encodeURIComponent(profileId)}`,
      {
        method: 'DELETE',
      }
    );
  }

  async getAssets(orgId: string): Promise<AssetListResponse> {
    return this.request<AssetListResponse>(`/organizations/${encodeURIComponent(orgId)}/assets`);
  }

  async getAssetDetail(orgId: string, assetId: string): Promise<AssetDetailResponse> {
    return this.request<AssetDetailResponse>(
      `/organizations/${encodeURIComponent(orgId)}/assets/${encodeURIComponent(assetId)}`
    );
  }

  async createAsset(orgId: string, data: AssetCreateRequest): Promise<AssetDetailResponse> {
    return this.request<AssetDetailResponse>(
      `/organizations/${encodeURIComponent(orgId)}/assets`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async updateAsset(
    orgId: string,
    assetId: string,
    data: AssetUpdateRequest
  ): Promise<AssetDetailResponse> {
    return this.request<AssetDetailResponse>(
      `/organizations/${encodeURIComponent(orgId)}/assets/${encodeURIComponent(assetId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
  }

  async deleteAsset(orgId: string, assetId: string): Promise<{ status: string; message: string }> {
    return this.request<{ status: string; message: string }>(
      `/organizations/${encodeURIComponent(orgId)}/assets/${encodeURIComponent(assetId)}`,
      {
        method: 'DELETE',
      }
    );
  }
}

export const api = new ApiClient();


