import { useContext } from "react";
import { SetBuilderContext } from "@/contexts/SetBuilderContext";

export const useSetBuilder = () => {
  const context = useContext(SetBuilderContext);
  if (context === undefined) {
    throw new Error("useSetBuilder must be used within a SetBuilderProvider");
  }
  return context;
};
