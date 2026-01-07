// FileService.js
import api from "../api";

/**
 * Get all files in a project
 */
export async function getProjectFiles(projectId) {
  try {
    const res = await api.get(`/api/projects/${projectId}/files/`);
    return res.data;
  } catch (err) {
    console.error("Get Files Error:", err);
    throw err;
  }
}

/**
 * Upload a file
 * data = { file: File, name?: string }
 */
export async function uploadProjectFile(projectId, data) {
  try {
    const formData = new FormData();
    formData.append("file", data.file);

    // optional → backend will fallback to file.name
    if (data.name) formData.append("name", data.name);

    const res = await api.post(
      `/api/projects/${projectId}/files/`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" }
      }
    );

    return res.data;
  } catch (err) {
    console.error("Upload File Error:", err);
    throw err;
  }
}

/**
 * Delete a file
 */
export async function deleteProjectFile(projectId, fileId) {
  try {
    await api.delete(`/api/projects/${projectId}/files/${fileId}/`);
  } catch (err) {
    console.error("Delete File Error:", err);
    throw err;
  }
}
