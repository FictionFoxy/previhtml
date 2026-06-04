import { ColorSchemeToggle } from '../components/ColorSchemeToggle/ColorSchemeToggle';
import { Welcome } from '../components/Welcome/Welcome';
import { Editor } from '../components/Editor/Editor';

export function HomePage() {
  return (
    <>
      <Welcome />
      <Editor />
      <ColorSchemeToggle />
    </>
  );
}
