import api from "../api"

export async function getUsers() {
    try {
        const result = await api.get("/api/users/");

        return result.data
    } catch (error) {
        console.log("Error fetching user : " + error)
    }
}