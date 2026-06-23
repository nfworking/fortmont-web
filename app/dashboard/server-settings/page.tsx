"use html";
"use client";

import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticketId", ""); 

    try {
      const res = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`Success! Stored in SeaweedFS with key: ${data.file.objectKey}`);
        setFile(null);
      } else {
        setMessage(`Upload failure: ${data.error}`);
      }
    } catch (err) {
      setMessage("An unexpected error occurred during client-side transit.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Upload Assets to SeaweedFS</h2>
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input 
          type="file" 
          onChange={handleFileChange} 
          style={{ padding: "0.5rem", border: "1px dashed #ccc", borderRadius: "4px" }}
        />
        <button
          type="submit"
          disabled={!file || uploading}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: uploading ? "#ccc" : "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: file && !uploading ? "pointer" : "not-allowed",
          }}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </form>
      {message && <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#333" }}>{message}</p>}
    </div>
  );
}