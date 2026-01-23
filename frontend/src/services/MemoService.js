// services/MemoService.js
import api from "../api";

/**
 * Create a new memo for a project
 * POST /projects/{project_id}/memos
 */
export async function createMemo(projectId, memoData) {
  try {
    const response = await api.post(
      `/api/projects/${projectId}/memos/`,
      memoData
    );
    return response.data;
  } catch (error) {
    console.error("Create Memo API Error:", error);
    throw error;
  }
}

/**
 * Get all memos for a project
 * GET /projects/{project_id}/memos
 */
export async function getMemos(projectId) {
  try {
    const response = await api.get(
      `/api/projects/${projectId}/memos/`
    );
    return response.data;
  } catch (error) {
    console.error("Get Memos API Error:", error);
    throw error;
  }
}

/**
 * Update a memo (content / color / is_pinned)
 * PATCH /projects/{project_id}/memos/{memo_id}
 */
export async function updateMemo(projectId, memoId, memoData) {
  try {
    const response = await api.patch(
      `/api/projects/${projectId}/memos/${memoId}/`,
      memoData
    );
    return response.data;
  } catch (error) {
    console.error("Update Memo API Error:", error);
    throw error;
  }
}

/**
 * Delete a memo
 * DELETE /projects/{project_id}/memos/{memo_id}
 */
export async function deleteMemo(projectId, memoId) {
  try {
    await api.delete(
      `/api/projects/${projectId}/memos/${memoId}/`
    );
  } catch (error) {
    console.error("Delete Memo API Error:", error);
    throw error;
  }
}
