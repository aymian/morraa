import MigrationNotice from "@/components/noire/MigrationNotice";
import { TooltipProvider } from "@/components/ui/tooltip";

const App = () => (
  <TooltipProvider>
    <MigrationNotice />
  </TooltipProvider>
);

export default App;
