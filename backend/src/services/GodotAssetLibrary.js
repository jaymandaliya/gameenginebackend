/**
 * GodotAssetLibrary
 *
 * Wraps the official Godot Asset Library REST API.
 * Base URL: https://godotengine.org/asset-library/api
 *
 * Allows users to browse and import thousands of free, open-source
 * Godot assets (sprites, sounds, shaders, templates) directly into
 * their game projects.
 *
 * API docs: https://github.com/godotengine/godot-asset-library
 */

import axios from 'axios';
import logger from '../utils/logger.js';

const GODOT_API = 'https://godotengine.org/asset-library/api';

const client = axios.create({
  baseURL: GODOT_API,
  timeout: 15000,
  headers: { 'Accept': 'application/json' },
});

// ─────────────────────────────────────────────────────────────────────────────

export class GodotAssetLibrary {

  /**
   * Search assets from the Godot Asset Library.
   *
   * @param {object} params
   * @param {string}  params.query       - Search term
   * @param {string}  params.category    - Category filter ('2D Tools', '3D Tools', etc.)
   * @param {string}  params.godot_version - Godot version filter ('4', '3', etc.)
   * @param {number}  params.page        - Page number (0-indexed)
   * @param {number}  params.max_results - Items per page (default 40)
   * @param {string}  params.sort        - 'rating' | 'cost' | 'name' | 'updated'
   * @param {string}  params.support     - 'official' | 'community' | 'testing'
   * @param {boolean} params.freeOnly    - Filter to cost="Free" assets only
   */
  static async search({
    query        = '',
    category     = '',
    godot_version = '4',
    page         = 0,
    max_results  = 20,
    sort         = 'rating',
    support      = 'community',
    freeOnly     = true,
  } = {}) {
    try {
      const params = {
        type:          'asset',
        godot_version,
        max_results,
        page,
        sort,
        support,
      };

      if (query)    params.filter    = query;
      if (category) params.category  = category;
      if (freeOnly) params.cost      = 'Free';

      const res = await client.get('/asset', { params });
      const data = res.data;

      return {
        success:    true,
        total:      data.total_items || 0,
        page:       data.page        || 0,
        pages:      data.total_pages || 1,
        assets:     (data.result || []).map(GodotAssetLibrary.normalizeAsset),
      };
    } catch (error) {
      logger.error('[GodotAssetLibrary] search error:', error.message);
      return { success: false, error: error.message, assets: [] };
    }
  }

  /**
   * Get full details for a single asset including download URL.
   */
  static async getAsset(assetId) {
    try {
      const res  = await client.get(`/asset/${assetId}`);
      const data = res.data;
      return { success: true, asset: GodotAssetLibrary.normalizeAssetDetail(data) };
    } catch (error) {
      logger.error('[GodotAssetLibrary] getAsset error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of all categories.
   */
  static async getCategories() {
    try {
      const res  = await client.get('/configure');
      const cats = res.data?.categories || {};
      return {
        success:    true,
        categories: Object.entries(cats).map(([id, name]) => ({ id, name })),
      };
    } catch (error) {
      logger.error('[GodotAssetLibrary] getCategories error:', error.message);
      return { success: false, categories: [] };
    }
  }

  /**
   * Curated collections for the game studio UI.
   * Returns pre-filtered results for common game dev needs.
   */
  static async getCuratedCollections() {
    const searches = [
      { key: 'sprites_2d',   query: '2D sprite character',    category: '2D Tools' },
      { key: 'platformer',   query: 'platformer',             category: '' },
      { key: 'sounds',       query: 'sound effect sfx',       category: '' },
      { key: 'shaders',      query: 'shader effect visual',   category: 'Shaders' },
      { key: 'templates',    query: 'game template starter',  category: '' },
      { key: 'ui_themes',    query: 'UI theme HUD interface', category: 'Tools' },
    ];

    const results = await Promise.allSettled(
      searches.map(({ query, category }) =>
        GodotAssetLibrary.search({ query, category, max_results: 6 })
      )
    );

    const collections = {};
    searches.forEach(({ key }, i) => {
      const r = results[i];
      collections[key] = r.status === 'fulfilled' ? (r.value.assets || []) : [];
    });

    return { success: true, collections };
  }

  // ── Normalize API responses to our standard asset shape ──────────────────

  static normalizeAsset(raw) {
    return {
      id:           raw.asset_id,
      title:        raw.title,
      author:       raw.author,
      category:     raw.category,
      rating:       raw.rating,
      cost:         raw.cost || 'Free',
      thumbnail:    raw.icon_url,
      godotVersion: raw.godot_version,
      modifiedAt:   raw.modify_date,
      supportLevel: raw.support_level,
      downloadUrl:  null, // populated by getAsset()
    };
  }

  static normalizeAssetDetail(raw) {
    return {
      ...GodotAssetLibrary.normalizeAsset(raw),
      description:  raw.description,
      downloadUrl:  raw.download_url  || raw.download_provider,
      browseUrl:    raw.browse_url,
      issuesUrl:    raw.issues_url,
      license:      raw.license,
      version:      raw.version,
      previewImages: (raw.previews || []).map(p => ({
        type:     p.type,
        link:     p.link,
        thumbnail: p.thumbnail,
      })),
    };
  }
}
