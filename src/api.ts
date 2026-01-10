import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const TOKEN = process.env.READWISE_TOKEN;
const BASE_URL = 'https://readwise.io/api/v3';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Token ${TOKEN}`,
  },
});

export interface Document {
  id: string;
  title: string;
  author: string;
  source_url: string;
  category: string;
  location: string;
  html_content?: string;
  summary?: string;
  updated_at: string;
}

export const fetchDocuments = async (location: string = 'new'): Promise<Document[]> => {
  const response = await client.get('/list/', {
    params: { location },
  });
  return response.data.results;
};

export const fetchDocumentContent = async (id: string): Promise<Document> => {
  const response = await client.get('/list/', {
    params: { id, withHtmlContent: true },
  });
  return response.data.results[0];
};

export const updateDocumentLocation = async (id: string, location: 'archive' | 'later' | 'feed'): Promise<void> => {
  await client.patch(`/update/${id}/`, { location });
};

export const deleteDocument = async (id: string): Promise<void> => {
  await client.delete(`/delete/${id}/`);
};