declare module 'react' {
  export type ReactNode = any;
  export type Dispatch<T> = (value: T) => void;
  export type SetStateAction<T> = T | ((previous: T) => T);
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  export function useMemo<T>(factory: () => T, deps?: any[]): T;
  export function useRef<T>(initialValue: T | null): { current: T | null };
  export function useState<T>(initialValue: T): [T, Dispatch<SetStateAction<T>>];
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps?: any[]): T;
}

declare module 'react/jsx-runtime' {
  export const Fragment: any;
  export function jsx(type: any, props: any, key?: any): any;
  export function jsxs(type: any, props: any, key?: any): any;
}

declare module 'react-dom/client' {
  export function createRoot(container: Element | DocumentFragment): {
    render(children: any): void;
  };
}

declare namespace React {
  type ReactNode = any;
}

declare namespace JSX {
  type Element = any;
  interface IntrinsicAttributes {
    key?: any;
  }
  interface IntrinsicElements {
    [elementName: string]: any;
  }
}
