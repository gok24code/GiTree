import { useState } from "react";
import { GoGitBranch, GoSun, GoMoon } from "react-icons/go";
import "./App.css";
import TreeView from "./components/TreeView";
import ForceGraphView from "./components/ForceGraphView";
import LanguageGraph from "./components/LanguageGraph"; // Import LanguageGraph
import {
  getRepoTree,
  parseGitHubUrl,
  type GitTreeResponse,
  getRepoLanguages,
} from "./services/github"; // Import getRepoLanguages
import { useTheme } from "./contexts/ThemeContext"; // Use the theme hook
import LoadingAnimation from "./components/LoadingAnimation";

function App() {
  const [repoUrl, setRepoUrl] = useState("");
  const [githubPat, setGithubPat] = useState(""); // New state for GitHub PAT
  const [treeData, setTreeData] = useState<GitTreeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"tree" | "vector">("tree");
  const [repoLanguages, setRepoLanguages] = useState<Record<
    string,
    number
  > | null>(null); // New state for languages
  const { theme, toggleTheme } = useTheme(); // Use the theme hook

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Input value:", event.target.value);
    setRepoUrl(event.target.value);
  };

  const handlePatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGithubPat(event.target.value);
  };

  const handleSubmit = async () => {
    if (repoUrl) {
      const parsedUrl = parseGitHubUrl(repoUrl);
      if (!parsedUrl) {
        setError("Invalid GitHub URL");
        return;
      }

      setIsLoading(true);
      setError(null);
      setTreeData(null);
      setRepoLanguages(null); // Clear previous languages

      const treeResponse = await getRepoTree(
        parsedUrl.owner,
        parsedUrl.repo,
        githubPat
      ); // Pass PAT
      let newError: string | null = null;

      if (!treeResponse) {
        newError =
          "Failed to fetch repository tree. Possible reasons:\n" +
          "- Invalid GitHub URL or repository does not exist.\n" +
          "- Repository is private and no PAT is provided or PAT is invalid.\n" +
          "- GitHub API rate limit exceeded. Try again later or use a PAT.\n" +
          "Check console for more details.";
      } else {
        setTreeData(treeResponse);
      }

      const languagesResponse = await getRepoLanguages(
        parsedUrl.owner,
        parsedUrl.repo,
        githubPat
      ); // Pass PAT

      if (!languagesResponse) {
        if (!newError) {
          // If no tree error, set language error
          newError =
            "Failed to fetch repository languages. Possible reasons:\n" +
            "- Invalid GitHub URL or repository does not exist.\n" +
            "- Repository is private and no PAT is provided or PAT is invalid.\n" +
            "- GitHub API rate limit exceeded. Try again later or use a PAT.\n" +
            "Check console for more details.";
        } else {
          // If there's already a tree error, append language error
          newError += "\n\nAlso failed to fetch repository languages.";
        }
      } else {
        setRepoLanguages(languagesResponse); // Set languages even if null to clear previous
      }

      setError(newError);
      setCurrentView("tree"); // Reset to tree view after successful fetch
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="theme-switch">
        <input
          type="checkbox"
          id="theme-toggle"
          onChange={toggleTheme}
          checked={theme === 'dark'}
        />
        <label htmlFor="theme-toggle">
          <GoSun className="icon sun-icon" />
          <GoMoon className="icon moon-icon" />
        </label>
      </div>

      {!treeData && !isLoading && !error && (
        <div className="main-container">
          <h1 className="title">
            <span className="title-icon"><GoGitBranch /></span>
            {"GiTree".split("").map((char, index) => (
              <span key={index} className="title-char">
                {char}
              </span>
            ))}
          </h1>
          <div className="input-container">
            <input
              type="text"
              className="repo-input"
              placeholder="Enter GitHub repository URL"
              value={repoUrl}
              onChange={handleUrlChange}
            />
            <input
              type="password" // Use type="password" for sensitive input
              className="repo-input"
              placeholder="GitHub PAT (Optional)"
              value={githubPat}
              onChange={handlePatChange}
              style={{ marginLeft: "1rem" }} // Add some spacing
            />
            <button className="submit-button" onClick={handleSubmit}>
              Generate
            </button>
          </div>
        </div>
      )}

      {isLoading && <LoadingAnimation />}
      {error && <div className="error-container">{error}</div>}
      {treeData && (
        <div className="view-container">
          <div className="view-toggle-buttons">
            <button
              className={`view-toggle-button ${
                currentView === "tree" ? "active" : ""
              }`}
              onClick={() => setCurrentView("tree")}
            >
              Tree View
            </button>
            <button
              className={`view-toggle-button ${
                currentView === "vector" ? "active" : ""
              }`}
              onClick={() => setCurrentView("vector")}
            >
              Vector View
            </button>
          </div>
          {currentView === "tree" ? (
            <>
              <TreeView data={treeData} />
              {repoLanguages && Object.keys(repoLanguages).length > 0 && (
                <LanguageGraph languages={repoLanguages} />
              )}
            </>
          ) : (
            <ForceGraphView data={treeData} />
          )}
        </div>
      )}
    </>
  );
}

export default App;
