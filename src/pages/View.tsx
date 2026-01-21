import { useSearchParams } from "react-router-dom";
import StoryView from "./StoryView";

const View = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  // Currently only handling "story" type, but extensible for others
  if (type === "story") {
    return <StoryView />;
  }

  // Default to StoryView for now as it's the main usage of /view
  return <StoryView />;
};

export default View;
