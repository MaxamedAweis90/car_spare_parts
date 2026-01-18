"use client";

import { Client, Storage } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

const storage = new Storage(client);

export default function TestProductImage() {
  const imageUrl = storage.getFileView(
    "693ff53b0030493a8205",
    "693ff6870002f54733fa"
  );

  return (
    <img
      src={imageUrl.toString()}
      alt="Test product"
      className="w-64 rounded border"
    />
  );
}

