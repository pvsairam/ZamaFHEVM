import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultConfig, RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider as WagmiQueryClientProvider } from "@tanstack/react-query";
import { useTheme } from "./ThemeProvider";

const config = getDefaultConfig({
  appName: "FHE Analytics",
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [sepolia],
  ssr: false,
});

const wagmiQueryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <WagmiProvider config={config}>
      <WagmiQueryClientProvider client={wagmiQueryClient}>
        <RainbowKitProvider
          theme={theme === "dark" ? darkTheme({
            accentColor: "hsl(217, 91%, 60%)",
            borderRadius: "medium",
          }) : lightTheme({
            accentColor: "hsl(217, 91%, 60%)",
            borderRadius: "medium",
          })}
        >
          {children}
        </RainbowKitProvider>
      </WagmiQueryClientProvider>
    </WagmiProvider>
  );
}
