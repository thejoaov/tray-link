import {
  type ComponentType,
  createContext,
  type ReactNode,
  useContext,
} from "react";

const WindowContext = createContext<string>("");
export const useWindowId = () => useContext(WindowContext);

type WindowProviderProps = {
  children: ReactNode;
  id: string;
};

export function WindowProvider({ children, id }: WindowProviderProps) {
  return <WindowContext value={id}>{children}</WindowContext>;
}

export const withWindowProvider = <P extends object>(
  WrappedComponent: ComponentType<P>,
  id: string,
) => {
  const WithWindowProvider = (props: P) => {
    return (
      <WindowProvider id={id}>
        <WrappedComponent {...props} />
      </WindowProvider>
    );
  };

  return WithWindowProvider;
};
