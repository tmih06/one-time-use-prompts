import { Agentation } from "agentation";
import { createRoot } from "react-dom/client";

// Dev-only UI annotation toolbar for leaving feedback to an AI coding agent.
const host = document.createElement("div");
document.body.append(host);
createRoot(host).render(<Agentation />);
