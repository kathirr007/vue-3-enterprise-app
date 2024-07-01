export interface KnowledgeBaseCommonMessage {
  role: string;
  content: string;
  rating?: number;
}

export interface KnowledgeBaseMessage extends KnowledgeBaseCommonMessage {
  metadata: KnowledgeBaseMessageMetadata;
}

export interface KnowledgeBaseMessagePayload
  extends KnowledgeBaseCommonMessage {
  metadata?: string;
}

export interface KnowledgeBaseMessageMetadata {
  sources: Source[];
  output_id: number;
}

export interface CreateQuery {
  partition_name: string;
  messages: KnowledgeBaseMessagePayload[];
}

export interface Category {
  key: string;
  title: string;
}

export interface FAQ {
  question: string;
  answer: string;
  sources: Source[];
}

export interface Source {
  document_text: string;
  document_metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  source_doc: string;
  attributes: {
    source_url: string;
    influence_region: string;
    partition_name: string;
  };
  page_range: number;
  split_index: number;
  start_page: number;
  end_page: number;
  partition_name: string;
}

export interface KnowledgeBaseMessages {
  messages: KnowledgeBaseMessage[];
}
