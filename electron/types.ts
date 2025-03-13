export interface userProps {
  name: string;
  password: string;
}

export interface promptProps {
  user: string;
  content: string;
  system: string | undefined;
  model: string | undefined;
}

export interface imageConfigProps {
  name: string;
  port: string;
  internalPort: string;
}

export interface launchConfigProps {
  chromadb_path: string;
}

export interface messageProps {
  user: string;
  prompts: string[];
  ids: string[];
}

export interface queryProps {
  content: string;
  nResults: Number;
  user: string;
}

export interface knowledgeProps {
  data: string[];
  ids: string[];
  meta: any;
}

export interface knowledgePromptProps {
  content: string;
  nResults: Number;
  meta: any;
}