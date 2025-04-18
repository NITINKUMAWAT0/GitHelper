import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import React from 'react';
import { cn } from '@/lib/utils'; // Ensure your project has a `cn` utility

interface Props {
  filesReferences: { fileName: string; sourceCode: string; summary: string }[];
}

const CodeReferences = ({ filesReferences }: Props) => {
  const [tab, setTab] = React.useState(filesReferences[0].fileName);

  const selectedFile = filesReferences.find((file) => file.fileName === tab);

  return (
    <Tabs value={tab} onValueChange={setTab} className="w-full">
      <div className="overflow-x-auto flex gap-2 bg-gray-200 p-1 rounded-md">
        {filesReferences.map((file) => (
          <Button
            key={file.fileName}
            onClick={() => setTab(file.fileName)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap text-muted-foreground hover:bg-muted',
              {
                'bg-primary text-primary-foreground': tab === file.fileName,
              }
            )}
          >
            {file.fileName}
          </Button>
        ))}
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded-md">
        <h2 className="text-lg font-semibold mb-2">{selectedFile?.fileName}</h2>
        <pre className="bg-white p-4 rounded overflow-x-auto text-sm">
          <code>{selectedFile?.sourceCode}</code>
        </pre>
        <div className="mt-4 text-sm text-muted-foreground">
          <strong>Summary:</strong> {selectedFile?.summary}
        </div>
      </div>
    </Tabs>
  );
};

export default CodeReferences;
