declare module "swagger-ui-react" {
  export interface SwaggerUIProps {
    url?: string;
    spec?: object;
    docExpansion?: "list" | "full" | "none";
    defaultModelsExpandDepth?: number;
    defaultModelExpandDepth?: number;
    defaultModelMaxDepth?: number;
    locale?: string;
    syntaxHighlight?: {
      activated?: boolean;
      theme?: string | object;
    };
    persistAuthorization?: boolean;
    onComplete?: () => void;
    onFailure?: () => void;
    layout?: string;
    tryItCredentialsProvider?: {
      keys?: Record<string, {
        name?: string;
        location?: string;
        enabled?: boolean;
      }>;
    };
    [key: string]: unknown;
  }

  export default function SwaggerUI(props: SwaggerUIProps): JSX.Element;
}