import { useState, useEffect, useCallback } from 'react';
import ImportPage from './pages/ImportPage';
import CanvasPage from './pages/CanvasPage';
import ControllerPage from './pages/ControllerPage';

const STORAGE_KEY = 'schemaforge-erd-data';
const ROUTES = { import: '/', canvas: '/canvas', controller: '/controller' };
const ROUTE_TO_PAGE = { '/': 'import', '/canvas': 'canvas', '/controller': 'controller' };

const loadSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return null;
};

const getInitialPage = (saved) => {
  const hash = window.location.hash.replace('#', '') || '/';
  const fromUrl = ROUTE_TO_PAGE[hash];
  if (fromUrl && fromUrl !== 'import') return fromUrl;
  if (saved?.page === "canvas" || saved?.page === "controller") return saved.page;
  return "import";
};

function App() {
  const saved = loadSaved();
  const [page, setPageRaw] = useState(() => getInitialPage(saved));
  const [schema, setSchema] = useState(saved?.schema || null);
  const [controllers, setControllers] = useState(saved?.controllers || []);
  const [views, setViews] = useState(saved?.views || []);
  const [canvasState, setCanvasState] = useState(saved?.canvasState || null);

  // Virtual routing — sync URL hash with page state
  const setPage = useCallback((p) => {
    setPageRaw(p);
    window.history.pushState(null, '', '#' + (ROUTES[p] || '/'));
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      const p = ROUTE_TO_PAGE[hash] || 'import';
      setPageRaw(p);
    };
    window.addEventListener('popstate', onPop);
    // Set initial hash
    if (!window.location.hash) window.history.replaceState(null, '', '#/');
    else window.history.replaceState(null, '', '#' + (ROUTES[page] || '/'));
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Auto-save to localStorage on every state change
  useEffect(() => {
    const data = { page, schema, controllers, views, canvasState, savedAt: Date.now() };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { /* quota exceeded */ }
  }, [page, schema, controllers, views, canvasState]);

  const handleParse = useCallback((d) => { setSchema(d); setCanvasState(null); setPage("canvas"); }, [setPage]);
  const handleResume = useCallback(() => { if (schema) setPage("canvas"); }, [schema, setPage]);
  const handleClearSaved = useCallback(() => { localStorage.removeItem(STORAGE_KEY); setSchema(null); setControllers([]); setViews([]); setCanvasState(null); setPage("import"); }, [setPage]);

  if (page === "controller") return <ControllerPage controllers={controllers} views={views} tables={schema?.tables || []} relations={schema?.relations || []} onControllers={setControllers} onViews={setViews} onBack={() => setPage("canvas")} />;
  if (page === "canvas" && schema) return <CanvasPage schema={schema} controllers={controllers} views={views} onControllers={setControllers} onViews={setViews} onBack={() => setPage("import")} onGoController={() => setPage("controller")} savedCanvasState={canvasState} onCanvasState={setCanvasState} />;
  return <ImportPage onParse={handleParse} hasSaved={!!schema} onResume={handleResume} onClearSaved={handleClearSaved} savedInfo={schema ? { tables: schema.tables.length, relations: schema.relations.length } : null} />;
}

export default App;
