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


/**
 * Download a file
 */
export async function downloadProjectFile(fileUrl, fileName) {
  try {
    // Get the base URL from your api instance or define it
    const baseURL = 'http://localhost:8000'; // Adjust based on your setup
    
    // If fileUrl doesn't start with http, prepend the base URL
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseURL}/${fileUrl}`;
    
    const response = await api.get(fullUrl, {
      responseType: 'blob',
    });
    
    // Create a blob with proper content type
    const blob = new Blob([response.data], { 
      type: response.headers['content-type'] || 'application/octet-stream'
    });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download File Error:", err);
    throw err;
  }
}
