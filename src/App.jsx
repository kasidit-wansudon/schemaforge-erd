import { useState } from 'react';
import ImportPage from './pages/ImportPage';
import CanvasPage from './pages/CanvasPage';

function App() {
  const [page, setPage] = useState("import");
  const [schema, setSchema] = useState(null);
  if (page === "canvas" && schema) return <CanvasPage schema={schema} onBack={() => setPage("import")} />;
  return <ImportPage onParse={d => { setSchema(d); setPage("canvas"); }} />;
}

export default App;
