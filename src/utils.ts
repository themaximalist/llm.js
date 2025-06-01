export async function handleErrorResponse(response: Response) {
    if (response.ok) return true;
    const data = await response.json();
    if (!data) throw new Error("Failed to fetch models");
    throw new Error(data.error?.message || "Failed to fetch models");
}