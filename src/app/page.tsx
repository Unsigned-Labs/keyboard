import { ThemeProvider } from "@/components/ThemeProvider";
import UnsignedKeyboard from "@/components/UnsignedKeyboard";

const App: React.FC = () => (
  <ThemeProvider>
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <UnsignedKeyboard />
    </div>
  </ThemeProvider>
);

export default App;
