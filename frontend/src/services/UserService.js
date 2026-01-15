import api from "../api"

export async function getUsers() {
    try {
        const result = await api.get("/api/users/");

        return result.data
    } catch (error) {
        console.log("Error fetching user : " + error)
    }
}

/**
 * Update current user's profile (username + profile_picture)
 * @param {Object} userData - { username: string, profile_picture: File or null }
 */
export async function updateUserProfile(userData) {
  try {
    const formData = new FormData();
    
    if (userData.username) {
      formData.append("username", userData.username);
    }
    
    // Handle profile picture update or deletion
    if ("profile_picture" in userData) {
      if (userData.profile_picture === null) {
        // Send empty string to delete
        formData.append("profile_picture", "");
      } else if (userData.profile_picture instanceof File) {
        formData.append("profile_picture", userData.profile_picture);
      }
    }

    const result = await api.patch("/api/users/update/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return result.data;
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw error;
  }
}

/**
 * Change current user's password
 * @param {Object} passwordData - { currentPassword, newPassword, confirmPassword }
 */
export async function changeUserPassword(passwordData) {
  try {
    const result = await api.put("/api/users/me/password/", {
      current_password: passwordData.currentPassword,
      new_password: passwordData.newPassword,
      confirm_password: passwordData.confirmPassword, // <-- add this
    });

    return result.data; // success message
  } catch (error) {
    console.error("Error changing password:", error.response);
    throw error;
  }
}
