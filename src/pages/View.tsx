import { useSearchParams } from "react-router-dom";
import StoryView from "./StoryView";
import PostView from "./PostView";

const View = () => {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  if (type === "post") {
    return <PostView />;
  }

  // Currently only handling "story" type, but extensible for others
  if (type === "story") {
    return <StoryView />;
  }

  // Default to StoryView for now as it's the main usage of /view
  return <StoryView />;
};

export default View;
