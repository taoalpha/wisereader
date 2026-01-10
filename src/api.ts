import axios from 'axios';
import Conf from 'conf';

// Suppress Node.js warnings (like url.parse deprecation)
process.env.NODE_NO_WARNINGS = '1';

const config = new Conf({ projectName: 'wisereader' });

const TOKEN = process.env.READWISE_TOKEN || config.get('token') as string;
const BASE_URL = 'https://readwise.io/api/v3';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Token ${TOKEN}`,
  },
});

export const saveToken = (token: string) => {
    config.set('token', token);
};

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

export const fetchDocuments = async (location: string = 'new', pageSize?: number): Promise<Document[]> => {
  const response = await client.get('/list/', {
    params: { location, page_size: pageSize },
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