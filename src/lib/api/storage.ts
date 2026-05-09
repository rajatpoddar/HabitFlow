// Removed supabase dependency
// The client shouldn't call this directly but rather use the API route.

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  
  const res = await fetch("/api/storage/avatar", {
    method: "POST",
    body: formData,
  });
  
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  
  return data.url;
}
